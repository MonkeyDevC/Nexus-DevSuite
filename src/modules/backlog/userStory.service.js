/**
 * Módulo Backlog - Service UserStory
 * Reglas de negocio: feature no archivada, asignación a usuario activo, transiciones vía workflow.validator, auditoría.
 */

const userStoryRepository = require("./userStory.repository");
const featureRepository = require("./feature.repository");
const projectsRepository = require("./projects.repository");
const featureService = require("./feature.service");
const usersRepository = require("../users/users.repository");
const sprintRepository = require("../sprints/sprint.repository");
const rulesOrchestratorService = require("../rules-engine/rulesOrchestrator.service");
const { validateTransition, ENTITY_TYPES, normalizeWorkflowStatus } = require("./workflow.validator");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { normalizeEvidenceMarkdownForPersistence } = require("./evidenceMarkdown");
const {
  assertCoherenceAfterPatch,
  assertRefinementTransitionAllowed,
  refinementRank
} = require("./userStory.refinementRules");
const { stripEmbeddedStoryCodeFromTitle } = require("./workItemHumanCodes");

const VALID_ITEM_TYPES = new Set(["STORY", "BUG", "TECH_TASK", "IMPROVEMENT"]);

function toPlain(story) {
  if (!story) return null;
  const s = typeof story.toJSON === "function" ? story.toJSON() : story;
  const assignee = s.assignee ? { id: s.assignee.id, email: s.assignee.email, name: s.assignee.name || null } : null;
  const sprint = s.sprint ? { id: s.sprint.id, name: s.sprint.name || null } : null;
  const feature = s.feature ? { id: s.feature.id, title: s.feature.title || null } : null;
  return {
    id: s.id,
    project_id: s.project_id != null ? s.project_id : null,
    feature_id: s.feature_id != null ? s.feature_id : null,
    feature,
    number: s.number,
    title: s.title,
    description: s.description,
    acceptance_criteria: s.acceptance_criteria,
    implementation_criteria: s.implementation_criteria,
    evidence_markdown: s.evidence_markdown == null ? "" : String(s.evidence_markdown),
    refinement_status: s.refinement_status != null ? s.refinement_status : "DRAFT",
    item_type: s.item_type != null ? s.item_type : "STORY",
    status: s.status,
    priority: s.priority,
    story_points: s.story_points != null ? s.story_points : null,
    backlog_position: s.backlog_position != null ? s.backlog_position : null,
    labels: Array.isArray(s.labels) ? s.labels : (s.labels != null ? [s.labels] : []),
    assigned_to: s.assigned_to,
    assignee,
    sprint_id: s.sprint_id || null,
    sprint,
    created_by: s.created_by,
    approved_by: s.approved_by,
    closed_at: s.closed_at,
    created_at: s.created_at,
    updated_at: s.updated_at
  };
}

async function resolveStoryProjectId(story) {
  if (!story) return null;
  if (story.project_id != null && String(story.project_id).trim() !== "") {
    return String(story.project_id).trim();
  }
  if (story.feature_id) {
    const f = await featureRepository.findById(story.feature_id);
    return f && f.project_id ? String(f.project_id).trim() : null;
  }
  return null;
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

async function createStory(featureId, payload, context = {}) {
  const feature = await featureRepository.findById(featureId);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (feature.status === "ARCHIVED") {
    throw new AppError("No se puede crear story en feature archivada", {
      statusCode: 400,
      code: ERROR_CODES.FEATURE_ARCHIVED
    });
  }
  const nextNumber = (await userStoryRepository.getMaxStoryNumberGlobal()) + 1;
  const body = { ...payload };
  delete body.status;
  delete body.project_id;
  delete body.refinement_status;
  const itemType =
    body.item_type != null && VALID_ITEM_TYPES.has(String(body.item_type).trim())
      ? String(body.item_type).trim()
      : "STORY";
  delete body.item_type;
  const created = await userStoryRepository.create({
    ...body,
    feature_id: featureId,
    project_id: feature.project_id,
    number: nextNumber,
    created_by: context.user?.id,
    status: "DRAFT",
    refinement_status: "DRAFT",
    item_type: itemType
  });
  return toPlain(created);
}

async function getStoryById(id, organizationId) {
  const story = await userStoryRepository.findByIdWithAssignee(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const projectId = await resolveStoryProjectId(story);
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, organizationId);
  }
  return toPlain(story);
}

async function listStoriesByFeature(featureId, { page = 1, limit = 10, status } = {}, organizationId) {
  const feature = await featureRepository.findById(featureId);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  const { items, total } = await userStoryRepository.listByFeature(featureId, { page, limit, status });
  return {
    data: items.map(toPlain),
    meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
}

async function listStoriesByProject(projectId, { page = 1, limit = 10, status, feature_id, sprint_id } = {}, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const { items, total } = await userStoryRepository.listByProject(projectId, { page, limit, status, feature_id, sprint_id });
  return {
    data: items.map(toPlain),
    meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
}

async function updateStoryStatus(id, nextStatus, context) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const storyProjectIdForStatus = await resolveStoryProjectId(story);
  if (storyProjectIdForStatus) {
    const project = await projectsRepository.findById(storyProjectIdForStatus);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  const currentStatus = story.status;
  if (normalizeWorkflowStatus(currentStatus) === normalizeWorkflowStatus(nextStatus)) {
    return {
      success: true,
      data: toPlain(story),
      rule: { executionId: null, warnings: [] }
    };
  }
  let statusRuleWarnings = [];
  let statusRuleExecutionId = null;
  if (currentStatus === "DRAFT" && nextStatus === "READY") {
    if (context?.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede aprobar una story (READY)", {
        statusCode: 403,
        code: ERROR_CODES.INVALID_ASSIGNMENT
      });
    }
  }
  if (nextStatus === "IN_PROGRESS") {
    // START_DEVELOPMENT mapping:
    // Story -> IN_PROGRESS
    // WorkOrder -> IN_PROGRESS
    // CodeDelivery -> READY
    if (!story.sprint_id) {
      throw new AppError("Contexto incompleto para iniciar desarrollo: story sin sprint asignado", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    const sprint = await sprintRepository.findById(story.sprint_id);
    if (!sprint) {
      throw new AppError("Contexto incompleto para iniciar desarrollo: sprint no encontrado", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    const startContext = {
      sprint: {
        status: sprint.status
      },
      story: {
        status: story.status,
        refinement_status: story.refinement_status != null ? story.refinement_status : "DRAFT"
      }
    };
    if (!startContext.sprint || !startContext.story) {
      throw new AppError("Invalid context for rule evaluation", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    const ruleResult = await rulesOrchestratorService.execute({
      entityType: "story",
      entityId: story.id,
      action: "START_DEVELOPMENT",
      context: startContext,
      workflowId: context.workflowId || null,
      requestContext: context
    });
    if (!ruleResult.allowed) {
      throw new AppError(ruleResult.rule.userMessage, {
        statusCode: 400,
        code: "RULE_BLOCKED",
        details: {
          executionId: ruleResult.executionId,
          guidance: ruleResult.rule.guidance,
          errors: ruleResult.errors,
          warnings: ruleResult.warnings
        }
      });
    }
    statusRuleExecutionId = ruleResult.executionId;
    if (ruleResult.warnings.length > 0) {
      statusRuleWarnings = ruleResult.warnings;
    }
  }
  assertCoherenceAfterPatch(story, { status: nextStatus });

  validateTransition(ENTITY_TYPES.STORY, currentStatus, nextStatus);

  const updatePayload = { status: nextStatus };
  if (nextStatus === "READY") {
    updatePayload.approved_by = context?.user?.id;
  }
  if (nextStatus === "ARCHIVED") {
    updatePayload.closed_at = new Date();
  }

  const updated = await userStoryRepository.update(id, updatePayload);
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "UserStory",
    entity_id: id,
    metadata: { from: currentStatus, to: nextStatus }
  });
  const plainUpdated = toPlain(updated);
  return {
    success: true,
    data: plainUpdated,
    rule: {
      executionId: statusRuleExecutionId,
      warnings: statusRuleWarnings
    }
  };
}

async function assignStory(id, assignedToUserId, context) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const projectId = await resolveStoryProjectId(story);
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  if (assignedToUserId != null) {
    const user = await usersRepository.findById(assignedToUserId);
    if (!user || !user.is_active) {
      throw new AppError("No se puede asignar a usuario inexistente o inactivo", {
        statusCode: 400,
        code: ERROR_CODES.INVALID_ASSIGNMENT
      });
    }
  }
  const updated = await userStoryRepository.update(id, { assigned_to: assignedToUserId });
  return toPlain(updated);
}

async function updateStorySprint(id, sprintId, context) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const projectId = await resolveStoryProjectId(story);
  if (!projectId) {
    throw new AppError("Historia sin proyecto resoluble", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  if (sprintId == null || String(sprintId).trim() === "") {
    const sid = story.sprint_id != null && String(story.sprint_id).trim() !== "" ? String(story.sprint_id).trim() : null;
    if (!sid) {
      return toPlain(story);
    }
    const currentSprint = await sprintRepository.findById(sid);
    if (currentSprint && currentSprint.status === "CLOSED") {
      throw new AppError("No se puede desasignar: el sprint está cerrado", {
        statusCode: 400,
        code: ERROR_CODES.SPRINT_CLOSED
      });
    }
    await userStoryRepository.update(id, { sprint_id: null });
    const auditCtx = ensureAuditContext(context);
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "STORY_UNASSIGN_SPRINT",
      entity: "USER_STORY",
      entity_id: id,
      metadata: { sprint_id: sid }
    });
    const updated = await userStoryRepository.findById(id);
    return toPlain(updated);
  }

  const targetId = String(sprintId).trim();
  const current = story.sprint_id != null && String(story.sprint_id).trim() !== "" ? String(story.sprint_id).trim() : null;
  if (current === targetId) {
    return toPlain(story);
  }
  if (current) {
    throw new AppError("La story ya está asignada a un sprint; elimine la asignación antes de reasignar", {
      statusCode: 409,
      code: ERROR_CODES.STORY_ALREADY_IN_SPRINT,
      details: { sprint_id: current }
    });
  }

  if (story.refinement_status !== "READY") {
    throw new AppError(
      "Solo se pueden asignar al sprint stories con refinement_status READY. Valor actual: " +
        String(story.refinement_status || "") +
        ".",
      { statusCode: 400, code: ERROR_CODES.STORY_NOT_READY_FOR_SPRINT }
    );
  }
  const sprint = await sprintRepository.findById(targetId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", { statusCode: 404, code: ERROR_CODES.SPRINT_NOT_FOUND });
  }
  if (sprint.status === "CLOSED") {
    throw new AppError("No se puede asignar stories a un sprint cerrado", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_CLOSED
    });
  }
  if (String(sprint.project_id).trim() !== projectId) {
    throw new AppError("El sprint no pertenece al proyecto de la story", {
      statusCode: 400,
      code: ERROR_CODES.INVALID_ASSIGNMENT
    });
  }

  await userStoryRepository.update(id, { sprint_id: targetId });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STORY_ASSIGN_SPRINT",
    entity: "USER_STORY",
    entity_id: id,
    metadata: { sprint_id: targetId }
  });
  const updated = await userStoryRepository.findById(id);
  return toPlain(updated);
}

async function updateStory(id, payload, context) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const projectId = await resolveStoryProjectId(story);
  if (projectId) {
    const project = await projectsRepository.findById(projectId);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  const updatePayload = {};
  if (payload.title !== undefined) {
    updatePayload.title = stripEmbeddedStoryCodeFromTitle(payload.title, story.number);
  }
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.priority !== undefined) updatePayload.priority = payload.priority;
  if (payload.acceptance_criteria !== undefined) updatePayload.acceptance_criteria = payload.acceptance_criteria;
  if (payload.implementation_criteria !== undefined) updatePayload.implementation_criteria = payload.implementation_criteria;
  if (payload.assigned_to !== undefined) {
    const assignedTo = payload.assigned_to === null || payload.assigned_to === "" ? null : payload.assigned_to;
    if (assignedTo != null) {
      const user = await usersRepository.findById(assignedTo);
      if (!user || !user.is_active) {
        throw new AppError("No se puede asignar a usuario inexistente o inactivo", {
          statusCode: 400,
          code: ERROR_CODES.INVALID_ASSIGNMENT
        });
      }
    }
    updatePayload.assigned_to = assignedTo;
  }
  if (payload.story_points !== undefined) updatePayload.story_points = payload.story_points === null || payload.story_points === "" ? null : Number(payload.story_points);
  if (payload.labels !== undefined) updatePayload.labels = Array.isArray(payload.labels) ? payload.labels : (payload.labels == null ? null : [payload.labels]);
  if (payload.backlog_position !== undefined) updatePayload.backlog_position = payload.backlog_position === null || payload.backlog_position === "" ? null : Math.max(0, parseInt(payload.backlog_position, 10));
  if (payload.evidence_markdown !== undefined) {
    updatePayload.evidence_markdown = normalizeEvidenceMarkdownForPersistence(payload.evidence_markdown);
  }
  if (payload.item_type !== undefined) {
    const it = String(payload.item_type).trim();
    if (!VALID_ITEM_TYPES.has(it)) {
      throw new AppError("item_type inválido", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { item_type: payload.item_type }
      });
    }
    updatePayload.item_type = it;
  }
  if (payload.refinement_status !== undefined) {
    const from = story.refinement_status != null ? String(story.refinement_status).trim() : "DRAFT";
    const to = String(payload.refinement_status).trim();
    const isMaster = context?.user?.role === "MASTER";
    assertRefinementTransitionAllowed(from, to, isMaster);
    if (isMaster && refinementRank(to) < refinementRank(from)) {
      const auditCtx = ensureAuditContext(context);
      await authRepository.createAuditLog({
        ...auditCtx,
        action: "REFINEMENT_STATUS_OVERRIDE",
        entity: "USER_STORY",
        entity_id: id,
        metadata: { from, to }
      });
    }
    updatePayload.refinement_status = to;
  }
  if (Object.keys(updatePayload).length === 0) return toPlain(story);
  assertCoherenceAfterPatch(story, updatePayload);
  const updated = await userStoryRepository.update(id, updatePayload);
  return toPlain(updated);
}

const STORY_DELETABLE_STATUSES = new Set(["DRAFT", "READY", "ARCHIVED"]);

async function deleteStory(id, context = {}) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const storyProjectId = await resolveStoryProjectId(story);
  if (storyProjectId) {
    const project = await projectsRepository.findById(storyProjectId);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  if (story.sprint_id != null && String(story.sprint_id).trim() !== "") {
    throw new AppError("No se puede eliminar una story asignada a sprint", {
      statusCode: 409,
      code: ERROR_CODES.STORY_IN_SPRINT,
      details: { sprint_id: story.sprint_id }
    });
  }
  if (!STORY_DELETABLE_STATUSES.has(story.status)) {
    throw new AppError("Estado de story no permite eliminacion", {
      statusCode: 409,
      code: ERROR_CODES.STORY_INVALID_STATE,
      details: { status: story.status }
    });
  }
  const removed = await userStoryRepository.removeById(id);
  if (!removed) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DELETE",
    entity: "UserStory",
    entity_id: id,
    metadata: {}
  });
  return { id };
}

async function createStoryForProject(projectId, payload, context = {}) {
  const pid = String(projectId).trim();
  if (payload.project_id != null && String(payload.project_id).trim() !== "" && String(payload.project_id).trim() !== pid) {
    throw new AppError("project_id del body no coincide con la URL", {
      statusCode: 400,
      code: ERROR_CODES.STORY_PROJECT_ID_BODY_MISMATCH,
      details: { path: pid, body: payload.project_id }
    });
  }
  if (payload.status != null && String(payload.status).trim() !== "" && String(payload.status).trim() !== "DRAFT") {
    throw new AppError("Solo se permite crear historias con status DRAFT", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: { status: payload.status }
    });
  }
  const project = await projectsRepository.findById(pid);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, context.organizationId);

  let featureId = null;
  if (payload.feature_id != null && String(payload.feature_id).trim() !== "") {
    featureId = String(payload.feature_id).trim();
    const feature = await featureRepository.findById(featureId);
    if (!feature || String(feature.project_id).trim() !== pid) {
      throw new AppError("feature_id no pertenece al proyecto indicado", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { feature_id: featureId }
      });
    }
    if (feature.status === "ARCHIVED") {
      throw new AppError("No se puede crear story en feature archivada", {
        statusCode: 400,
        code: ERROR_CODES.FEATURE_ARCHIVED
      });
    }
  }

  const nextNumber = (await userStoryRepository.getMaxStoryNumberGlobal()) + 1;
  const body = { ...payload };
  delete body.project_id;
  delete body.feature_id;
  delete body.status;
  delete body.refinement_status;
  const itemType =
    body.item_type != null && VALID_ITEM_TYPES.has(String(body.item_type).trim())
      ? String(body.item_type).trim()
      : "STORY";
  delete body.item_type;

  if (body.title !== undefined && body.title !== null) {
    body.title = stripEmbeddedStoryCodeFromTitle(body.title, nextNumber);
  }

  const created = await userStoryRepository.create({
    ...body,
    project_id: pid,
    feature_id: featureId,
    number: nextNumber,
    created_by: context.user?.id,
    status: "DRAFT",
    refinement_status: "DRAFT",
    item_type: itemType
  });
  return toPlain(created);
}

module.exports = {
  toPlain,
  createStory,
  createStoryForProject,
  getStoryById,
  listStoriesByFeature,
  listStoriesByProject,
  updateStoryStatus,
  assignStory,
  updateStorySprint,
  updateStory,
  deleteStory
};
