function buildStatusChangeFacts(input) {
  const i = input && typeof input === "object" ? input : {};
  return {
    from_status: i.from_status || i.fromStatus || null,
    to_status: i.to_status || i.toStatus || null,
    entity_id: i.entity_id || i.entityId || null,
    metadata: i.metadata && typeof i.metadata === "object" ? i.metadata : {}
  };
}

module.exports = {
  buildStatusChangeFacts
};
