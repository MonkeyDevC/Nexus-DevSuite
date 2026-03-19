/**
 * Módulo Code Deliveries - Service
 * Reglas: delivery pertenece a Task y User Story, branch name estándar, auditoría y logging.
 */

const codeDeliveryRepository = require("./codeDelivery.repository");
const taskRepository = require("../tasks/task.repository");
const projectsRepository = require("../backlog/projects.repository");
const userStoryRepository = require("../backlog/userStory.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");
const eventBus = require("../../system/eventBus");

const DELIVERY_TYPES = ["FEATURE", "BUGFIX", "REFACTOR", "HOTFIX"];
const DELIVERY_STATUSES = ["PREPARING", "DRAFT", "READY", "LOCKED", "COMMITTED", "PR_CREATED", "MERGED"];

function toPlain(delivery) {
  if (!delivery) return null;
  const d = typeof delivery.toJSON === "function" ? delivery.toJSON() : delivery;
  return {
    id: d.id,
    delivery_number: d.delivery_number,
    project_id: d.project_id,
    task_id: d.task_id,
    work_order_id: d.work_order_id,
    user_story_id: d.user_story_id,
    title: d.title,
    description: d.description,
    branch_name: d.branch_name,
    commit_hash: d.commit_hash,
    pull_request_url: d.pull_request_url,
    delivery_type: d.delivery_type,
    status: d.status,
    created_by_user_id: d.created_by_user_id,
    created_at: d.created_at,
    updated_at: d.updated_at
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
 * Genera nombre de rama estándar: <type>/TASK-{task_number}-{slug}
 * type en minúscula (feature, bugfix, refactor, hotfix). slug desde title (max 40 chars).
 */
function prepareCodeDelivery(taskNumber, deliveryType, title) {
  const type = String(deliveryType || "FEATURE").toLowerCase();
  const slug = String(title || "delivery")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
  return type + "/TASK-" + taskNumber + "-" + (slug || "delivery");
}

function getEventSource(context) {
  return context && context.meta && context.meta.source ? context.meta.source : "core";
}

async function createCodeDelivery(projectId, taskId, payload, context) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, context.organizationId);

  const task = await taskRepository.findByIdAndProject(taskId, projectId);
  if (!task) {
    throw new AppError("Task no encontrada", { statusCode: 404, code: ERROR_CODES.TASK_NOT_FOUND });
  }
  const taskPlain = typeof task.toJSON === "function" ? task.toJSON() : task;
  const userStoryId = taskPlain.user_story_id;
  const workOrderId = payload.work_order_id ?? taskPlain.work_order_id ?? null;

  const story = await userStoryRepository.findById(userStoryId);
  if (!story) {
    throw new AppError("User Story no encontrada", { statusCode: 404, code: ERROR_CODES.STORY_NOT_FOUND });
  }

  const nextNumber = (await codeDeliveryRepository.getMaxDeliveryNumberByProject(projectId)) + 1;
  const deliveryType = DELIVERY_TYPES.includes(payload.delivery_type) ? payload.delivery_type : "FEATURE";
  const branchName = prepareCodeDelivery(taskPlain.task_number, deliveryType, payload.title || "delivery");

  const created = await codeDeliveryRepository.create({
    project_id: projectId,
    task_id: taskId,
    work_order_id: workOrderId,
    user_story_id: userStoryId,
    delivery_number: nextNumber,
    title: payload.title || "Sin título",
    description: payload.description ?? null,
    branch_name: branchName,
    commit_hash: payload.commit_hash ?? null,
    pull_request_url: payload.pull_request_url ?? null,
    delivery_type: deliveryType,
    status: "PREPARING",
    created_by_user_id: context.user?.id
  });

  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "DELIVERY_CREATED",
    entity: "code_delivery",
    entity_id: created.id,
    metadata: { project_id: projectId, task_id: taskId, user_story_id: userStoryId, branch_name: branchName }
  });
  logger.info(
    { event: "DELIVERY_CREATED", delivery_id: created.id, project_id: projectId, task_id: taskId, request_id: context.requestId },
    "Code delivery creada"
  );

  const createdPlain = toPlain(created);

  // Si ya viene enlazada a una Work Order, disparamos evento.
  if (createdPlain.work_order_id) {
    eventBus.emit(
      "DELIVERY_LINKED",
      {
        work_order_id: createdPlain.work_order_id,
        project_id: createdPlain.project_id,
        delivery_id: createdPlain.id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  return createdPlain;
}

async function getCodeDeliveryById(id, projectId, organizationId) {
  const { getModels } = require("../../infrastructure/db/loadModels");
  const { CodeDelivery, Task, WorkOrder, UserStory } = getModels();
  const delivery = await CodeDelivery.findOne({
    where: { id, project_id: projectId },
    include: [
      { model: Task, as: "task", attributes: ["id", "title", "task_number", "work_order_id", "user_story_id"] },
      { model: WorkOrder, as: "work_order", attributes: ["id", "ot_number", "title"] },
      { model: UserStory, as: "user_story", attributes: ["id", "title"] }
    ]
  });
  if (!delivery) {
    throw new AppError("Code delivery no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.CODE_DELIVERY_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  const plain = toPlain(delivery);
  const d = typeof delivery.toJSON === "function" ? delivery.toJSON() : delivery;
  plain.task = d.task || null;
  plain.work_order = d.work_order || null;
  plain.user_story = d.user_story || null;
  return plain;
}

async function listCodeDeliveries(projectId, params, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
  const result = await codeDeliveryRepository.listByProject(projectId, {
    page,
    limit,
    status: params.status,
    task_id: params.task_id,
    user_story_id: params.user_story_id
  });
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
  };
}

async function updateCodeDelivery(id, projectId, payload, context) {
  const delivery = await codeDeliveryRepository.findByIdAndProject(id, projectId);
  if (!delivery) {
    throw new AppError("Code delivery no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.CODE_DELIVERY_NOT_FOUND
    });
  }
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const updatePayload = {};
  const previousStatus = delivery.status;
  const statusEvents = { COMMITTED: "DELIVERY_COMMITTED", PR_CREATED: "DELIVERY_PR_CREATED", MERGED: "DELIVERY_MERGED" };

  if (payload.title !== undefined) updatePayload.title = String(payload.title).trim() || delivery.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.branch_name !== undefined) updatePayload.branch_name = payload.branch_name;
  if (payload.commit_hash !== undefined) updatePayload.commit_hash = payload.commit_hash;
  if (payload.pull_request_url !== undefined) updatePayload.pull_request_url = payload.pull_request_url;
  if (payload.delivery_type !== undefined && DELIVERY_TYPES.includes(payload.delivery_type))
    updatePayload.delivery_type = payload.delivery_type;
  if (payload.status !== undefined && DELIVERY_STATUSES.includes(payload.status)) updatePayload.status = payload.status;

  const previousWorkOrderId = delivery.work_order_id ?? null;

  const updated = await codeDeliveryRepository.update(id, projectId, updatePayload);
  if (!updated) return null;

  const updatedPlain = toPlain(updated);

  if (updatedPlain.work_order_id && updatedPlain.work_order_id !== previousWorkOrderId) {
    eventBus.emit(
      "DELIVERY_LINKED",
      {
        work_order_id: updatedPlain.work_order_id,
        project_id: updatedPlain.project_id,
        delivery_id: updatedPlain.id
      },
      {
        tenant_id: context.organizationId,
        request_id: context.requestId,
        source: getEventSource(context)
      }
    );
  }

  if (updatePayload.status && updatePayload.status !== previousStatus) {
    const auditCtx = ensureAuditContext(context);
    const action = statusEvents[updatePayload.status] || "DELIVERY_STATUS_CHANGED";
    await authRepository.createAuditLog({
      ...auditCtx,
      action,
      entity: "code_delivery",
      entity_id: id,
      metadata: { previous_status: previousStatus, new_status: updatePayload.status }
    });
    logger.info(
      { event: "DELIVERY_STATUS_CHANGED", delivery_id: id, status: updatePayload.status, request_id: context.requestId },
      "Code delivery estado actualizado"
    );
  }

  return updatedPlain;
}

module.exports = {
  prepareCodeDelivery,
  createCodeDelivery,
  getCodeDeliveryById,
  listCodeDeliveries,
  updateCodeDelivery
};
