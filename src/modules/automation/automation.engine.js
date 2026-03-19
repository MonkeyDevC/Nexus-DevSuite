"use strict";

const logger = require("../../config/logger");

const { evaluateConditions } = require("./automation.conditions");
const { executeAction } = require("./automation.actions");
const automationRuleRepository = require("./automation.rule.repository");

const { getModels } = require("../../infrastructure/db/loadModels");

let cache = new Map(); // key -> { ts, rules }
const CACHE_TTL_MS = 1500;

function cacheKey(tenantId, eventType) {
  return `${tenantId}::${eventType}`;
}

function nowMs() {
  return Date.now();
}

function getTenantIdFromEvent(event) {
  return (
    (event && (event.tenant_id || (event.meta && event.meta.tenant_id) || (event.meta && event.meta.organizationId))) ||
    null
  );
}

function shouldSkipEvent(event) {
  // Anti-bucle: ignoramos eventos generados por el propio motor.
  return Boolean(event && event.meta && event.meta.source === "automation_engine");
}

async function getExecutionsModel() {
  const { AutomationRuleExecution } = getModels();
  if (!AutomationRuleExecution) throw new Error("AutomationRuleExecution no registrado en loadModels");
  return AutomationRuleExecution;
}

function normalizeRuleConditions(rule) {
  if (!rule) return [];
  if (!rule.conditions) return [];
  if (Array.isArray(rule.conditions)) return rule.conditions;
  return [];
}

function normalizeRuleActions(rule) {
  if (!rule || !rule.actions) return [];
  if (Array.isArray(rule.actions)) return rule.actions;
  return [];
}

function buildActionContext({ event, tenantId, rule, ruleExecutionId }) {
  // contextForService: se usa para multi-tenant y para etiquetar la fuente del evento.
  return {
    rule_id: rule.id,
    work_order_id: event.payload.work_order_id || event.payload.id || null,
    project_id: event.payload.project_id || null,
    delivery_id: event.payload.delivery_id || null,
    actor_user_id: event.payload.actor_user_id || null,
    created_by_user_id: event.payload.created_by_user_id || null,
    assigned_to_user_id: event.payload.assigned_to_user_id || null,
    priority: event.payload.priority || null,
    status: event.payload.status || null,
    contextForService: {
      organizationId: tenantId,
      user: event.payload.actor_user || null,
      requestId: event.meta && event.meta.request_id ? event.meta.request_id : null,
      meta: {
        source: "automation_engine",
        rule_execution_id: ruleExecutionId
      }
    }
  };
}

async function processEvent(event) {
  if (!event || !event.event_type) return;
  if (shouldSkipEvent(event)) return;

  const tenantId = getTenantIdFromEvent(event);
  if (!tenantId) return;

  const eventType = event.event_type;

  const key = cacheKey(tenantId, eventType);
  const cached = cache.get(key);
  let rules = null;
  if (cached && nowMs() - cached.ts < CACHE_TTL_MS) {
    rules = cached.rules;
  } else {
    rules = await automationRuleRepository.findActiveRulesByTenantAndEvent(tenantId, eventType);
    cache.set(key, { ts: nowMs(), rules });
  }

  if (!rules || rules.length === 0) return;

  const AutomationRuleExecution = await getExecutionsModel();

  // Ejecutamos reglas secuencialmente por prioridad para determinismo.
  for (const rule of rules) {
    const executionStarted = nowMs();
    const ruleExecutionId = null; // opcional en DB; para anti-bucle usamos meta.source
    const conditions = normalizeRuleConditions(rule);
    let shouldRun = true;
    try {
      shouldRun = evaluateConditions(conditions, event.payload);
    } catch (err) {
      shouldRun = false;
      logger.warn({ err: err && err.message ? err.message : String(err), rule_id: rule.id, event_type: eventType }, "Error evaluando conditions");
    }

    if (!shouldRun) continue;

    const actions = normalizeRuleActions(rule);
    const result = {
      success: true,
      error_message: null,
      execution_time_ms: 0
    };

    try {
      for (const action of actions) {
        const actionResult = await executeAction(action, buildActionContext({ event, tenantId, rule, ruleExecutionId }));
        if (!actionResult || !actionResult.ok) {
          throw new Error(actionResult && actionResult.error ? actionResult.error : "Acción falló");
        }
      }
    } catch (err) {
      result.success = false;
      result.error_message = err && err.message ? err.message : String(err);
      logger.warn(
        { err: result.error_message, rule_id: rule.id, event_type: eventType },
        "Automation rule execution failed"
      );
    } finally {
      result.execution_time_ms = nowMs() - executionStarted;
    }

    // Auditoría
    try {
      await AutomationRuleExecution.create({
        rule_id: rule.id,
        event_type: eventType,
        success: result.success,
        error_message: result.error_message,
        execution_time_ms: result.execution_time_ms
      });
    } catch (err) {
      // Auditoría no debe romper el motor.
      logger.warn({ err: err && err.message ? err.message : String(err), rule_id: rule.id }, "No se pudo registrar automation execution");
    }
  }
}

module.exports = {
  processEvent
};

