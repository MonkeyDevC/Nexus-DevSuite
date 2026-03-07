/**
 * Módulo Documents - Repositorio Document
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getDocumentModel() {
  const { Document } = getModels();
  if (!Document) throw new Error("Modelo Document no registrado en loadModels");
  return Document;
}

async function create(payload, options = {}) {
  const Document = getDocumentModel();
  return Document.create(payload, options);
}

async function findById(id, options = {}) {
  const Document = getDocumentModel();
  return Document.findByPk(id, options);
}

async function findByCode(code, options = {}) {
  const Document = getDocumentModel();
  return Document.findOne({ where: { code }, ...options });
}

async function list({ projectId, page = 1, limit = 10 } = {}) {
  const Document = getDocumentModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (projectId) where.project_id = projectId;

  const { rows, count } = await Document.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

module.exports = {
  create,
  findById,
  findByCode,
  list
};
