/**
 * Módulo Backlog - Repositorio Feature
 * Único punto de acceso a datos de features.
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getFeatureModel() {
  const { Feature } = getModels();
  if (!Feature) throw new Error("Modelo Feature no registrado en loadModels");
  return Feature;
}

async function create(payload) {
  const Feature = getFeatureModel();
  return Feature.create(payload);
}

async function findById(id, options = {}) {
  const Feature = getFeatureModel();
  return Feature.findByPk(id, options);
}

async function listByProject(projectId, { page = 1, limit = 10, status } = {}) {
  const Feature = getFeatureModel();
  const offset = (page - 1) * limit;
  const where = { project_id: projectId };
  if (status) where.status = status;

  const { rows, count } = await Feature.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const Feature = getFeatureModel();
  const [affected] = await Feature.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

async function updateReleaseIdToNull(releaseId) {
  const Feature = getFeatureModel();
  await Feature.update({ release_id: null }, { where: { release_id: releaseId } });
}

module.exports = {
  create,
  findById,
  listByProject,
  update,
  updateReleaseIdToNull
};
