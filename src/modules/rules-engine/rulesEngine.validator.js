function validateEvaluatePayload(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  return {
    valid: true,
    value: {
      tenant_id: p.tenant_id || null,
      entity_type: p.entity_type || null,
      hook: p.hook || null,
      facts: p.facts && typeof p.facts === "object" ? p.facts : {}
    },
    errors: []
  };
}

module.exports = {
  validateEvaluatePayload
};
