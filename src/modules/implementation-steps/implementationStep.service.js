/**
 * Módulo Implementation Steps - Service
 * Tracking: started_at, completed_at, retry_count. duration_seconds = completed_at - started_at.
 * Auditoría: STEP_STARTED, STEP_COMPLETED, STEP_FAILED.
 */

const implementationStepRepository = require("./implementationStep.repository");
const taskRepository = require("../tasks/task.repository");
const workOrderRepository = require("../work-orders/workOrder.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");

function toPlain(step) {
  if (!step) return null;
  const s = typeof step.toJSON === "function" ? step.toJSON() : step;
  const started = s.started_at ? new Date(s.started_at).getTime() : null;
  const completed = s.completed_at ? new Date(s.completed_at).getTime() : null;
  const duration_seconds = started && completed && completed >= started ? Math.floor((completed - started) / 1000) : null;
  return {
    id: s.id,
    project_id: s.project_id,
    task_id: s.task_id,
    work_order_id: s.work_order_id,
    step_number: s.step_number,
    title: s.title,
    description: s.description,
    status: s.status,
    started_at: s.started_at,
    completed_at: s.completed_at,
    retry_count: s.retry_count,
    cursor_execution_id: s.cursor_execution_id,
    duration_seconds,
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

async function createStep(projectId, taskId, workOrderId, payload, context) {
  const project = await projectsRepository.findById(projectId);
  if (!project) throw new AppError("Proyecto no encontrado", { statusCode: 404, code: ERROR_CODES.PROJECT_NOT_FOUND });
  featureService.ensureProjectInOrg(project, context.organizationId);

  const task = await taskRepository.findByIdAndProject(taskId, projectId);
  if (!task) throw new AppError("Task no encontrada", { statusCode: 404, code: ERROR_CODES.TASK_NOT_FOUND });
  const wo = await workOrderRepository.findByIdAndProject(workOrderId, projectId);
  if (!wo) throw new AppError("Work Order no encontrada", { statusCode: 404, code: ERROR_CODES.WORK_ORDER_NOT_FOUND });

  const nextStep = (await implementationStepRepository.getMaxStepNumberByTask(taskId, projectId)) + 1;
  const created = await implementationStepRepository.create({
    project_id: projectId,
    task_id: taskId,
    work_order_id: workOrderId,
    step_number: nextStep,
    title: payload.title || "Step " + nextStep,
    description: payload.description ?? null,
    status: "PENDING",
    retry_count: 0,
    cursor_execution_id: payload.cursor_execution_id ?? null
  });
  return toPlain(created);
}

async function getStepById(id, projectId, organizationId) {
  const step = await implementationStepRepository.findByIdAndProject(id, projectId);
  if (!step) throw new AppError("Implementation Step no encontrado", { statusCode: 404, code: ERROR_CODES.IMPLEMENTATION_STEP_NOT_FOUND });
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, organizationId);
  return toPlain(step);
}

async function listByTask(projectId, taskId, params, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) throw new AppError("Proyecto no encontrado", { statusCode: 404, code: ERROR_CODES.PROJECT_NOT_FOUND });
  featureService.ensureProjectInOrg(project, organizationId);
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));
  const result = await implementationStepRepository.listByTask(taskId, projectId, { page, limit });
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
  };
}

async function listByWorkOrder(projectId, workOrderId, params, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) throw new AppError("Proyecto no encontrado", { statusCode: 404, code: ERROR_CODES.PROJECT_NOT_FOUND });
  featureService.ensureProjectInOrg(project, organizationId);
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 100));
  const result = await implementationStepRepository.listByWorkOrder(workOrderId, projectId, { page, limit });
  return {
    data: result.items.map(toPlain),
    meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) }
  };
}

async function startStep(id, projectId, context) {
  const step = await implementationStepRepository.findByIdAndProject(id, projectId);
  if (!step) throw new AppError("Implementation Step no encontrado", { statusCode: 404, code: ERROR_CODES.IMPLEMENTATION_STEP_NOT_FOUND });
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const updated = await implementationStepRepository.update(id, projectId, {
    status: "RUNNING",
    started_at: new Date()
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STEP_STARTED",
    entity: "implementation_step",
    entity_id: id,
    metadata: { project_id: projectId }
  });
  logger.info({ event: "STEP_EXECUTION_STARTED", step_id: id, project_id: projectId, request_id: context.requestId }, "Paso iniciado");
  return toPlain(updated);
}

async function completeStep(id, projectId, context) {
  const step = await implementationStepRepository.findByIdAndProject(id, projectId);
  if (!step) throw new AppError("Implementation Step no encontrado", { statusCode: 404, code: ERROR_CODES.IMPLEMENTATION_STEP_NOT_FOUND });
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const updated = await implementationStepRepository.update(id, projectId, {
    status: "COMPLETED",
    completed_at: new Date()
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STEP_COMPLETED",
    entity: "implementation_step",
    entity_id: id,
    metadata: { project_id: projectId }
  });
  logger.info({ event: "STEP_EXECUTION_COMPLETED", step_id: id, project_id: projectId, request_id: context.requestId }, "Paso completado");
  return toPlain(updated);
}

async function failStep(id, projectId, context) {
  const step = await implementationStepRepository.findByIdAndProject(id, projectId);
  if (!step) throw new AppError("Implementation Step no encontrado", { statusCode: 404, code: ERROR_CODES.IMPLEMENTATION_STEP_NOT_FOUND });
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const plain = typeof step.toJSON === "function" ? step.toJSON() : step;
  const retryCount = (plain.retry_count || 0) + 1;
  const updated = await implementationStepRepository.update(id, projectId, {
    status: "FAILED",
    completed_at: new Date(),
    retry_count: retryCount
  });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STEP_FAILED",
    entity: "implementation_step",
    entity_id: id,
    metadata: { project_id: projectId, retry_count: retryCount }
  });
  return toPlain(updated);
}

async function updateStep(id, projectId, payload, context) {
  const step = await implementationStepRepository.findByIdAndProject(id, projectId);
  if (!step) throw new AppError("Implementation Step no encontrado", { statusCode: 404, code: ERROR_CODES.IMPLEMENTATION_STEP_NOT_FOUND });
  const project = await projectsRepository.findById(projectId);
  if (project) featureService.ensureProjectInOrg(project, context.organizationId);

  const updatePayload = {};
  if (payload.title !== undefined) updatePayload.title = String(payload.title).trim() || step.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.status !== undefined && ["PENDING", "RUNNING", "COMPLETED", "FAILED"].includes(payload.status))
    updatePayload.status = payload.status;
  if (payload.cursor_execution_id !== undefined) updatePayload.cursor_execution_id = payload.cursor_execution_id;
  if (payload.retry_count !== undefined) updatePayload.retry_count = Math.max(0, parseInt(payload.retry_count, 10));

  const updated = await implementationStepRepository.update(id, projectId, updatePayload);
  return updated ? toPlain(updated) : null;
}

module.exports = {
  createStep,
  getStepById,
  listByTask,
  listByWorkOrder,
  startStep,
  completeStep,
  failStep,
  updateStep
};
