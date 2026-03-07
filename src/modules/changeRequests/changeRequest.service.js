/**
 * Módulo ChangeRequest - Service
 * create, submit, approve, reject, markAsImplemented.
 * validateAndConsumeChangeRequest para integración con Release/Feature.
 */

const changeRequestRepository = require("./changeRequest.repository");
const authRepository = require("../auth/auth.repository");
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
  if (!changeRequestId) {
    throw new AppError("Se requiere un ChangeRequest aprobado para esta acción", {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_REQUIRED
    });
  }

  const cr = await changeRequestRepository.findById(changeRequestId);
  if (!cr) {
    throw new AppError("ChangeRequest no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.CHANGE_REQUEST_NOT_FOUND
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

module.exports = {
  createChangeRequest,
  submitChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  markAsImplemented,
  validateAndConsumeChangeRequest,
  toPlain
};
