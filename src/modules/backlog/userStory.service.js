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
const { validateTransition, ENTITY_TYPES } = require("./workflow.validator");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(story) {
  if (!story) return null;
  const s = typeof story.toJSON === "function" ? story.toJSON() : story;
  const assignee = s.assignee ? { id: s.assignee.id, email: s.assignee.email, name: s.assignee.name || null } : null;
  const sprint = s.sprint ? { id: s.sprint.id, name: s.sprint.name || null } : null;
  return {
    id: s.id,
    feature_id: s.feature_id,
    number: s.number,
    title: s.title,
    description: s.description,
    acceptance_criteria: s.acceptance_criteria,
    status: s.status,
    priority: s.priority,
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
  const nextNumber = (await userStoryRepository.getMaxStoryNumber(featureId)) + 1;
  const created = await userStoryRepository.create({
    ...payload,
    feature_id: featureId,
    number: nextNumber,
    created_by: context.user?.id
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
  const feature = await featureRepository.findById(story.feature_id);
  if (feature) {
    const project = await projectsRepository.findById(feature.project_id);
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

async function updateStoryStatus(id, nextStatus, context) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const feature = await featureRepository.findById(story.feature_id);
  if (feature) {
    const project = await projectsRepository.findById(feature.project_id);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  const currentStatus = story.status;
  if (currentStatus === "DRAFT" && nextStatus === "READY") {
    if (context?.user?.role !== "MASTER") {
      throw new AppError("Solo MASTER puede aprobar una story (READY)", {
        statusCode: 403,
        code: ERROR_CODES.INVALID_ASSIGNMENT
      });
    }
  }
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
  return toPlain(updated);
}

async function assignStory(id, assignedToUserId, context) {
  const story = await userStoryRepository.findById(id);
  if (!story) {
    throw new AppError("Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const feature = await featureRepository.findById(story.feature_id);
  if (feature) {
    const project = await projectsRepository.findById(feature.project_id);
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
  const feature = await featureRepository.findById(story.feature_id);
  if (!feature) {
    throw new AppError("Feature no encontrada", { statusCode: 404, code: ERROR_CODES.FEATURE_NOT_FOUND });
  }
  const project = await projectsRepository.findById(feature.project_id);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  if (sprintId != null) {
    const sprint = await sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new AppError("Sprint no encontrado", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
    }
    if (sprint.project_id !== feature.project_id) {
      throw new AppError("El sprint no pertenece al proyecto de la story", {
        statusCode: 400,
        code: ERROR_CODES.INVALID_ASSIGNMENT
      });
    }
  }
  const updated = await userStoryRepository.update(id, { sprint_id: sprintId });
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
  const feature = await featureRepository.findById(story.feature_id);
  if (feature) {
    const project = await projectsRepository.findById(feature.project_id);
    if (project) featureService.ensureProjectInOrg(project, context.organizationId);
  }
  const updatePayload = {};
  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.priority !== undefined) updatePayload.priority = payload.priority;
  if (payload.acceptance_criteria !== undefined) updatePayload.acceptance_criteria = payload.acceptance_criteria;
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
  if (Object.keys(updatePayload).length === 0) return toPlain(story);
  const updated = await userStoryRepository.update(id, updatePayload);
  return toPlain(updated);
}

module.exports = {
  createStory,
  getStoryById,
  listStoriesByFeature,
  updateStoryStatus,
  assignStory,
  updateStorySprint,
  updateStory
};
