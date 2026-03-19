/**
 * Módulo Code Deliveries - Repositorio
 * Único punto de acceso a datos de code_deliveries. Aislamiento por project_id.
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getCodeDeliveryModel() {
  const { CodeDelivery } = getModels();
  if (!CodeDelivery) throw new Error("Modelo CodeDelivery no registrado en loadModels");
  return CodeDelivery;
}

async function getMaxDeliveryNumberByProject(projectId, transaction) {
  const CodeDelivery = getCodeDeliveryModel();
  const r = await CodeDelivery.max("delivery_number", {
    where: { project_id: projectId },
    transaction: transaction || undefined
  });
  return r == null ? 0 : Number(r);
}

async function create(payload, transaction) {
  const CodeDelivery = getCodeDeliveryModel();
  return CodeDelivery.create(payload, { transaction: transaction || undefined });
}

async function findById(id, options = {}) {
  const CodeDelivery = getCodeDeliveryModel();
  return CodeDelivery.findByPk(id, options);
}

async function findByIdAndProject(id, projectId, options = {}) {
  const CodeDelivery = getCodeDeliveryModel();
  return CodeDelivery.findOne({
    where: { id, project_id: projectId },
    ...options
  });
}

async function listByProject(projectId, { page = 1, limit = 20, status, task_id, user_story_id } = {}) {
  const CodeDelivery = getCodeDeliveryModel();
  const offset = (page - 1) * limit;
  const where = { project_id: projectId };
  if (status) where.status = status;
  if (task_id) where.task_id = task_id;
  if (user_story_id) where.user_story_id = user_story_id;

  const { rows, count } = await CodeDelivery.findAndCountAll({
    where,
    limit,
    offset,
    order: [["delivery_number", "DESC"]]
  });
  return { items: rows, total: count };
}

async function listByTask(taskId, projectId, { page = 1, limit = 50 } = {}) {
  const CodeDelivery = getCodeDeliveryModel();
  const offset = (page - 1) * limit;
  const where = { task_id: taskId, project_id: projectId };

  const { rows, count } = await CodeDelivery.findAndCountAll({
    where,
    limit,
    offset,
    order: [["delivery_number", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, projectId, payload, { transaction } = {}) {
  const CodeDelivery = getCodeDeliveryModel();
  const [affected] = await CodeDelivery.update(payload, { where: { id, project_id: projectId }, transaction: transaction || undefined });
  if (!affected) return null;
  return findById(id, { transaction: transaction || undefined });
}

module.exports = {
  getMaxDeliveryNumberByProject,
  create,
  findById,
  findByIdAndProject,
  listByProject,
  listByTask,
  update
};
