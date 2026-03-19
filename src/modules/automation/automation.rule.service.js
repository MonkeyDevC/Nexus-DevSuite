"use strict";

const automationRuleRepository = require("./automation.rule.repository");

async function getActiveRulesForEvent(tenantId, eventType) {
  return automationRuleRepository.findActiveRulesByTenantAndEvent(tenantId, eventType);
}

module.exports = {
  getActiveRulesForEvent
};

