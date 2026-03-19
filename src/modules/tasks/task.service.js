/**
 * Módulo Tasks - Service
 * Reglas de negocio: task pertenece a User Story y Project, task_number único por proyecto, auditoría y logging.
 */

const taskRepository = require("./task.repository");
const projectsRepository = require("../backlog/projects.repository");
const userStoryRepository = require("../backlog/userStory.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");

function toPlain(task) {
  if (!task) return null;
  const t = typeof task.toJSON === "function" ? task.toJSON() : task;
  return {
    id: t.id,
    task_number: t.task_number,
    project_id: t.project_id,
    user_story_id: t.user_story_id,
    work_order_id: t.work_order_id,
    title: t.title,
    description: t.description,
    status: t.status,
    assigned_to_user_id: t.assigned_to_user_id,
    priority: t.priority,
    estimated_hours: t.estimated_hours,
    created_by_user_id: t.created_by_user_id,
    created_at: t.created_at,
    updated_at: t.updated_at
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

async function createTask(projectId, userStoryId, payload, context) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, context.organizationId);

  const story = await userStoryRepository.findById(userStoryId);
  if (!story) {
    throw new AppError("User Story no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.STORY_NOT_FOUND
    });
  }
  const storyPlain = typeof story.toJSON === "function" ? story.toJSON() : story;
  if (storyPlain.feature_id) {
    const feature = await require("../backlog/feature.repository").findById(storyPlain.feature_id);
    if (!feature || feature.project_id !== projectId) {
      throw new AppError("La story no pertenece al proyecto", {
        statusCode: 400,
        code: ERROR_CODES.STORY_NOT_FOUND
      });
    }
  }

  let workOrderId = payload.work_order_id ?? null;
  if (workOrderId) {
    const workOrderRepository = require("../work-orders/workOrder.repository");
    const wo = await workOrderRepository.findByIdAndProject(workOrderId, projectId);
    if (!wo) workOrderId = null;
  }

  const nextNumber = (await taskRepository.getMaxTaskNumberByProject(projectId)) + 1;
  const created = await taskRepository.create({
    project_id: projectId,
    user_story_id: userStoryId,
    work_order_id: workOrderId,
    task_number: nextNumber,
    title: payload.title || "Sin título",
    description: payload.description ?? null,
    status: "PENDING",
    assigned_to_user_id: payload.assigned_to_user_id ?? null,
    priority: payload.priority || "MEDIUM",
    estimated_hours: payload.estimated_hours ?? null,
    created_by_user_id: context.user?.id
  });

  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "TASK_CREATED",
    entity: "task",
    entity_id: created.id,
    metadata: { project_id: projectId, user_story_id: userStoryId, task_number: nextNumber }
  });
  logger.info(
    { event: "TASK_CREATED", task_id: created.id, project_id: projectId, user_story_id: userStoryId, request_id: context.requestId },
    "Task creada"
  );

  return toPlain(created);
}

async function getTaskById(id, projectId, organizationId) {
  const task = await taskRepository.findByIdAndProject(id, projectId);
  if (!task) {
    throw new AppError("Task no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.TASK_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  return toPlain(task);
}

async function listTasks(projectId, params, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 20));
  const result = await taskRepository.listByProject(projectId, {
    page,
    limit,
    status: params.status,
    user_story_id: params.user_story_id,
    work_order_id: params.work_order_id
  });
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
  };
}

async function listTasksByUserStory(projectId, userStoryId, params, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const story = await userStoryRepository.findById(userStoryId);
  if (!story) {
    throw new AppError("User Story no encontrada", { statusCode: 404, code: ERROR_CODES.STORY_NOT_FOUND });
  }
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 50));
  const result = await taskRepository.listByUserStory(userStoryId, projectId, { page, limit });
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
  };
}

async function updateTask(id, projectId, payload, context) {
  const task = await taskRepository.findByIdAndProject(id, projectId);
  if (!task) {
    throw new AppError("Task no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.TASK_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const updatePayload = {};
  if (payload.title !== undefined) updatePayload.title = String(payload.title).trim() || task.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.assigned_to_user_id !== undefined) updatePayload.assigned_to_user_id = payload.assigned_to_user_id || null;
  if (payload.priority !== undefined && ["LOW", "MEDIUM", "HIGH"].includes(payload.priority))
    updatePayload.priority = payload.priority;
  if (payload.estimated_hours !== undefined)
    updatePayload.estimated_hours = payload.estimated_hours == null ? null : Math.max(0, parseInt(payload.estimated_hours, 10));

  const previousStatus = task.status;
  if (payload.status !== undefined && ["PENDING", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"].includes(payload.status)) {
    updatePayload.status = payload.status;
  }

  const updated = await taskRepository.update(id, projectId, updatePayload);
  if (!updated) return null;

  if (updatePayload.status && updatePayload.status !== previousStatus) {
    const auditCtx = ensureAuditContext(context);
    await authRepository.createAuditLog({
      ...auditCtx,
      action: "TASK_STATUS_CHANGED",
      entity: "task",
      entity_id: id,
      metadata: { previous_status: previousStatus, new_status: updatePayload.status }
    });
  }
  logger.info(
    { event: "TASK_UPDATED", task_id: id, project_id: projectId, request_id: context.requestId },
    "Task actualizada"
  );

  return toPlain(updated);
}

module.exports = {
  createTask,
  getTaskById,
  listTasks,
  listTasksByUserStory,
  updateTask
};
