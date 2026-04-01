/**
 * ----
 * Módulo: Rules Orchestrator Service
 * Descripción: Punto único para resolver reglas por contexto, ejecutar rules-engine y persistir historial.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const rulesEngineService = require("./rulesEngine.service");
const { getRuleConfig } = require("./rulesConfig");
const rulesExecutionService = require("../rules-executions/rulesExecution.service");
const { getModels } = require("../../infrastructure/db/loadModels");
const logger = require("../../config/logger");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { randomUUID } = require("crypto");

function normalizeWorkflowRuleConditions(rawConditions) {
  if (!rawConditions || typeof rawConditions !== "object") return [];
  if (Array.isArray(rawConditions)) return { AND: rawConditions };
  if (rawConditions.AND || rawConditions.OR || rawConditions.NOT) return rawConditions;
  if (Array.isArray(rawConditions.conditions)) return { AND: rawConditions.conditions };
  return { AND: [rawConditions] };
}

function toEngineRuleFromWorkflowRule(workflowRule) {
  return {
    type: workflowRule.rule_type === "warn" ? "warn" : "block",
    conditions: normalizeWorkflowRuleConditions(workflowRule.conditions),
    message: workflowRule.message
  };
}

const UX_FIELD_MESSAGES = {
  "sprint.status": "El sprint debe estar IN_PROGRESS",
  "story.status": "La historia debe estar en READY"
};

function toUxMessageByField(field, fallbackMessage) {
  return UX_FIELD_MESSAGES[field] || fallbackMessage || "Regla de validación no cumplida";
}

function normalizeEngineIssuesForUx(items, defaultCode) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const field = item && item.path ? String(item.path) : null;
    return {
      code: defaultCode,
      message: toUxMessageByField(field, item && item.message ? String(item.message) : null),
      field
    };
  });
}

function deriveGuidanceFromErrors(errors) {
  const guidance = [];
  for (const error of Array.isArray(errors) ? errors : []) {
    if (error && error.field) {
      const msg = toUxMessageByField(error.field);
      if (msg && !guidance.includes(msg)) guidance.push(msg);
    }
  }
  return guidance;
}

async function getRulesFromWorkflow(workflowId, entityType, action) {
  if (!workflowId) return null;
  const { WorkflowDefinition, WorkflowNode, WorkflowRule } = getModels();
  const workflow = await WorkflowDefinition.findByPk(workflowId);
  if (!workflow || workflow.status !== "active") {
    return null;
  }
  const nodes = await WorkflowNode.findAll({ where: { workflow_id: workflowId } });
  if (!nodes.length) return null;
  const nodeIds = nodes.map((n) => n.id);
  const rules = await WorkflowRule.findAll({
    where: { node_id: nodeIds },
    order: [["created_at", "ASC"]]
  });
  if (!rules.length) return null;

  const filtered = rules.filter((r) => {
    const c = r.conditions && typeof r.conditions === "object" ? r.conditions : {};
    if (!c.entityType && !c.action) return true;
    const matchesEntity = !c.entityType || String(c.entityType) === String(entityType);
    const matchesAction = !c.action || String(c.action) === String(action);
    return matchesEntity && matchesAction;
  });
  if (!filtered.length) return null;

  return {
    source: "workflow",
    name: action,
    userMessage:
      filtered.find((r) => String(r.rule_type).toLowerCase() === "block")?.message ||
      "Regla de workflow bloqueó la transición",
    guidance: [],
    rules: filtered.map(toEngineRuleFromWorkflowRule)
  };
}

function sortRulesDeterministically(rules) {
  return (rules || [])
    .map((rule, idx) => ({ rule, idx }))
    .sort((a, b) => {
      const pA = Number.isInteger(a.rule.priority) ? a.rule.priority : 1000;
      const pB = Number.isInteger(b.rule.priority) ? b.rule.priority : 1000;
      if (pA !== pB) return pA - pB;
      const mA = String(a.rule.message || "");
      const mB = String(b.rule.message || "");
      if (mA !== mB) return mA.localeCompare(mB);
      return a.idx - b.idx;
    })
    .map((x) => x.rule);
}

async function resolveRules({ workflowId, entityType, action, rulesOverride = null, userMessageOverride = null }) {
  if (Array.isArray(rulesOverride)) {
    return {
      source: "override",
      name: action,
      userMessage: userMessageOverride || "Rule validation failed",
      guidance: [],
      rules: sortRulesDeterministically(rulesOverride)
    };
  }
  const workflowConfig = await getRulesFromWorkflow(workflowId, entityType, action);
  if (workflowConfig) {
    return {
      source: "workflow",
      name: workflowConfig.name || action,
      userMessage: workflowConfig.userMessage,
      guidance: Array.isArray(workflowConfig.guidance) ? workflowConfig.guidance : [],
      rules: sortRulesDeterministically(workflowConfig.rules)
    };
  }
  const fallbackConfig = getRuleConfig(action);
  return {
    source: "rulesConfig",
    name: fallbackConfig.name || action,
    userMessage: fallbackConfig.userMessage,
    guidance: Array.isArray(fallbackConfig.guidance) ? fallbackConfig.guidance : [],
    rules: sortRulesDeterministically(fallbackConfig.rules)
  };
}

function assertContext(context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    throw new AppError("Invalid context for rule evaluation", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
}

async function execute({ entityType, entityId, action, context, workflowId, requestContext = {}, rulesOverride = null, userMessageOverride = null }) {
  if (!entityType || !entityId || !action) {
    throw new AppError("Parámetros incompletos para rules orchestrator", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  assertContext(context);

  const selected = await resolveRules({ workflowId, entityType, action, rulesOverride, userMessageOverride });

  const engineResult = await rulesEngineService.evaluateRules(context, selected.rules);
  const uxErrors = normalizeEngineIssuesForUx(engineResult.errors, "RULE_BLOCKED");
  const uxWarnings = normalizeEngineIssuesForUx(engineResult.warnings, "RULE_WARNING");
  const derivedGuidance = [...deriveGuidanceFromErrors(uxErrors), ...deriveGuidanceFromErrors(uxWarnings)]
    .filter((value, index, arr) => arr.indexOf(value) === index);
  const guidance = selected.guidance && selected.guidance.length > 0 ? selected.guidance : derivedGuidance;
  const executionId = randomUUID();

  await rulesExecutionService.createExecutionLog({
    execution_id: executionId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    tenant_id: requestContext.organizationId || null,
    target_entity: entityType,
    trigger_event: action,
    request_id: requestContext.requestId || null,
    actor_user_id: requestContext.user && requestContext.user.id ? requestContext.user.id : null,
    rule_name: action,
    allowed: engineResult.allowed,
    errors: uxErrors,
    warnings: uxWarnings
  });

  logger.info({
    event: "RULE_ORCHESTRATOR_EXECUTED",
    execution_id: executionId,
    rule: action,
    source: selected.source,
    entity_type: entityType,
    entity_id: entityId,
    allowed: Boolean(engineResult.allowed),
    errors: uxErrors.length,
    warnings: uxWarnings.length
  });

  return {
    executionId,
    allowed: Boolean(engineResult.allowed),
    errors: uxErrors,
    warnings: uxWarnings,
    rule: {
      name: selected.name || action,
      userMessage: selected.userMessage,
      guidance: !Boolean(engineResult.allowed) ? guidance : guidance
    }
  };
}

module.exports = {
  execute,
  resolveRules
};
