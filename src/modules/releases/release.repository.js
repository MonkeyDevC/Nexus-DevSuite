/**
 * Módulo Releases - Repositorio
 * Único punto de acceso a datos de releases.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { compareSemVer } = require("./semver.validator");

function getReleaseModel() {
  const { Release } = getModels();
  if (!Release) throw new Error("Modelo Release no registrado en loadModels");
  return Release;
}

async function create(payload) {
  const Release = getReleaseModel();
  return Release.create(payload);
}

async function findById(id, options = {}) {
  const Release = getReleaseModel();
  return Release.findByPk(id, options);
}

async function findByVersion(version) {
  const Release = getReleaseModel();
  return Release.findOne({ where: { version } });
}

async function list({ page = 1, limit = 10, status, organizationId } = {}) {
  const Release = getReleaseModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (organizationId != null) where.organization_id = organizationId;
  if (status) where.status = status;

  const { rows, count } = await Release.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

/**
 * Obtiene todas las releases en estado RELEASED y devuelve la de mayor versión (comparación semántica).
 */
async function findLatestReleased() {
  const Release = getReleaseModel();
  const rows = await Release.findAll({
    where: { status: "RELEASED" },
    order: [["released_at", "DESC"]]
  });
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => compareSemVer(b.version, a.version));
  return sorted[0];
}

async function update(id, payload) {
  const Release = getReleaseModel();
  const [affected] = await Release.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

async function countFeaturesByReleaseId(releaseId) {
  const { Feature } = getModels();
  return Feature.count({ where: { release_id: releaseId } });
}

async function deleteById(id) {
  const Release = getReleaseModel();
  const n = await Release.destroy({ where: { id } });
  return n > 0;
}

module.exports = {
  create,
  findById,
  findByVersion,
  list,
  findLatestReleased,
  update,
  countFeaturesByReleaseId,
  deleteById
};
