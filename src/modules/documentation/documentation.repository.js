/**
 * ----
 * Módulo: Documentation Repository
 * Descripción: Acceso a documentation_contents; sin lógica de negocio.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");

function getDocumentationContent() {
  const { DocumentationContent } = getModels();
  return DocumentationContent;
}

async function findByIdForOrg(id, organizationId) {
  const DocumentationContent = getDocumentationContent();
  return DocumentationContent.findOne({
    where: { id, organization_id: organizationId }
  });
}

async function findByScopeType(organizationId, projectId, type, excludeId = null) {
  const DocumentationContent = getDocumentationContent();
  const where = {
    organization_id: organizationId,
    type,
    status: "ACTIVE"
  };
  if (projectId == null) {
    where.project_id = { [Op.is]: null };
  } else {
    where.project_id = projectId;
  }
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  return DocumentationContent.findOne({ where });
}

async function listForOrg(organizationId, { project_id, type, status, page, limit }) {
  const DocumentationContent = getDocumentationContent();
  const where = { organization_id: organizationId };
  if (project_id !== undefined) {
    where.project_id = project_id === null || project_id === "" ? null : project_id;
  }
  if (type) where.type = type;
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { rows, count } = await DocumentationContent.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updated_at", "DESC"]]
  });
  return { rows, count };
}

async function createRow(payload) {
  const DocumentationContent = getDocumentationContent();
  return DocumentationContent.create(payload);
}

async function updateRow(id, organizationId, payload) {
  const DocumentationContent = getDocumentationContent();
  const [affected] = await DocumentationContent.update(payload, {
    where: { id, organization_id: organizationId }
  });
  return affected;
}

async function deleteRow(id, organizationId) {
  const DocumentationContent = getDocumentationContent();
  return DocumentationContent.destroy({
    where: { id, organization_id: organizationId }
  });
}

module.exports = {
  findByIdForOrg,
  findByScopeType,
  listForOrg,
  createRow,
  updateRow,
  deleteRow
};
