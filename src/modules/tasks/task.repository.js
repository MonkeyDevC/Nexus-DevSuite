/**
 * Módulo Tasks - Repositorio
 * Único punto de acceso a datos de tasks. Aislamiento por project_id.
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getTaskModel() {
  const { Task } = getModels();
  if (!Task) throw new Error("Modelo Task no registrado en loadModels");
  return Task;
}

async function getMaxTaskNumberByProject(projectId, transaction) {
  const Task = getTaskModel();
  const r = await Task.max("task_number", {
    where: { project_id: projectId },
    transaction: transaction || undefined
  });
  return r == null ? 0 : Number(r);
}

async function create(payload, transaction) {
  const Task = getTaskModel();
  return Task.create(payload, { transaction: transaction || undefined });
}

async function findById(id, options = {}) {
  const Task = getTaskModel();
  return Task.findByPk(id, options);
}

async function findByIdAndProject(id, projectId, options = {}) {
  const Task = getTaskModel();
  return Task.findOne({
    where: { id, project_id: projectId },
    ...options
  });
}

async function listByProject(projectId, { page = 1, limit = 20, status, user_story_id, work_order_id } = {}) {
  const Task = getTaskModel();
  const offset = (page - 1) * limit;
  const where = { project_id: projectId };
  if (status) where.status = status;
  if (user_story_id) where.user_story_id = user_story_id;
  if (work_order_id) where.work_order_id = work_order_id;

  const { rows, count } = await Task.findAndCountAll({
    where,
    limit,
    offset,
    order: [["task_number", "ASC"]]
  });
  return { items: rows, total: count };
}

async function listByUserStory(userStoryId, projectId, { page = 1, limit = 50 } = {}) {
  const Task = getTaskModel();
  const offset = (page - 1) * limit;
  const where = { user_story_id: userStoryId, project_id: projectId };

  const { rows, count } = await Task.findAndCountAll({
    where,
    limit,
    offset,
    order: [["task_number", "ASC"]]
  });
  return { items: rows, total: count };
}

async function update(id, projectId, payload) {
  const Task = getTaskModel();
  const [affected] = await Task.update(payload, { where: { id, project_id: projectId } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  getMaxTaskNumberByProject,
  create,
  findById,
  findByIdAndProject,
  listByProject,
  listByUserStory,
  update
};
