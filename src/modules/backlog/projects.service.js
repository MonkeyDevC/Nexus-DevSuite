/**
 * Módulo Backlog - Service Projects
 * Reglas de negocio: duplicados, archivado, acceso a datos vía repository.
 */

const projectsRepository = require("./projects.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(project) {
  if (!project) return null;
  const p = typeof project.toJSON === "function" ? project.toJSON() : project;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    organization_id: p.organization_id,
    created_by: p.created_by,
    archived_at: p.archived_at,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

async function createProject(payload, context) {
  const organizationId = context.organizationId;
  if (!organizationId) {
    throw new AppError("Tenant no resuelto", {
      statusCode: 400,
      code: ERROR_CODES.TENANT_REQUIRED
    });
  }
  const existing = await projectsRepository.findByNameAndOrganization(payload.name, organizationId);
  if (existing) {
    throw new AppError("Ya existe un proyecto con ese nombre", {
      statusCode: 409,
      code: ERROR_CODES.PROJECT_ALREADY_EXISTS
    });
  }
  const created = await projectsRepository.create({
    ...payload,
    organization_id: organizationId,
    created_by: context.user && context.user.id
  });
  return toPlain(created);
}

async function getProjectById(id, organizationId) {
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  return toPlain(project);
}

async function listProjects(params) {
  const page = params && params.page ? params.page : 1;
  const limit = params && params.limit ? params.limit : 10;
  const status = params && params.status;
  const organizationId = params && params.organizationId;
  const { items, total } = await projectsRepository.list({ page, limit, status, organizationId });
  return {
    data: items.map(toPlain),
    meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
}

async function archiveProject(id, organizationId) {
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const updated = await projectsRepository.update(id, {
    status: "ARCHIVED",
    archived_at: new Date()
  });
  return toPlain(updated);
}

module.exports = {
  createProject,
  getProjectById,
  listProjects,
  archiveProject
};
