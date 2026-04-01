/**
 * Módulo Sprints - Repositorio
 * Único punto de acceso a datos de sprints.
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");

function getSprintModel() {
  const { Sprint } = getModels();
  if (!Sprint) throw new Error("Modelo Sprint no registrado en loadModels");
  return Sprint;
}

async function create(payload) {
  const Sprint = getSprintModel();
  return Sprint.create(payload);
}

async function findById(id, options = {}) {
  const Sprint = getSprintModel();
  return Sprint.findByPk(id, options);
}

async function list({ projectId, page = 1, limit = 10, status } = {}) {
  const Sprint = getSprintModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (projectId) where.project_id = projectId;
  if (status) where.status = status;

  const { rows, count } = await Sprint.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const Sprint = getSprintModel();
  const [affected] = await Sprint.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

async function countStoriesBySprintId(sprintId) {
  const { UserStory } = getModels();
  return UserStory.count({ where: { sprint_id: sprintId } });
}

async function remove(id) {
  const Sprint = getSprintModel();
  const n = await Sprint.destroy({ where: { id } });
  return n > 0;
}

/**
 * Cuenta sprints por proyecto y estado. excludeId excluye un sprint (p. ej. al activar el actual).
 */
async function countByProjectStatus(projectId, status, { excludeId } = {}) {
  const Sprint = getSprintModel();
  const where = { project_id: projectId, status };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  return Sprint.count({ where });
}

module.exports = {
  create,
  findById,
  list,
  update,
  countStoriesBySprintId,
  countByProjectStatus,
  remove
};
