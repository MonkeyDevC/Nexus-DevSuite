/**
 * Módulo Incidents - Service
 * Reglas: workflow, cierre solo MASTER, root_cause_analysis obligatorio antes de CLOSED, auditoría.
 * WAVE 3: priority, story_id, PUT canónico, DELETE solo OPEN, validación story/proyecto.
 */

const incidentRepository = require("./incident.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const featureRepository = require("../backlog/feature.repository");
const userStoryRepository = require("../backlog/userStory.repository");
const authRepository = require("../auth/auth.repository");
const { validateIncidentTransition } = require("./incident.workflow.validator");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(incident) {
  if (!incident) return null;
  const i = typeof incident.toJSON === "function" ? incident.toJSON() : incident;
  return {
    id: i.id,
    project_id: i.project_id,
    title: i.title,
    description: i.description,
    severity: i.severity,
    priority: i.priority != null ? i.priority : "MEDIUM",
    story_id: i.story_id != null && String(i.story_id).trim() !== "" ? String(i.story_id).trim() : null,
    status: i.status,
    root_cause_analysis: i.root_cause_analysis,
    reported_by: i.reported_by,
    assigned_to: i.assigned_to,
    closed_by: i.closed_by,
    closed_at: i.closed_at,
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

/**
 * Si storyId es no vacío: existencia + mismo proyecto que projectId del incidente.
 * Retorna uuid normalizado o null si storyId es null/omitido para "sin story".
 */
async function resolveStoryIdForProject(storyId, projectId) {
  if (storyId === undefined) return undefined;
  if (storyId === null || storyId === "") return null;
  const sid = String(storyId).trim();
  if (!sid) return null;
  const story = await userStoryRepository.findById(sid);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const feature = await featureRepository.findById(story.feature_id);
  if (!feature || String(feature.project_id) !== String(projectId)) {
    throw new AppError("La story no pertenece al proyecto del incidente", {
      statusCode: 400,
      code: ERROR_CODES.STORY_PROJECT_MISMATCH
    });
  }
  return sid;
}

async function createIncident(projectId, payload, context) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, context.organizationId);
  const severity = payload.severity;
  const priority = payload.priority;
  if (!severity || !priority) {
    throw new AppError("severity y priority son obligatorios", {
      statusCode: 422,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  let story_id = null;
  if (payload.story_id !== undefined && payload.story_id !== null && String(payload.story_id).trim() !== "") {
    story_id = await resolveStoryIdForProject(payload.story_id, projectId);
  }
  const created = await incidentRepository.create({
    project_id: projectId,
    title: payload.title,
    description: payload.description ?? null,
    severity,
    priority,
    story_id,
    status: "OPEN",
    reported_by: context.user?.id
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "INCIDENT_CREATED",
    entity: "INCIDENT",
    entity_id: created.id,
    metadata: { project_id: projectId }
  });
  return toPlain(created);
}

async function getIncidentById(id, organizationId) {
  const incident = await incidentRepository.findById(id);
  if (!incident) {
    throw new AppError("Incidente no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.INCIDENT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(incident.project_id);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  return toPlain(incident);
}

async function listIncidents(projectId, params = {}, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 10));
  const status = params.status || undefined;
  const result = await incidentRepository.list({ projectId, page, limit, status });
  const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages }
  };
}

async function updateIncidentStatus(incidentId, nextStatus, payload, context) {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw new AppError("Incidente no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.INCIDENT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(incident.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  const currentStatus = incident.status;
  if (currentStatus === "CLOSED") {
    throw new AppError("No se puede modificar un incidente cerrado", {
      statusCode: 400,
      code: ERROR_CODES.INCIDENT_CLOSED
    });
  }
  validateIncidentTransition(currentStatus, nextStatus);

  if (nextStatus === "CLOSED") {
    if (context.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede cerrar el incidente", {
        statusCode: 403,
        code: ERROR_CODES.INCIDENT_CLOSE_MASTER_ONLY
      });
    }
    const rootCause = (payload && payload.root_cause_analysis) || incident.root_cause_analysis;
    const trimmed = typeof rootCause === "string" ? rootCause.trim() : "";
    if (!trimmed) {
      throw new AppError("root_cause_analysis es obligatorio antes de cerrar el incidente", {
        statusCode: 400,
        code: ERROR_CODES.INCIDENT_ROOT_CAUSE_REQUIRED
      });
    }
  }

  const auditCtx = ensureAuditContext(context);
  const updatePayload = { status: nextStatus };
  if (payload && typeof payload.root_cause_analysis === "string") {
    updatePayload.root_cause_analysis = payload.root_cause_analysis.trim() || null;
  }
  if (nextStatus === "CLOSED") {
    updatePayload.closed_by = context.user.id;
    updatePayload.closed_at = new Date();
  }

  const updated = await incidentRepository.update(incidentId, updatePayload);
  const plain = toPlain(updated);

  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "INCIDENT",
    entity_id: incidentId,
    metadata: { from: currentStatus, to: nextStatus }
  });

  if (nextStatus === "CLOSED") {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "INCIDENT_CLOSED",
      entity: "INCIDENT",
      entity_id: incidentId,
      metadata: { closed_by: context.user.id, closed_at: updatePayload.closed_at }
    });
  }

  return plain;
}

/**
 * Actualización de campos (PUT canónico y PATCH compat). Solo claves presentes en payload (excepto story_id explícito null).
 */
async function updateIncident(incidentId, payload, context) {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw new AppError("Incidente no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.INCIDENT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(incident.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (incident.status === "CLOSED") {
    throw new AppError("No se puede actualizar un incidente cerrado", {
      statusCode: 400,
      code: ERROR_CODES.INCIDENT_CLOSED
    });
  }
  const updatePayload = {};
  const projectId = incident.project_id;

  if (payload.title !== undefined) {
    const t = String(payload.title || "").trim();
    if (!t) {
      throw new AppError("title no puede vaciarse", { statusCode: 422, code: ERROR_CODES.VALIDATION_ERROR });
    }
    updatePayload.title = t;
  }
  if (payload.description !== undefined) {
    updatePayload.description = payload.description === null || payload.description === "" ? null : String(payload.description).trim();
  }
  if (payload.severity !== undefined) updatePayload.severity = payload.severity;
  if (payload.priority !== undefined) updatePayload.priority = payload.priority;
  if (payload.assigned_to !== undefined) updatePayload.assigned_to = payload.assigned_to || null;
  if (payload.root_cause_analysis !== undefined) {
    updatePayload.root_cause_analysis = payload.root_cause_analysis ? String(payload.root_cause_analysis).trim() : null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "story_id")) {
    const resolved = await resolveStoryIdForProject(payload.story_id, projectId);
    updatePayload.story_id = resolved === undefined ? incident.story_id : resolved;
  }

  if (Object.keys(updatePayload).length === 0) return toPlain(incident);
  const updated = await incidentRepository.update(incidentId, updatePayload);
  return toPlain(updated);
}

async function deleteIncident(incidentId, context) {
  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw new AppError("Incidente no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.INCIDENT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(incident.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (incident.status !== "OPEN") {
    throw new AppError("Solo se puede eliminar un incidente en estado OPEN", {
      statusCode: 409,
      code: ERROR_CODES.INCIDENT_INVALID_STATE
    });
  }
  const auditCtx = ensureAuditContext(context);
  const result = await incidentRepository.destroyById(incidentId);
  if (!result) {
    throw new AppError("Incidente no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.INCIDENT_NOT_FOUND
    });
  }
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "INCIDENT_DELETED",
    entity: "INCIDENT",
    entity_id: incidentId,
    metadata: { project_id: incident.project_id }
  });
  return result;
}

module.exports = {
  createIncident,
  getIncidentById,
  listIncidents,
  updateIncidentStatus,
  updateIncident,
  deleteIncident,
  toPlain,
  resolveStoryIdForProject
};
