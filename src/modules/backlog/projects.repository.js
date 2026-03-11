/**
 * Módulo Backlog - Repositorio Projects
 * Único punto de acceso a datos de proyectos.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { Op } = require("sequelize");

function getProjectModel() {
  const { Project } = getModels();
  if (!Project) throw new Error("Modelo Project no registrado en loadModels");
  return Project;
}

async function getMaxProjectNumber(transaction) {
  const Project = getProjectModel();
  const max = await Project.max("number", { transaction: transaction || undefined });
  return max != null ? max : 0;
}

async function create(payload, options = {}) {
  const Project = getProjectModel();
  return Project.create(payload, options);
}

async function findById(id, options = {}) {
  const Project = getProjectModel();
  return Project.findByPk(id, options);
}

async function findByNameAndOrganization(name, organizationId) {
  const Project = getProjectModel();
  return Project.findOne({ where: { name, organization_id: organizationId } });
}

async function findIdsByOrganization(organizationId) {
  const Project = getProjectModel();
  const rows = await Project.findAll({
    where: { organization_id: organizationId },
    attributes: ["id"]
  });
  return rows.map((r) => r.id);
}

async function list({ page = 1, limit = 10, status, organizationId } = {}) {
  const Project = getProjectModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (organizationId != null) where.organization_id = organizationId;
  if (status) where.status = status;

  const { rows, count } = await Project.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const Project = getProjectModel();
  const [affected] = await Project.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  create,
  findById,
  findByNameAndOrganization,
  findIdsByOrganization,
  getMaxProjectNumber,
  list,
  update
};
