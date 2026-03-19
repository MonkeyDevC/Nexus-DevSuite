/**
 * Módulo Work Orders - Repositorio
 * Aislamiento por project_id.
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getWorkOrderModel() {
  const { WorkOrder } = getModels();
  if (!WorkOrder) throw new Error("Modelo WorkOrder no registrado en loadModels");
  return WorkOrder;
}

async function getMaxOtNumberByProject(projectId, transaction) {
  const WorkOrder = getWorkOrderModel();
  const r = await WorkOrder.max("ot_number", {
    where: { project_id: projectId },
    transaction: transaction || undefined
  });
  return r == null ? 0 : Number(r);
}

async function create(payload, transaction) {
  const WorkOrder = getWorkOrderModel();
  return WorkOrder.create(payload, { transaction: transaction || undefined });
}

async function findById(id, options = {}) {
  const WorkOrder = getWorkOrderModel();
  return WorkOrder.findOne({
    where: { id, deleted_at: null },
    ...options
  });
}

async function findByIdAndProject(id, projectId, options = {}) {
  const WorkOrder = getWorkOrderModel();
  return WorkOrder.findOne({
    where: { id, project_id: projectId, deleted_at: null },
    ...options
  });
}

async function listByProject(projectId, { page = 1, limit = 20, status, user_story_id } = {}) {
  const WorkOrder = getWorkOrderModel();
  const offset = (page - 1) * limit;
  const where = { project_id: projectId, deleted_at: null };
  if (status) where.status = status;
  if (user_story_id) where.user_story_id = user_story_id;

  const { rows, count } = await WorkOrder.findAndCountAll({
    where,
    limit,
    offset,
    order: [["ot_number", "DESC"]]
  });
  return { items: rows, total: count };
}

async function listByUserStory(userStoryId, projectId, { page = 1, limit = 50 } = {}) {
  const WorkOrder = getWorkOrderModel();
  const offset = (page - 1) * limit;
  const where = { user_story_id: userStoryId, project_id: projectId, deleted_at: null };

  const { rows, count } = await WorkOrder.findAndCountAll({
    where,
    limit,
    offset,
    order: [["ot_number", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, projectId, payload, { transaction, expectedVersion } = {}) {
  const WorkOrder = getWorkOrderModel();
  const where = { id, project_id: projectId, deleted_at: null };
  if (expectedVersion !== undefined) where.version = expectedVersion;

  const [affected] = await WorkOrder.update(payload, { where, transaction: transaction || undefined });
  if (!affected) return null;
  return WorkOrder.findOne({ where: { id, deleted_at: null }, transaction: transaction || undefined });
}

async function deleteWorkOrder(id, projectId, { transaction, expectedVersion } = {}) {
  const WorkOrder = getWorkOrderModel();
  const where = { id, project_id: projectId, deleted_at: null };
  if (expectedVersion !== undefined) where.version = expectedVersion;
  const [affected] = await WorkOrder.update(
    { deleted_at: new Date() },
    { where, transaction: transaction || undefined }
  );
  return affected > 0;
}

async function getByProject(projectId) {
  const WorkOrder = getWorkOrderModel();
  return WorkOrder.findAll({
    where: { project_id: projectId },
    order: [["ot_number", "DESC"]]
  });
}

module.exports = {
  getMaxOtNumberByProject,
  create,
  createWorkOrder: create,
  findById,
  getById: findById,
  findByIdAndProject,
  listByProject,
  listByUserStory,
  update,
  updateWorkOrder: update,
  deleteWorkOrder,
  getByProject
};
