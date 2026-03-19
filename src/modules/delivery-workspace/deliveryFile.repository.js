/**
 * Delivery Workspace — Repositorio delivery_files
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getDeliveryFileModel() {
  const { DeliveryFile } = getModels();
  if (!DeliveryFile) throw new Error("DeliveryFile no registrado");
  return DeliveryFile;
}

async function listByDelivery(deliveryId, projectId) {
  const DeliveryFile = getDeliveryFileModel();
  return DeliveryFile.findAll({
    where: { delivery_id: deliveryId, project_id: projectId },
    order: [["file_path", "ASC"]]
  });
}

async function create(payload, { transaction } = {}) {
  const DeliveryFile = getDeliveryFileModel();
  return DeliveryFile.create(payload, { transaction: transaction || undefined });
}

async function findByIdAndDelivery(fileId, deliveryId, projectId) {
  const DeliveryFile = getDeliveryFileModel();
  return DeliveryFile.findOne({
    where: { id: fileId, delivery_id: deliveryId, project_id: projectId }
  });
}

async function update(fileId, deliveryId, projectId, payload, { transaction } = {}) {
  const DeliveryFile = getDeliveryFileModel();
  const [n] = await DeliveryFile.update(payload, {
    where: { id: fileId, delivery_id: deliveryId, project_id: projectId },
    transaction: transaction || undefined
  });
  return n > 0;
}

async function remove(fileId, deliveryId, projectId, { transaction } = {}) {
  const DeliveryFile = getDeliveryFileModel();
  const n = await DeliveryFile.destroy({
    where: { id: fileId, delivery_id: deliveryId, project_id: projectId },
    transaction: transaction || undefined
  });
  return n > 0;
}

async function removeAllByDelivery(deliveryId, projectId, { transaction } = {}) {
  const DeliveryFile = getDeliveryFileModel();
  return DeliveryFile.destroy({
    where: { delivery_id: deliveryId, project_id: projectId },
    transaction: transaction || undefined
  });
}

module.exports = {
  listByDelivery,
  create,
  findByIdAndDelivery,
  update,
  remove,
  removeAllByDelivery
};
