/**
 * Módulo ChangeRequest - Service
 * create, submit, approve, reject, markAsImplemented.
 * validateAndConsumeChangeRequest para integración con Release/Feature.
 */

const changeRequestRepository = require("./changeRequest.repository");
const authRepository = require("../auth/auth.repository");
const projectsRepository = require("../backlog/projects.repository");
const { getModels } = require("../../infrastructure/db/loadModels");
const { validateCRTransition } = require("./changeRequest.workflow.validator");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(cr) {
  if (!cr) return null;
  const c = typeof cr.toJSON === "function" ? cr.toJSON() : cr;
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    type: c.type,
    impact_level: c.impact_level,
    status: c.status,
    requested_by: c.requested_by,
    approved_by: c.approved_by,
    entity_type: c.entity_type,
    entity_id: c.entity_id,
    created_at: c.created_at,
    approved_at: c.approved_at,
    implemented_at: c.implemented_at,
    updated_at: c.updated_at
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
 * Valida que el CR exista, esté APPROVED, coincida entity_type/entity_id y no esté IMPLEMENTED.
 * Usado por release.service y feature.service antes de ejecutar acción estructural.
 * No consume el CR aquí; quien llama debe invocar markAsImplemented tras éxito.
 */
async function validateAndConsumeChangeRequest(changeRequestId, entityType, entityId, context) {
  let cr = null;
  if (changeRequestId) {
    cr = await changeRequestRepository.findById(changeRequestId);
  } else if (entityType && entityId) {
    cr = await changeRequestRepository.findLatestApprovedByEntity(entityType, entityId);
  }

  if (changeRequestId && !cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }

  if (!cr) {
    const implementedCr = await changeRequestRepository.findLatestImplementedByEntity(entityType, entityId);
    if (implementedCr) {
      const impl = toPlain(implementedCr);
      throw new AppError(
        "El último ChangeRequest para esta entidad ya fue implementado (" + (impl.code || impl.id) + "). Cree y apruebe uno nuevo para volver a modificar.",
        {
          statusCode: 400,
          code: ERROR_CODES.CHANGE_REQUEST_ALREADY_IMPLEMENTED
        }
      );
    }
    throw new AppError("Se requiere un ChangeRequest aprobado para esta acción", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_REQUIRED
    });
  }

  const plain = toPlain(cr);
  if (plain.status === "IMPLEMENTED") {
    throw new AppError("El ChangeRequest ya fue implementado", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_ALREADY_IMPLEMENTED
    });
  }
  if (plain.status !== "APPROVED") {
    throw new AppError("El ChangeRequest debe estar aprobado para ejecutar esta acción", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_APPROVED
    });
  }

  if (plain.entity_type !== entityType || plain.entity_id !== entityId) {
    throw new AppError("El ChangeRequest no corresponde a la entidad indicada", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_INVALID
    });
  }

  return plain;
}

async function createChangeRequest(payload, context = {}) {
  const { title, description, type, impact_level, entity_type, entity_id } = payload || {};

  if (!entity_type || !entity_id) {
    throw new AppError("entity_type y entity_id son obligatorios; no se permiten CR sin entidad asociada", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }

  const year = new Date().getFullYear();
  const code = await changeRequestRepository.getNextCodeForYear(year);

  const created = await changeRequestRepository.create({
    code,
    title: title || null,
    description: description || null,
    type: type || null,
    impact_level: impact_level || "LOW",
    status: "DRAFT",
    requested_by: context.user?.id,
    entity_type,
    entity_id
  });
  return toPlain(created);
}

async function updateDraftChangeRequest(id, payload, context = {}) {
  const cr = await changeRequestRepository.findById(id);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }
  if (cr.status !== "DRAFT") {
    throw new AppError("Solo se puede editar un ChangeRequest en estado DRAFT", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_INVALID_TRANSITION
    });
  }

  const updatePayload = {};
  if (payload.title !== undefined) updatePayload.title = payload.title === null ? null : String(payload.title).trim();
  if (payload.description !== undefined) updatePayload.description = payload.description === null ? null : String(payload.description);
  if (payload.type !== undefined) updatePayload.type = payload.type === null ? null : String(payload.type).trim();
  if (payload.impact_level !== undefined) updatePayload.impact_level = payload.impact_level === null ? null : String(payload.impact_level).trim();
  if (payload.entity_type !== undefined) updatePayload.entity_type = payload.entity_type === null ? null : String(payload.entity_type).trim();
  if (payload.entity_id !== undefined) updatePayload.entity_id = payload.entity_id === null ? null : String(payload.entity_id).trim();

  if (Object.keys(updatePayload).length === 0) {
    return toPlain(cr);
  }
  if ((updatePayload.entity_type != null && updatePayload.entity_id == null && payload.entity_id !== undefined)
    || (updatePayload.entity_id != null && updatePayload.entity_type == null && payload.entity_type !== undefined)) {
    throw new AppError("entity_type y entity_id deben actualizarse en conjunto", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }

  const updated = await changeRequestRepository.update(id, updatePayload);
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "UPDATE",
    entity: "CHANGE_REQUEST",
    entity_id: id,
    metadata: { fields: Object.keys(updatePayload) }
  });
  return toPlain(updated);
}

async function submitChangeRequest(id, context) {
  const cr = await changeRequestRepository.findById(id);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }
  const currentStatus = cr.status;
  validateCRTransition(currentStatus, "SUBMITTED");
  const updated = await changeRequestRepository.update(id, { status: "SUBMITTED" });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "CHANGE_REQUEST",
    entity_id: id,
    metadata: { from: currentStatus, to: "SUBMITTED" }
  });
  return toPlain(updated);
}

async function approveChangeRequest(id, context) {
  if (context?.user?.role !== "MASTER") {
    throw new AppError("No tiene permisos para realizar esta accion", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }
  const cr = await changeRequestRepository.findById(id);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }
  const currentStatus = cr.status;
  validateCRTransition(currentStatus, "APPROVED");
  const now = new Date();
  const updated = await changeRequestRepository.update(id, {
    status: "APPROVED",
    approved_by: context.user?.id,
    approved_at: now
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "CHANGE_REQUEST",
    entity_id: id,
    metadata: { from: currentStatus, to: "APPROVED" }
  });
  const plain = toPlain(updated);
  if (plain.impact_level === "HIGH" || plain.impact_level === "CRITICAL") {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "IMPACT_HIGH",
      entity: "CHANGE_REQUEST",
      entity_id: id,
      metadata: { impact_level: plain.impact_level }
    });
  }
  return plain;
}

async function rejectChangeRequest(id, context) {
  if (context?.user?.role !== "MASTER") {
    throw new AppError("No tiene permisos para realizar esta accion", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }
  const cr = await changeRequestRepository.findById(id);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }
  const currentStatus = cr.status;
  validateCRTransition(currentStatus, "REJECTED");
  const updated = await changeRequestRepository.update(id, { status: "REJECTED" });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "CHANGE_REQUEST",
    entity_id: id,
    metadata: { from: currentStatus, to: "REJECTED" }
  });
  return toPlain(updated);
}

async function markAsImplemented(id, context) {
  const cr = await changeRequestRepository.findById(id);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }
  const currentStatus = cr.status;
  if (currentStatus === "IMPLEMENTED") {
    throw new AppError("El ChangeRequest ya fue implementado", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_ALREADY_IMPLEMENTED
    });
  }
  validateCRTransition(currentStatus, "IMPLEMENTED");
  const now = new Date();
  const updated = await changeRequestRepository.update(id, {
    status: "IMPLEMENTED",
    implemented_at: now
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "CHANGE_REQUEST_IMPLEMENTED",
    entity: "CHANGE_REQUEST",
    entity_id: id,
    metadata: { from: currentStatus, to: "IMPLEMENTED" }
  });
  return toPlain(updated);
}

async function restoreChangeRequestToDraft(id, context) {
  if (context?.user?.role !== "MASTER") {
    throw new AppError("No tiene permisos para realizar esta accion", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }
  const cr = await changeRequestRepository.findById(id);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
    });
  }
  const currentStatus = cr.status;
  if (currentStatus === "IMPLEMENTED") {
    throw new AppError("No se puede restaurar a DRAFT un ChangeRequest implementado", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_INVALID_TRANSITION
    });
  }
  validateCRTransition(currentStatus, "DRAFT");
  const updated = await changeRequestRepository.update(id, {
    status: "DRAFT",
    approved_by: null,
    approved_at: null
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "CHANGE_REQUEST",
    entity_id: id,
    metadata: { from: currentStatus, to: "DRAFT", reason: "manual_restore_to_draft" }
  });
  return toPlain(updated);
}

async function listChangeRequestsByProject(projectId, params = {}, context = {}) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (context.organizationId != null && project.organization_id !== context.organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }

  const { Feature } = getModels();
  const sequelize = Feature.sequelize;
  const features = await Feature.findAll({
    where: { project_id: projectId },
    attributes: ["id", "release_id"],
    raw: true
  });

  const featureIds = [];
  const releaseIdsSet = new Set();
  features.forEach((f) => {
    if (f.id) featureIds.push(f.id);
    if (f.release_id) releaseIdsSet.add(f.release_id);
  });

  const [storyReleaseRows] = await sequelize.query(
    `SELECT DISTINCT us.release_id AS rid
     FROM user_stories us
     INNER JOIN features f ON f.id = us.feature_id
     WHERE f.project_id = :projectId AND us.release_id IS NOT NULL`,
    { replacements: { projectId } }
  );
  (storyReleaseRows || []).forEach((row) => {
    if (row && row.rid) releaseIdsSet.add(row.rid);
  });

  const releaseIds = Array.from(releaseIdsSet);
  const entityIds = [...featureIds, ...releaseIds];

  if (entityIds.length === 0) {
    const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(params.limit, 10) || 20));
    return {
      items: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      scope: { project_id: projectId }
    };
  }

  const { items, total, page, limit } = await changeRequestRepository.listByFilters(
    {
      status: params.status || undefined,
      entity_type: params.entity_type || undefined,
      entity_ids: entityIds
    },
    { page: params.page, limit: params.limit }
  );

  return {
    items: items.map(toPlain),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit)
    },
    scope: { project_id: projectId }
  };
}

module.exports = {
  createChangeRequest,
  updateDraftChangeRequest,
  submitChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  markAsImplemented,
  restoreChangeRequestToDraft,
  validateAndConsumeChangeRequest,
  listChangeRequestsByProject,
  toPlain
};
