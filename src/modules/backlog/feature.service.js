/**
 * Módulo Backlog - Service Feature
 * Reglas de negocio: project no archivado, transiciones vía workflow.validator, auditoría completa.
 */

const featureRepository = require("./feature.repository");
const projectsRepository = require("./projects.repository");
const userStoryRepository = require("./userStory.repository");
const changeRequestService = require("../changeRequests/changeRequest.service");
const { validateTransition, ENTITY_TYPES, normalizeWorkflowStatus } = require("./workflow.validator");
const authRepository = require("../auth/auth.repository");
const rulesEngineService = require("../rules-engine/rulesEngine.service");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { normalizeEvidenceMarkdownForPersistence } = require("./evidenceMarkdown");
const { stripEmbeddedFeatureCodeFromTitle } = require("./workItemHumanCodes");

function toPlain(feature) {
  if (!feature) return null;
  const f = typeof feature.toJSON === "function" ? feature.toJSON() : feature;
  const out = {
    id: f.id,
    project_id: f.project_id,
    number: f.number,
    title: f.title,
    description: f.description,
    acceptance_criteria: f.acceptance_criteria != null ? f.acceptance_criteria : [],
    implementation_criteria: f.implementation_criteria != null ? f.implementation_criteria : [],
    evidence_markdown: f.evidence_markdown == null ? "" : String(f.evidence_markdown),
    status: f.status,
    priority: f.priority,
    backlog_position: f.backlog_position != null ? f.backlog_position : null,
    created_by: f.created_by,
    approved_by: f.approved_by,
    approved_at: f.approved_at,
    closed_at: f.closed_at,
    created_at: f.created_at,
    updated_at: f.updated_at
  };
  if (f.user_stories_count != null) out.user_stories_count = f.user_stories_count;
  if (f.stories_done != null) out.stories_done = f.stories_done;
  if (f.progress_pct != null) out.progress_pct = f.progress_pct;
  return out;
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

function ensureProjectInOrg(project, organizationId) {
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
}

function resolveExplicitRules(rules) {
  if (rules == null) {
    return null;
  }
  if (!Array.isArray(rules)) {
    throw new AppError("rules debe ser un arreglo cuando se envía", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  return rules;
}

async function createFeature(projectId, payload, context = {}) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  ensureProjectInOrg(project, context.organizationId);
  if (project.status === "ARCHIVED") {
    throw new AppError("No se puede crear feature en proyecto archivado", {
      statusCode: 400,
      code: ERROR_CODES.PROJECT_ARCHIVED
    });
  }
  const nextNumber = (await featureRepository.getMaxFeatureNumberGlobal()) + 1;
  const created = await featureRepository.create({
    ...payload,
    project_id: projectId,
    number: nextNumber,
    created_by: context.user?.id
  });
  return toPlain(created);
}

async function getFeatureById(id, organizationId) {
  const feature = await featureRepository.findById(id);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) ensureProjectInOrg(project, organizationId);
  const plain = toPlain(feature);
  const [countsMap, doneMap] = await Promise.all([
    userStoryRepository.getStoryCountsByFeatureIds([id]),
    userStoryRepository.getStoryDoneCountsByFeatureIds([id])
  ]);
  const totalStories = countsMap[id] != null ? countsMap[id] : 0;
  const doneStories = doneMap[id] != null ? doneMap[id] : 0;
  plain.user_stories_count = totalStories;
  plain.stories_done = doneStories;
  plain.progress_pct = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;
  return plain;
}

async function listFeaturesByProject(projectId, { page = 1, limit = 10, status } = {}, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  ensureProjectInOrg(project, organizationId);
  const { items, total } = await featureRepository.listByProject(projectId, { page, limit, status });
  const featureIds = items.map(function (f) { return f.id; });
  const [storyCounts, doneCounts] = await Promise.all([
    userStoryRepository.getStoryCountsByFeatureIds(featureIds),
    userStoryRepository.getStoryDoneCountsByFeatureIds(featureIds)
  ]);
  const data = items.map(function (f) {
    const plain = f.toJSON ? f.toJSON() : f;
    const totalStories = storyCounts[f.id] != null ? storyCounts[f.id] : 0;
    const doneStories = doneCounts[f.id] != null ? doneCounts[f.id] : 0;
    plain.user_stories_count = totalStories;
    plain.stories_done = doneStories;
    plain.progress_pct = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;
    return toPlain(plain);
  });
  return {
    data,
    meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
}

async function updateFeature(id, payload, context = {}) {
  const feature = await featureRepository.findById(id);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) {
    ensureProjectInOrg(project, context.organizationId);
    if (project.status === "ARCHIVED") {
      throw new AppError("No se puede actualizar feature de un proyecto archivado", {
        statusCode: 400,
        code: ERROR_CODES.PROJECT_ARCHIVED
      });
    }
  }
  const updatePayload = {};
  if (payload.title !== undefined) {
    updatePayload.title = stripEmbeddedFeatureCodeFromTitle(payload.title, feature.number);
  }
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.acceptance_criteria !== undefined) updatePayload.acceptance_criteria = payload.acceptance_criteria;
  if (payload.implementation_criteria !== undefined) updatePayload.implementation_criteria = payload.implementation_criteria;
  if (payload.priority !== undefined) updatePayload.priority = payload.priority;
  if (payload.backlog_position !== undefined) updatePayload.backlog_position = payload.backlog_position === null || payload.backlog_position === "" ? null : Math.max(0, parseInt(payload.backlog_position, 10));
  if (payload.evidence_markdown !== undefined) {
    updatePayload.evidence_markdown = normalizeEvidenceMarkdownForPersistence(payload.evidence_markdown);
  }
  if (Object.keys(updatePayload).length === 0) return toPlain(feature);

  const updated = await featureRepository.update(id, updatePayload);
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "UPDATE",
    entity: "Feature",
    entity_id: id,
    metadata: { fields: Object.keys(updatePayload) }
  });
  return toPlain(updated);
}

async function updateFeatureStatus(id, nextStatus, context, changeRequestId = null, rules = null) {
  const feature = await featureRepository.findById(id);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) ensureProjectInOrg(project, context.organizationId);
  const currentStatus = feature.status;
  if (normalizeWorkflowStatus(currentStatus) === normalizeWorkflowStatus(nextStatus)) {
    return toPlain(feature);
  }
  if (currentStatus === "DRAFT" && nextStatus === "APPROVED") {
    if (context?.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede aprobar una feature", {
        statusCode: 403,
        code: ERROR_CODES.INVALID_ASSIGNMENT
      });
    }
  }
  validateTransition(ENTITY_TYPES.FEATURE, currentStatus, nextStatus);
  const explicitRules = resolveExplicitRules(rules);
  if (explicitRules) {
    const rulesResult = await rulesEngineService.evaluateRules(
      {
        domain: "backlog",
        entity: "feature",
        from_status: currentStatus,
        to_status: nextStatus,
        feature_id: id,
        project_id: feature.project_id
      },
      explicitRules
    );
    if (!rulesResult.allowed) {
      throw new AppError("Transición de feature bloqueada por rules engine", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { errors: rulesResult.errors, warnings: rulesResult.warnings }
      });
    }
  }

  const updatePayload = { status: nextStatus };
  if (nextStatus === "APPROVED") {
    updatePayload.approved_by = context?.user?.id;
    updatePayload.approved_at = new Date();
  }
  if (nextStatus === "ARCHIVED") {
    updatePayload.closed_at = new Date();
  }

  const updated = await featureRepository.update(id, updatePayload);
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "Feature",
    entity_id: id,
    metadata: { from: currentStatus, to: nextStatus }
  });
  if (changeRequestId) {
    await changeRequestService.markAsImplemented(changeRequestId, context);
  }
  return toPlain(updated);
}

async function deleteFeature(id, context = {}) {
  const feature = await featureRepository.findById(id);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) ensureProjectInOrg(project, context.organizationId);
  if (feature.status === "ARCHIVED") {
    throw new AppError("No se puede eliminar una feature archivada", {
      statusCode: 409,
      code: ERROR_CODES.FEATURE_INVALID_STATE,
      details: { status: feature.status }
    });
  }
  const storyCount = await featureRepository.countStoriesByFeatureId(id);
  if (storyCount > 0) {
    await userStoryRepository.unlinkStoriesFromFeature(id);
    const auditCtx = ensureAuditContext(context);
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "FEATURE_DELETE_ORPHAN_STORIES",
      entity: "Feature",
      entity_id: id,
      metadata: { story_count: storyCount }
    });
  }
  const removed = await featureRepository.removeById(id);
  if (!removed) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DELETE",
    entity: "Feature",
    entity_id: id,
    metadata: {}
  });
  return { id };
}

module.exports = {
  createFeature,
  getFeatureById,
  listFeaturesByProject,
  updateFeature,
  updateFeatureStatus,
  deleteFeature,
  ensureProjectInOrg
};
