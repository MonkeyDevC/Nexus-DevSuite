/**
 * Módulo Sprints - Controller
 * Construye contexto y delega en service. Respuestas con buildSuccess.
 */

const sprintService = require("./sprint.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

async function createSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.createSprint(req.params.projectId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listSprintsController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await sprintService.listSprints(req.params.projectId, { page, limit, status }, req.organizationId);
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listSprintsRootController(req, res, next) {
  try {
    assertRequestValid(req);
    const projectId = req.query.project_id;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await sprintService.listSprints(projectId, { page, limit, status }, req.organizationId);
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function createSprintRootController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const { project_id: projectId, name, goal, start_date, end_date } = req.body;
    const data = await sprintService.createSprint(projectId, { name, goal, start_date, end_date }, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await sprintService.getSprintById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchSprintStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.updateSprintStatus(req.params.id, req.body.status, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.updateSprint(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function putSprintController(req, res, next) {
  return patchSprintController(req, res, next);
}

async function postStartSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.updateSprintStatus(req.params.id, "IN_PROGRESS", context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function postCloseSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.updateSprintStatus(req.params.id, "CLOSED", context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function assignStoryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.assignStoryToSprint(
      req.params.id,
      req.params.storyId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function unassignStoryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.unassignStoryFromSprint(
      req.params.id,
      req.params.storyId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listSprintStoriesController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const result = await sprintService.listStoriesBySprintId(req.params.id, { page, limit }, req.organizationId);
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getSprintSummaryController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await sprintService.getSprintSummary(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function deleteSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await sprintService.deleteSprint(req.params.id, context);
    res.status(200).json({
      success: true,
      data: { id: data.id },
      meta: {}
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createSprintController,
  listSprintsController,
  listSprintsRootController,
  createSprintRootController,
  getSprintController,
  patchSprintStatusController,
  patchSprintController,
  putSprintController,
  postStartSprintController,
  postCloseSprintController,
  assignStoryController,
  unassignStoryController,
  listSprintStoriesController,
  getSprintSummaryController,
  deleteSprintController
};
