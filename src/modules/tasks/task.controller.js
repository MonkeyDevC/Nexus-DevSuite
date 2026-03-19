/**
 * Módulo Tasks - Controller
 * Valida project_id y delega en service. Respuestas con buildSuccess.
 */

const taskService = require("./task.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return {
    ...buildContextBase(req),
    organizationId: req.organizationId
  };
}

async function createTaskController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const userStoryId = req.body.user_story_id;
    const data = await taskService.createTask(
      req.params.projectId,
      userStoryId,
      req.body,
      context
    );
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getTaskController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await taskService.getTaskById(
      req.params.taskId,
      req.params.projectId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listTasksController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const result = await taskService.listTasks(
      req.params.projectId,
      { page, limit, status: req.query.status, user_story_id: req.query.user_story_id, work_order_id: req.query.work_order_id },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function updateTaskController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await taskService.updateTask(
      req.params.taskId,
      req.params.projectId,
      req.body,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createTaskController,
  getTaskController,
  listTasksController,
  updateTaskController
};
