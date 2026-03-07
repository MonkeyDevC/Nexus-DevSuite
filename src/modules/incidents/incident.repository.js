/**
 * Módulo Incidents - Repositorio
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getIncidentModel() {
  const { Incident } = getModels();
  if (!Incident) throw new Error("Modelo Incident no registrado en loadModels");
  return Incident;
}

async function create(payload) {
  const Incident = getIncidentModel();
  return Incident.create(payload);
}

async function findById(id, options = {}) {
  const Incident = getIncidentModel();
  return Incident.findByPk(id, options);
}

async function list({ projectId, page = 1, limit = 10, status } = {}) {
  const Incident = getIncidentModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (projectId) where.project_id = projectId;
  if (status) where.status = status;

  const { rows, count } = await Incident.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const Incident = getIncidentModel();
  const [affected] = await Incident.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  create,
  findById,
  list,
  update
};
