/**
 * Módulo Documents - Repositorio DocumentVersion
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");

function getDocumentVersionModel() {
  const { DocumentVersion } = getModels();
  if (!DocumentVersion) throw new Error("Modelo DocumentVersion no registrado en loadModels");
  return DocumentVersion;
}

async function create(payload, options = {}) {
  const DocumentVersion = getDocumentVersionModel();
  return DocumentVersion.create(payload, options);
}

async function findById(id, options = {}) {
  const DocumentVersion = getDocumentVersionModel();
  return DocumentVersion.findByPk(id, options);
}

async function listByDocumentId(documentId, { status, limit = 100 } = {}) {
  const DocumentVersion = getDocumentVersionModel();
  const where = { document_id: documentId };
  if (status) where.status = status;
  const rows = await DocumentVersion.findAll({
    where,
    order: [["version_number", "DESC"]],
    limit: limit || 100
  });
  return rows;
}

async function getMaxVersionNumber(documentId, options = {}) {
  const DocumentVersion = getDocumentVersionModel();
  const result = await DocumentVersion.max("version_number", {
    where: { document_id: documentId },
    ...options
  });
  return result == null ? 0 : result;
}

async function findLatestApprovedByDocumentId(documentId, options = {}) {
  const DocumentVersion = getDocumentVersionModel();
  return DocumentVersion.findOne({
    where: { document_id: documentId, status: "APPROVED" },
    order: [["version_number", "DESC"]],
    ...options
  });
}

async function update(id, payload, options = {}) {
  const DocumentVersion = getDocumentVersionModel();
  const [affected] = await DocumentVersion.update(payload, { where: { id }, ...options });
  if (!affected) return null;
  return findById(id, options);
}

/** Archivar todas las versiones APPROVED del documento excepto la indicada (versionIdToExclude). */
async function archiveApprovedVersionsExcept(documentId, versionIdToExclude, options = {}) {
  const DocumentVersion = getDocumentVersionModel();
  const where = { document_id: documentId, status: "APPROVED" };
  if (versionIdToExclude) where.id = { [Op.ne]: versionIdToExclude };
  const [affected] = await DocumentVersion.update(
    { status: "ARCHIVED" },
    { where, ...options }
  );
  return affected;
}

module.exports = {
  create,
  findById,
  listByDocumentId,
  getMaxVersionNumber,
  findLatestApprovedByDocumentId,
  update,
  archiveApprovedVersionsExcept
};
