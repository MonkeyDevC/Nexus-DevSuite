/**
 * ----
 * Módulo: Documentation Service
 * Descripción: Reglas de negocio para contenido documental de plataforma (documentation_contents).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const documentationRepository = require("./documentation.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { DOC_TYPES, DOC_FORMATS } = require("./models/documentationContent.model");
const { sanitizeDocumentationContent } = require("./documentation.sanitize");
const { DOCUMENTATION_CONTENT_MAX_LENGTH } = require("./documentation.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const PATCH_FIELD_KEYS = ["content", "title", "format", "type", "project_id", "status"];

function assertContentLength(value, fieldLabel) {
  if (value === undefined || value === null) return;
  const len = String(value).length;
  if (len > DOCUMENTATION_CONTENT_MAX_LENGTH) {
    throw new AppError(`${fieldLabel} supera el tamaño máximo permitido`, {
      statusCode: 400,
      code: ERROR_CODES.DOCUMENTATION_CONTENT_TOO_LARGE,
      details: { max_length: DOCUMENTATION_CONTENT_MAX_LENGTH, length: len }
    });
  }
}

function assertPatchPayloadHasFields(payload) {
  const has = PATCH_FIELD_KEYS.some((k) => Object.prototype.hasOwnProperty.call(payload || {}, k));
  if (!has) {
    throw new AppError("Debe enviar al menos un campo permitido en el cuerpo del PATCH", {
      statusCode: 400,
      code: ERROR_CODES.DOCUMENTATION_PATCH_EMPTY,
      details: { allowed_fields: PATCH_FIELD_KEYS }
    });
  }
}

function toPlain(row) {
  if (!row) return null;
  const r = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: r.id,
    organization_id: r.organization_id,
    project_id: r.project_id,
    type: r.type,
    format: r.format,
    title: r.title,
    content: r.content,
    status: r.status,
    updated_by_user_id: r.updated_by_user_id,
    created_at: r.created_at,
    updated_at: r.updated_at
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

function ensureOrganization(context) {
  if (context.organizationId == null) {
    throw new AppError("Organización requerida para esta operación", {
      statusCode: 400,
      code: ERROR_CODES.TENANT_REQUIRED
    });
  }
}

async function createDocumentation(payload, context) {
  ensureOrganization(context);
  const { type, format, content, title, project_id } = payload;
  assertContentLength(content, "content");
  if (!DOC_TYPES.includes(type)) {
    throw new AppError("type inválido", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
  }
  const fmt = format || "html";
  if (!DOC_FORMATS.includes(fmt)) {
    throw new AppError("format inválido", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
  }
  if (project_id) {
    const project = await projectsRepository.findById(project_id);
    if (!project) {
      throw new AppError("Proyecto no encontrado", { statusCode: 404, code: ERROR_CODES.PROJECT_NOT_FOUND });
    }
    featureService.ensureProjectInOrg(project, context.organizationId);
  }

  const duplicate = await documentationRepository.findByScopeType(
    context.organizationId,
    project_id || null,
    type
  );
  if (duplicate) {
    throw new AppError("Ya existe contenido activo para este alcance y tipo", {
      statusCode: 409,
      code: ERROR_CODES.DOCUMENTATION_CONFLICT
    });
  }

  const created = await documentationRepository.createRow({
    organization_id: context.organizationId,
    project_id: project_id || null,
    type,
    format: fmt,
    content: sanitizeDocumentationContent(String(content)),
    title: title != null && String(title).trim() ? String(title).trim() : null,
    status: "ACTIVE",
    updated_by_user_id: context.user?.id || null
  });

  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DOCUMENTATION_CREATED",
    entity: "DOCUMENTATION_CONTENT",
    entity_id: created.id,
    metadata: { type, project_id: project_id || null }
  });

  return toPlain(created);
}

async function getById(id, organizationId) {
  if (organizationId == null) {
    throw new AppError("Organización requerida", { statusCode: 400, code: ERROR_CODES.TENANT_REQUIRED });
  }
  const row = await documentationRepository.findByIdForOrg(id, organizationId);
  if (!row) {
    throw new AppError("Contenido documental no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENTATION_NOT_FOUND
    });
  }
  return toPlain(row);
}

async function listDocumentation(query, organizationId) {
  if (organizationId == null) {
    throw new AppError("Organización requerida", { statusCode: 400, code: ERROR_CODES.TENANT_REQUIRED });
  }
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  let status = query.status || undefined;
  if (!query.include_archived && !status) {
    status = "ACTIVE";
  }
  const project_id =
    query.project_id === undefined ? undefined : query.project_id === "" ? null : query.project_id;
  const type = query.type || undefined;

  const { rows, count } = await documentationRepository.listForOrg(organizationId, {
    project_id,
    type,
    status,
    page,
    limit
  });
  const totalPages = count === 0 ? 0 : Math.ceil(count / limit);
  return {
    data: rows.map(toPlain),
    meta: { total: count, page, limit, totalPages }
  };
}

async function updateDocumentation(id, payload, context) {
  ensureOrganization(context);
  assertPatchPayloadHasFields(payload);
  const existing = await documentationRepository.findByIdForOrg(id, context.organizationId);
  if (!existing) {
    throw new AppError("Contenido documental no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENTATION_NOT_FOUND
    });
  }
  const plain = existing.toJSON ? existing.toJSON() : existing;

  if (payload.project_id !== undefined && payload.project_id !== plain.project_id) {
    if (payload.project_id) {
      const project = await projectsRepository.findById(payload.project_id);
      if (!project) {
        throw new AppError("Proyecto no encontrado", { statusCode: 404, code: ERROR_CODES.PROJECT_NOT_FOUND });
      }
      featureService.ensureProjectInOrg(project, context.organizationId);
    }
  }

  const nextType = payload.type !== undefined ? payload.type : plain.type;
  const nextProjectId =
    payload.project_id !== undefined ? payload.project_id || null : plain.project_id;

  if (!DOC_TYPES.includes(nextType)) {
    throw new AppError("type inválido", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
  }

  if (payload.type !== undefined || payload.project_id !== undefined) {
    const dup = await documentationRepository.findByScopeType(
      context.organizationId,
      nextProjectId,
      nextType,
      id
    );
    if (dup) {
      throw new AppError("Ya existe contenido activo para este alcance y tipo", {
        statusCode: 409,
        code: ERROR_CODES.DOCUMENTATION_CONFLICT
      });
    }
  }

  const updatePayload = {};
  if (payload.content !== undefined) {
    assertContentLength(payload.content, "content");
    updatePayload.content = sanitizeDocumentationContent(String(payload.content));
  }
  if (payload.title !== undefined) {
    updatePayload.title =
      payload.title === null || payload.title === "" ? null : String(payload.title).trim();
  }
  if (payload.format !== undefined) {
    if (!DOC_FORMATS.includes(payload.format)) {
      throw new AppError("format inválido", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
    }
    updatePayload.format = payload.format;
  }
  if (payload.type !== undefined) updatePayload.type = payload.type;
  if (payload.project_id !== undefined) updatePayload.project_id = payload.project_id || null;
  if (payload.status !== undefined) {
    if (!["ACTIVE", "ARCHIVED"].includes(payload.status)) {
      throw new AppError("status inválido", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
    }
    updatePayload.status = payload.status;
  }
  updatePayload.updated_by_user_id = context.user?.id || null;

  if (Object.keys(updatePayload).length === 0) {
    return toPlain(existing);
  }

  const affected = await documentationRepository.updateRow(id, context.organizationId, updatePayload);
  if (!affected) {
    throw new AppError("Contenido documental no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENTATION_NOT_FOUND
    });
  }

  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DOCUMENTATION_UPDATED",
    entity: "DOCUMENTATION_CONTENT",
    entity_id: id,
    metadata: { fields: Object.keys(updatePayload) }
  });

  return getById(id, context.organizationId);
}

async function deleteDocumentation(id, context) {
  ensureOrganization(context);
  const existing = await documentationRepository.findByIdForOrg(id, context.organizationId);
  if (!existing) {
    throw new AppError("Contenido documental no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENTATION_NOT_FOUND
    });
  }
  const deleted = await documentationRepository.deleteRow(id, context.organizationId);
  if (!deleted) {
    throw new AppError("Contenido documental no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENTATION_NOT_FOUND
    });
  }
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DOCUMENTATION_DELETED",
    entity: "DOCUMENTATION_CONTENT",
    entity_id: id,
    metadata: {}
  });
  return { id, deleted: true };
}

module.exports = {
  createDocumentation,
  getById,
  listDocumentation,
  updateDocumentation,
  deleteDocumentation,
  toPlain
};
