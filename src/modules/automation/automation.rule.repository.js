"use strict";

const { getModels } = require("../../infrastructure/db/loadModels");

function getRuleModel() {
  const { AutomationRule } = getModels();
  if (!AutomationRule) throw new Error("AutomationRule no registrado en loadModels");
  return AutomationRule;
}

async function findActiveRulesByTenantAndEvent(tenantId, eventType) {
  if (!tenantId || !eventType) return [];
  const AutomationRule = getRuleModel();
  return AutomationRule.findAll({
    where: {
      tenant_id: tenantId,
      event_type: eventType,
      is_active: true
    },
    order: [
      ["priority", "DESC"],
      ["created_at", "ASC"]
    ]
  });
}

async function createRule({ tenantId, name, description, eventType, conditions, actions, isActive = true, priority = 0 }) {
  const AutomationRule = getRuleModel();
  return AutomationRule.create({
    tenant_id: tenantId,
    name,
    description: description ?? null,
    event_type: eventType,
    conditions: conditions ?? [],
    actions: actions ?? [],
    is_active: isActive,
    priority
  });
}

module.exports = {
  findActiveRulesByTenantAndEvent,
  createRule
};

