"use strict";

const logger = require("../../config/logger");
const { getModels } = require("../../infrastructure/db/loadModels");
const { parseTextToRule } = require("./ai.rule.parser.engine");

const SUPPORTED_ACTION_TYPES = ["assign_user", "change_status", "send_notification", "link_delivery", "add_comment"];
const SUPPORTED_EVENT_TYPES = ["WORK_ORDER_CREATED", "WORK_ORDER_UPDATED", "WORK_ORDER_STATUS_CHANGED", "WORK_ORDER_ASSIGNED", "DELIVERY_LINKED", "DELIVERY_DELETED"];

function normalizeRuleOutput(rule) {
  return {
    event_type: rule?.event_type ?? null,
    conditions: Array.isArray(rule?.conditions) ? rule.conditions : [],
    actions: Array.isArray(rule?.actions) ? rule.actions : [],
    confidence_score: typeof rule?.confidence_score === "number" ? rule.confidence_score : 0,
    warnings: Array.isArray(rule?.warnings) ? rule.warnings : []
  };
}

function validateRuleShape(rule) {
  const warnings = [];

  if (!rule.event_type) warnings.push("event ambiguous");

  if (rule.event_type && !SUPPORTED_EVENT_TYPES.includes(rule.event_type)) warnings.push("event type not supported");

  for (const action of rule.actions) {
    if (!action || !action.type) warnings.push("invalid action shape");
    if (action?.type && !SUPPORTED_ACTION_TYPES.includes(action.type)) warnings.push("action type not supported: " + action.type);
    if (action?.type === "assign_user") {
      const uid = action?.payload?.user_id;
      if (!uid) warnings.push("missing action target");
    }
    if (action?.type === "link_delivery") {
      const did = action?.payload?.delivery_id;
      if (!did) warnings.push("missing action target");
    }
    if (action?.type === "change_status") {
      const st = action?.payload?.status;
      if (!st) warnings.push("missing action target");
    }
  }

  if (!rule.actions.length) warnings.push("missing action");

  return warnings;
}

async function buildContextForTenant(tenantId) {
  const { User, Role } = getModels();
  if (!tenantId) return { available_users: [], available_events: [], available_actions: [] };

  const users = await User.findAll({
    where: { organization_id: tenantId },
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    attributes: ["id", "name", "role_id", "organization_id"]
  });

  const available_users = users.map((u) => {
    const plain = typeof u.toJSON === "function" ? u.toJSON() : u;
    return {
      id: plain.id,
      role: plain.role?.name || null,
      name: plain.name || null
    };
  });

  return {
    available_users,
    available_events: SUPPORTED_EVENT_TYPES,
    available_actions: SUPPORTED_ACTION_TYPES
  };
}

async function parseRuleFromNaturalLanguage({ text, tenant_id, context }) {
  const baseContext = context || (tenant_id ? await buildContextForTenant(tenant_id) : null);

  let parsed = null;
  try {
    parsed = await parseTextToRule({
      text,
      context: baseContext
    });
  } catch (err) {
    logger.warn({ err: err && err.message ? err.message : String(err) }, "AI rule parsing failed");
    return {
      event_type: null,
      conditions: [],
      actions: [],
      confidence_score: 0,
      warnings: ["parser failure"]
    };
  }

  const normalized = normalizeRuleOutput(parsed);
  const shapeWarnings = validateRuleShape(normalized);
  const warnings = Array.from(new Set([...(normalized.warnings || []), ...(shapeWarnings || [])]));

  // Ajuste: si hay warnings graves, bajar confianza.
  let confidence_score = normalized.confidence_score;
  const hardFailWarnings = warnings.some((w) => String(w).toLowerCase().includes("missing action target") || String(w).toLowerCase().includes("event ambiguous"));
  if (hardFailWarnings) confidence_score = Math.min(confidence_score, 0.45);

  return {
    ...normalized,
    warnings,
    confidence_score
  };
}

module.exports = {
  parseRuleFromNaturalLanguage
};

