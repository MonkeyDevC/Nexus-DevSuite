/**
 * Delivery Workspace — Repositorio delivery_commits
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getDeliveryCommitModel() {
  const { DeliveryCommit } = getModels();
  if (!DeliveryCommit) throw new Error("DeliveryCommit no registrado");
  return DeliveryCommit;
}

async function create(payload, { transaction } = {}) {
  const DeliveryCommit = getDeliveryCommitModel();
  return DeliveryCommit.create(payload, { transaction: transaction || undefined });
}

async function listByDelivery(deliveryId, projectId, { limit = 50 } = {}) {
  const DeliveryCommit = getDeliveryCommitModel();
  return DeliveryCommit.findAll({
    where: { delivery_id: deliveryId, project_id: projectId },
    order: [["created_at", "DESC"]],
    limit
  });
}

module.exports = {
  create,
  listByDelivery
};
