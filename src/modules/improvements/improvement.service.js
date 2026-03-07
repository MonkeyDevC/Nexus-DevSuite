/**
 * Módulo Improvements - Service
 * Reglas: DRAFT→PROPOSED solo proposed_by o MASTER; PROPOSED→APPROVED|REJECTED y APPROVED→IMPLEMENTED solo MASTER.
 */

const improvementRepository = require("./improvement.repository");
const incidentRepository = require("../incidents/incident.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { validateImprovementTransition } = require("./improvement.workflow.validator");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(improvement) {
  if (!improvement) return null;
  const i = typeof improvement.toJSON === "function" ? improvement.toJSON() : improvement;
  return {
    id: i.id,
    project_id: i.project_id,
    incident_id: i.incident_id,
    title: i.title,
    description: i.description,
    status: i.status,
    proposed_by: i.proposed_by,
    approved_by: i.approved_by,
    approved_at: i.approved_at,
    implemented_at: i.implemented_at,
    created_at: i.created_at,
    updated_at: i.updated_at
  };
}

function ensureAuditContext(context) {
  const { user, requestId, ip, userAgent } = context || {};
  if (!user?.id || !requestId) {
    throw new AppError("Contexto de auditoría incompleto", {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  return {
    user_id: user.id,
    request_id: requestId,
    ip_address: ip || null,
    user_agent: userAgent || null
  };
}

async function createImprovement(payload, context) {
  let projectIdForOrg = payload.project_id || null;
  if (payload.incident_id) {
    const incident = await incidentRepository.findById(payload.incident_id);
    if (!incident) {
      throw new AppError("Incidente no encontrado", {
        statusCode: 404,
        code: ERROR_CODES.INCIDENT_NOT_FOUND
      });
    }
    if (payload.project_id && incident.project_id !== payload.project_id) {
      throw new AppError("El project_id debe coincidir con el del incidente", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    projectIdForOrg = incident.project_id || payload.project_id;
  }
  if (projectIdForOrg) {
    const project = await projectsRepository.findById(projectIdForOrg);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  const created = await improvementRepository.create({
    project_id: payload.project_id || null,
    incident_id: payload.incident_id || null,
    title: payload.title,
    description: payload.description ?? null,
    status: "DRAFT",
    proposed_by: context.user?.id
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "IMPROVEMENT_CREATED",
    entity: "IMPROVEMENT",
    entity_id: created.id,
    metadata: { project_id: created.project_id, incident_id: created.incident_id }
  });
  return toPlain(created);
}

async function getImprovementById(id, organizationId) {
  const improvement = await improvementRepository.findById(id);
  if (!improvement) {
    throw new AppError("Mejora no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.IMPROVEMENT_NOT_FOUND
    });
  }
  const projectId = improvement.project_id || (improvement.incident_id ? (await incidentRepository.findById(improvement.incident_id))?.project_id : null);
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, organizationId);
  }
  return toPlain(improvement);
}

async function listImprovements(params = {}, organizationId) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 10));
  let projectId = params.project_id || undefined;
  const incidentId = params.incident_id || undefined;
  const status = params.status || undefined;
  let projectIds;
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, organizationId);
  } else if (organizationId != null) {
    projectIds = await projectsRepository.findIdsByOrganization(organizationId);
  }
  const result = await improvementRepository.list({
    projectId,
    projectIds,
    incidentId,
    page,
    limit,
    status
  });
  const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages }
  };
}

async function updateImprovementStatus(improvementId, nextStatus, context) {
  const improvement = await improvementRepository.findById(improvementId);
  if (!improvement) {
    throw new AppError("Mejora no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.IMPROVEMENT_NOT_FOUND
    });
  }
  const projectId = improvement.project_id || (improvement.incident_id ? (await incidentRepository.findById(improvement.incident_id))?.project_id : null);
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  const currentStatus = improvement.status;
  if (currentStatus === "REJECTED" || currentStatus === "IMPLEMENTED") {
    throw new AppError("No se puede cambiar el estado de una mejora rechazada o implementada", {
      statusCode: 400,
      code: ERROR_CODES.IMPROVEMENT_CLOSED
    });
  }
  validateImprovementTransition(currentStatus, nextStatus);

  if (currentStatus === "DRAFT" && nextStatus === "PROPOSED") {
    if (context.user?.id !== improvement.proposed_by && context.user?.role !== "MASTER") {
      throw new AppError("Solo el autor de la mejora o MASTER puede proponerla", {
        statusCode: 403,
        code: ERROR_CODES.AUTH_FORBIDDEN
      });
    }
  }

  if (nextStatus === "APPROVED" || nextStatus === "REJECTED") {
    if (context.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede aprobar o rechazar una mejora", {
        statusCode: 403,
        code: ERROR_CODES.IMPROVEMENT_APPROVE_MASTER_ONLY
      });
    }
  }

  if (nextStatus === "IMPLEMENTED") {
    if (context.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede marcar una mejora como implementada", {
        statusCode: 403,
        code: ERROR_CODES.IMPROVEMENT_APPROVE_MASTER_ONLY
      });
    }
  }

  const auditCtx = ensureAuditContext(context);
  const updatePayload = { status: nextStatus };
  if (nextStatus === "APPROVED" || nextStatus === "REJECTED") {
    updatePayload.approved_by = context.user.id;
    updatePayload.approved_at = new Date();
  }
  if (nextStatus === "IMPLEMENTED") {
    updatePayload.implemented_at = new Date();
  }

  const updated = await improvementRepository.update(improvementId, updatePayload);
  const plain = toPlain(updated);

  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "IMPROVEMENT",
    entity_id: improvementId,
    metadata: { from: currentStatus, to: nextStatus }
  });

  if (nextStatus === "APPROVED") {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "IMPROVEMENT_APPROVED",
      entity: "IMPROVEMENT",
      entity_id: improvementId,
      metadata: { approved_by: context.user.id, approved_at: updatePayload.approved_at }
    });
  }
  if (nextStatus === "REJECTED") {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "IMPROVEMENT_REJECTED",
      entity: "IMPROVEMENT",
      entity_id: improvementId,
      metadata: { approved_by: context.user.id, approved_at: updatePayload.approved_at }
    });
  }

  return plain;
}

module.exports = {
  createImprovement,
  getImprovementById,
  listImprovements,
  updateImprovementStatus,
  toPlain
};
