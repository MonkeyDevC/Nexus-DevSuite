/**
 * Módulo Sprints - Service
 * Reglas de negocio: workflow, cierre solo MASTER, story mismo proyecto, auditoría.
 */

const sprintRepository = require("./sprint.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const userStoryRepository = require("../backlog/userStory.repository");
const featureRepository = require("../backlog/feature.repository");
const authRepository = require("../auth/auth.repository");
const rulesEngineService = require("../rules-engine/rulesEngine.service");
const { logStateTransition } = require("../orchestrator/stateTransitionLogger.service");
const { validateSprintTransition } = require("./sprint.workflow.validator");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(sprint) {
  if (!sprint) return null;
  const s = typeof sprint.toJSON === "function" ? sprint.toJSON() : sprint;
  return {
    id: s.id,
    project_id: s.project_id,
    name: s.name,
    goal: s.goal,
    start_date: s.start_date,
    end_date: s.end_date,
    status: s.status,
    created_by: s.created_by,
    closed_by: s.closed_by,
    closed_at: s.closed_at,
    created_at: s.created_at,
    updated_at: s.updated_at
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

async function createSprint(projectId, payload, context) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, context.organizationId);
  const created = await sprintRepository.create({
    project_id: projectId,
    name: payload.name,
    goal: payload.goal ?? null,
    start_date: payload.start_date ?? null,
    end_date: payload.end_date ?? null,
    status: "PLANNED",
    created_by: context.user?.id
  });
  return toPlain(created);
}

async function getSprintById(id, organizationId) {
  const sprint = await sprintRepository.findById(id);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  return toPlain(sprint);
}

async function listSprints(projectId, params = {}, organizationId) {
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
  const result = await sprintRepository.list({ projectId, page, limit, status });
  const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages }
  };
}

async function updateSprintStatus(sprintId, nextStatus, context, rules = null) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  const currentStatus = sprint.status;
  if (currentStatus === "CLOSED") {
    throw new AppError("No se puede modificar un sprint cerrado", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_CLOSED
    });
  }
  validateSprintTransition(currentStatus, nextStatus);
  const explicitRules = resolveExplicitRules(rules);
  if (explicitRules) {
    const rulesResult = await rulesEngineService.evaluateRules(
      {
        domain: "sprints",
        entity: "sprint",
        sprint_id: sprintId,
        project_id: sprint.project_id,
        from_status: currentStatus,
        to_status: nextStatus
      },
        explicitRules
    );
    if (!rulesResult.allowed) {
      throw new AppError("Transición de sprint bloqueada por rules engine", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { errors: rulesResult.errors, warnings: rulesResult.warnings }
      });
    }
  }

  if (nextStatus === "CLOSED") {
    if (context.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede cerrar el sprint", {
        statusCode: 403,
        code: ERROR_CODES.AUTH_FORBIDDEN
      });
    }
    const { getModels } = require("../../infrastructure/db/loadModels");
    const { UserStory } = getModels();
    const sprintStories = await UserStory.findAll({
      where: { sprint_id: sprintId },
      attributes: ["id", "status"]
    });
    const inProgressOrBlocked = sprintStories.filter(
      (s) => s.status === "IN_PROGRESS" || s.status === "BLOCKED"
    );
    if (inProgressOrBlocked.length > 0) {
      throw new AppError(
        "No se puede cerrar el sprint: hay stories en estado IN_PROGRESS o BLOCKED. Complételas o muévalas al backlog.",
        {
          statusCode: 400,
          code: ERROR_CODES.SPRINT_CLOSE_STORIES_IN_PROGRESS
        }
      );
    }
  }

  const auditCtx = ensureAuditContext(context);
  const updatePayload = { status: nextStatus };
  if (nextStatus === "CLOSED") {
    updatePayload.closed_by = context.user.id;
    updatePayload.closed_at = new Date();
  }

  const updated = await sprintRepository.update(sprintId, updatePayload);
  const plain = toPlain(updated);

  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "SPRINT",
    entity_id: sprintId,
    metadata: { from: currentStatus, to: nextStatus }
  });
  await logStateTransition({
    entity: "SPRINT",
    entityId: sprintId,
    fromState: currentStatus,
    toState: nextStatus,
    requestId: context.requestId,
    dedupKey: context.dedupKey,
    metadata: { action: "STATUS_CHANGE" }
  });

  if (nextStatus === "CLOSED") {
    const { getModels } = require("../../infrastructure/db/loadModels");
    const { UserStory } = getModels();
    const { Op } = require("sequelize");
    await UserStory.update(
      { sprint_id: null },
      { where: { sprint_id: sprintId, status: { [Op.ne]: "DONE" } } }
    );
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "SPRINT_CLOSED",
      entity: "SPRINT",
      entity_id: sprintId,
      metadata: { closed_by: context.user.id, closed_at: updatePayload.closed_at }
    });
  }

  return plain;
}

async function updateSprint(sprintId, payload, context) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (sprint.status === "CLOSED") {
    throw new AppError("No se puede modificar un sprint cerrado", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_CLOSED
    });
  }
  const updatePayload = {};
  if (payload.name !== undefined && payload.name !== null && String(payload.name).trim() !== "") {
    updatePayload.name = String(payload.name).trim();
  }
  if (payload.goal !== undefined) updatePayload.goal = payload.goal === null || payload.goal === "" ? null : String(payload.goal).trim();
  if (payload.start_date !== undefined) updatePayload.start_date = payload.start_date || null;
  if (payload.end_date !== undefined) updatePayload.end_date = payload.end_date || null;
  const startDate = updatePayload.start_date !== undefined ? updatePayload.start_date : sprint.start_date;
  const endDate = updatePayload.end_date !== undefined ? updatePayload.end_date : sprint.end_date;
  if (startDate && endDate && endDate < startDate) {
    throw new AppError("La fecha fin no puede ser anterior a la fecha de inicio", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (Object.keys(updatePayload).length === 0) return toPlain(sprint);
  const updated = await sprintRepository.update(sprintId, updatePayload);
  return toPlain(updated);
}

async function assignStoryToSprint(sprintId, storyId, context) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (sprint.status === "CLOSED") {
    throw new AppError("No se puede asignar stories a un sprint cerrado", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_CLOSED
    });
  }

  const story = await userStoryRepository.findById(storyId);
  if (!story) {
    throw new AppError("User story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const feature = await featureRepository.findById(story.feature_id);
  if (!feature || feature.project_id !== sprint.project_id) {
    throw new AppError("La story no pertenece al mismo proyecto que el sprint", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_STORY_PROJECT_MISMATCH
    });
  }
  await userStoryRepository.update(storyId, { sprint_id: sprintId });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STORY_ASSIGN_SPRINT",
    entity: "USER_STORY",
    entity_id: storyId,
    metadata: { sprint_id: sprintId }
  });

  return toPlain(await sprintRepository.findById(sprintId));
}

async function unassignStoryFromSprint(sprintId, storyId, context) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (sprint.status === "CLOSED") {
    throw new AppError("No se puede desasignar stories de un sprint cerrado", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_CLOSED
    });
  }

  const story = await userStoryRepository.findById(storyId);
  if (!story || story.sprint_id !== sprintId) {
    throw new AppError("User story no encontrada o no asignada a este sprint", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }

  await userStoryRepository.update(storyId, { sprint_id: null });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STORY_UNASSIGN_SPRINT",
    entity: "USER_STORY",
    entity_id: storyId,
    metadata: { sprint_id: sprintId }
  });

  return toPlain(await sprintRepository.findById(sprintId));
}

async function listStoriesBySprintId(sprintId, params = {}, organizationId) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  const { getModels } = require("../../infrastructure/db/loadModels");
  const { UserStory } = getModels();
  const sequelize = UserStory.sequelize;
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const { rows, count } = await UserStory.findAndCountAll({
    where: { sprint_id: sprintId },
    limit,
    offset,
    order: [
      [sequelize.literal("(backlog_position IS NULL)"), "ASC"],
      ["backlog_position", "ASC"],
      ["created_at", "DESC"]
    ]
  });
  const totalPages = count === 0 ? 0 : Math.ceil(count / limit);
  return {
    data: rows.map((s) => (typeof s.toJSON === "function" ? s.toJSON() : s)),
    meta: { total: count, page, limit, totalPages }
  };
}

async function getSprintSummary(sprintId, organizationId) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  const { getModels } = require("../../infrastructure/db/loadModels");
  const { UserStory } = getModels();
  const stories = await UserStory.findAll({
    where: { sprint_id: sprintId },
    attributes: ["id", "status", "story_points"]
  });
  let totalStoryPoints = 0;
  let completedStoryPoints = 0;
  let storiesDoneCount = 0;
  stories.forEach((s) => {
    const pts = s.story_points != null ? Number(s.story_points) : 0;
    totalStoryPoints += pts;
    if (s.status === "DONE") {
      completedStoryPoints += pts;
      storiesDoneCount += 1;
    }
  });
  return {
    stories_count: stories.length,
    stories_done_count: storiesDoneCount,
    total_story_points: totalStoryPoints,
    completed_story_points: completedStoryPoints
  };
}

async function deleteSprint(sprintId, context) {
  const sprint = await sprintRepository.findById(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(sprint.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (sprint.status !== "PLANNED") {
    throw new AppError("Solo se puede eliminar un sprint en estado PLANNED", {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_CANNOT_DELETE
    });
  }
  await sprintRepository.remove(sprintId);
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "SPRINT_DELETED",
    entity: "SPRINT",
    entity_id: sprintId,
    metadata: { project_id: sprint.project_id, name: sprint.name }
  });
  return { deleted: true, id: sprintId };
}

module.exports = {
  createSprint,
  getSprintById,
  listSprints,
  updateSprintStatus,
  updateSprint,
  assignStoryToSprint,
  unassignStoryFromSprint,
  listStoriesBySprintId,
  getSprintSummary,
  deleteSprint,
  toPlain
};
