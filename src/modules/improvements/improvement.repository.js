/**
 * Módulo Improvements - Repositorio
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getImprovementModel() {
  const { Improvement } = getModels();
  if (!Improvement) throw new Error("Modelo Improvement no registrado en loadModels");
  return Improvement;
}

async function create(payload) {
  const Improvement = getImprovementModel();
  return Improvement.create(payload);
}

async function findById(id, options = {}) {
  const Improvement = getImprovementModel();
  return Improvement.findByPk(id, options);
}

async function list({ projectId, projectIds, incidentId, page = 1, limit = 10, status } = {}) {
  const { Op } = require("sequelize");
  const Improvement = getImprovementModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (projectIds && projectIds.length > 0) where.project_id = { [Op.in]: projectIds };
  else if (projectId) where.project_id = projectId;
  if (incidentId) where.incident_id = incidentId;
  if (status) where.status = status;

  const { rows, count } = await Improvement.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const Improvement = getImprovementModel();
  const [affected] = await Improvement.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  create,
  findById,
  list,
  update
};
