/**
 * Módulo Documents - Service (orquesta Document y DocumentVersion)
 * Transacción POST /documents (doc + v1 DRAFT), versionado incremental, archivado automático, change_reason obligatorio al aprobar.
 */

const { sequelize } = require("../../config/database");
const documentRepository = require("./document.repository");
const documentVersionRepository = require("./documentVersion.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { validateDocumentVersionTransition } = require("./documentVersion.workflow.validator");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlainDocument(doc) {
  if (!doc) return null;
  const d = typeof doc.toJSON === "function" ? doc.toJSON() : doc;
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    description: d.description,
    project_id: d.project_id,
    created_by: d.created_by,
    created_at: d.created_at,
    updated_at: d.updated_at
  };
}

function toPlainVersion(ver) {
  if (!ver) return null;
  const v = typeof ver.toJSON === "function" ? ver.toJSON() : ver;
  return {
    id: v.id,
    document_id: v.document_id,
    version_number: v.version_number,
    status: v.status,
    change_reason: v.change_reason,
    content: v.content,
    created_by: v.created_by,
    approved_by: v.approved_by,
    approved_at: v.approved_at,
    created_at: v.created_at,
    updated_at: v.updated_at
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

async function createDocument(payload, context) {
  const existing = await documentRepository.findByCode(payload.code);
  if (existing) {
    throw new AppError("Ya existe un documento con ese código", {
      statusCode: 409,
      code: ERROR_CODES.DOCUMENT_CODE_ALREADY_EXISTS
    });
  }
  if (payload.project_id) {
    const project = await projectsRepository.findById(payload.project_id);
    if (!project) {
      throw new AppError("Proyecto no encontrado", {
        statusCode: 404,
        code: ERROR_CODES.PROJECT_NOT_FOUND
      });
    }
    featureService.ensureProjectInOrg(project, context.organizationId);
  }

  const createdBy = context.user?.id;
  const doc = await sequelize.transaction(async (t) => {
    const docRow = await documentRepository.create(
      {
        code: payload.code.trim(),
        title: payload.title.trim(),
        description: payload.description ? payload.description.trim() : null,
        project_id: payload.project_id || null,
        created_by: createdBy
      },
      { transaction: t }
    );
    await documentVersionRepository.create(
      {
        document_id: docRow.id,
        version_number: 1,
        status: "DRAFT",
        change_reason: null,
        content: payload.content != null ? String(payload.content) : null,
        created_by: createdBy
      },
      { transaction: t }
    );
    return docRow;
  });

  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DOCUMENT_CREATED",
    entity: "DOCUMENT",
    entity_id: doc.id,
    metadata: { code: doc.code }
  });
  const firstVersion = await documentVersionRepository.listByDocumentId(doc.id, { limit: 1 });
  if (firstVersion.length) {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "DOCUMENT_VERSION_CREATED",
      entity: "DOCUMENT_VERSION",
      entity_id: firstVersion[0].id,
      metadata: { document_id: doc.id, version_number: 1 }
    });
  }
  return {
    ...toPlainDocument(doc),
    currentVersion: firstVersion.length ? toPlainVersion(firstVersion[0]) : null
  };
}

async function ensureDocumentInOrg(doc, organizationId) {
  if (!doc || !doc.project_id) return;
  const project = await projectsRepository.findById(doc.project_id);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
}

async function getDocumentById(id, organizationId) {
  const doc = await documentRepository.findById(id);
  if (!doc) {
    throw new AppError("Documento no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_NOT_FOUND
    });
  }
  await ensureDocumentInOrg(doc, organizationId);
  const lastApproved = await documentVersionRepository.findLatestApprovedByDocumentId(id);
  let currentVersion = lastApproved ? toPlainVersion(lastApproved) : null;
  if (!currentVersion) {
    const versions = await documentVersionRepository.listByDocumentId(id, { limit: 1 });
    if (versions.length) currentVersion = toPlainVersion(versions[0]);
  }
  return {
    ...toPlainDocument(doc),
    currentVersion
  };
}

async function listDocuments(params = {}, organizationId) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 10));
  const projectId = params.project_id || undefined;
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, organizationId);
  }
  const result = await documentRepository.list({ projectId, page, limit });
  const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);
  return {
    data: result.items.map(toPlainDocument),
    meta: { total: result.total, page, limit, totalPages }
  };
}

async function getDocumentByCode(code, organizationId) {
  const doc = await documentRepository.findByCode(code);
  if (!doc) {
    throw new AppError("Documento no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_NOT_FOUND
    });
  }
  await ensureDocumentInOrg(doc, organizationId);
  const lastApproved = await documentVersionRepository.findLatestApprovedByDocumentId(doc.id);
  let currentVersion = lastApproved ? toPlainVersion(lastApproved) : null;
  if (!currentVersion) {
    const versions = await documentVersionRepository.listByDocumentId(doc.id, { limit: 1 });
    if (versions.length) currentVersion = toPlainVersion(versions[0]);
  }
  return {
    ...toPlainDocument(doc),
    currentVersion
  };
}

async function createVersion(documentId, payload, context) {
  const doc = await documentRepository.findById(documentId);
  if (!doc) {
    throw new AppError("Documento no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_NOT_FOUND
    });
  }
  await ensureDocumentInOrg(doc, context.organizationId);
  const maxVer = await documentVersionRepository.getMaxVersionNumber(documentId);
  const versionNumber = maxVer + 1;
  const created = await documentVersionRepository.create({
    document_id: documentId,
    version_number: versionNumber,
    status: "DRAFT",
    change_reason: payload.change_reason ? String(payload.change_reason).trim() : null,
    content: payload.content != null ? String(payload.content) : null,
    created_by: context.user?.id
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DOCUMENT_VERSION_CREATED",
    entity: "DOCUMENT_VERSION",
    entity_id: created.id,
    metadata: { document_id: documentId, version_number: versionNumber }
  });
  return toPlainVersion(created);
}

async function getVersionById(documentId, versionId, organizationId) {
  const doc = await documentRepository.findById(documentId);
  if (!doc) {
    throw new AppError("Documento no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_NOT_FOUND
    });
  }
  await ensureDocumentInOrg(doc, organizationId);
  const version = await documentVersionRepository.findById(versionId);
  if (!version || version.document_id !== documentId) {
    throw new AppError("Versión de documento no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_VERSION_NOT_FOUND
    });
  }
  return toPlainVersion(version);
}

async function listVersionsByDocumentId(documentId, params = {}, organizationId) {
  const doc = await documentRepository.findById(documentId);
  if (!doc) {
    throw new AppError("Documento no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_NOT_FOUND
    });
  }
  await ensureDocumentInOrg(doc, organizationId);
  const status = params.status || undefined;
  const rows = await documentVersionRepository.listByDocumentId(documentId, { status });
  return rows.map(toPlainVersion);
}

async function updateVersionStatus(documentId, versionId, nextStatus, payload, context) {
  const doc = await documentRepository.findById(documentId);
  if (doc) await ensureDocumentInOrg(doc, context.organizationId);
  const version = await documentVersionRepository.findById(versionId);
  if (!version || version.document_id !== documentId) {
    throw new AppError("Versión de documento no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_VERSION_NOT_FOUND
    });
  }
  const currentStatus = version.status;
  validateDocumentVersionTransition(currentStatus, nextStatus);

  if (nextStatus === "APPROVED") {
    if (context.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede aprobar una versión de documento", {
        statusCode: 403,
        code: ERROR_CODES.DOCUMENT_APPROVE_MASTER_ONLY
      });
    }
    const changeReason = (payload && payload.change_reason) || version.change_reason;
    const trimmed = typeof changeReason === "string" ? changeReason.trim() : "";
    if (!trimmed) {
      throw new AppError("change_reason es obligatorio al aprobar la versión", {
        statusCode: 400,
        code: ERROR_CODES.DOCUMENT_CHANGE_REASON_REQUIRED
      });
    }
  }

  if (nextStatus === "ARCHIVED") {
    if (context.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede archivar una versión de documento", {
        statusCode: 403,
        code: ERROR_CODES.DOCUMENT_APPROVE_MASTER_ONLY
      });
    }
  }

  const auditCtx = ensureAuditContext(context);
  const updatePayload = { status: nextStatus };
  if (nextStatus === "APPROVED") {
    updatePayload.approved_by = context.user.id;
    updatePayload.approved_at = new Date();
    if (payload && typeof payload.change_reason === "string") {
      updatePayload.change_reason = payload.change_reason.trim();
    }
  }

  if (nextStatus === "APPROVED") {
    await documentVersionRepository.archiveApprovedVersionsExcept(documentId, versionId);
  }

  const updated = await documentVersionRepository.update(versionId, updatePayload);
  const plain = toPlainVersion(updated);

  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "DOCUMENT_VERSION",
    entity_id: versionId,
    metadata: { from: currentStatus, to: nextStatus }
  });

  if (nextStatus === "APPROVED") {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "DOCUMENT_VERSION_APPROVED",
      entity: "DOCUMENT_VERSION",
      entity_id: versionId,
      metadata: { approved_by: context.user.id, approved_at: updatePayload.approved_at }
    });
  }
  if (nextStatus === "ARCHIVED") {
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "DOCUMENT_VERSION_ARCHIVED",
      entity: "DOCUMENT_VERSION",
      entity_id: versionId,
      metadata: {}
    });
  }

  return plain;
}

async function updateVersion(documentId, versionId, payload, context) {
  const doc = await documentRepository.findById(documentId);
  if (doc) await ensureDocumentInOrg(doc, context.organizationId);
  const version = await documentVersionRepository.findById(versionId);
  if (!version || version.document_id !== documentId) {
    throw new AppError("Versión de documento no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.DOCUMENT_VERSION_NOT_FOUND
    });
  }
  if (version.status !== "DRAFT") {
    throw new AppError("Solo se puede editar una versión en estado DRAFT", {
      statusCode: 400,
      code: ERROR_CODES.DOCUMENT_VERSION_IMMUTABLE
    });
  }
  const updatePayload = {};
  if (payload.change_reason !== undefined) updatePayload.change_reason = payload.change_reason ? String(payload.change_reason).trim() : null;
  if (payload.content !== undefined) updatePayload.content = payload.content != null ? String(payload.content) : null;
  if (Object.keys(updatePayload).length === 0) return toPlainVersion(version);
  const updated = await documentVersionRepository.update(versionId, updatePayload);
  return toPlainVersion(updated);
}

module.exports = {
  createDocument,
  getDocumentById,
  listDocuments,
  getDocumentByCode,
  createVersion,
  getVersionById,
  listVersionsByDocumentId,
  updateVersionStatus,
  updateVersion,
  toPlainDocument,
  toPlainVersion
};
