/**
 * Módulo Backlog - Controllers
 * Construyen contexto { user, requestId, ip, userAgent } y delegan en services. Respuestas con buildSuccess.
 */

const projectsService = require("./projects.service");
const featureService = require("./feature.service");
const userStoryService = require("./userStory.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  const ctx = buildContextBase(req);
  ctx.organizationId = req.organizationId;
  if (req.body && req.body.change_request_id != null) {
    ctx.changeRequestId = req.body.change_request_id;
  }
  return ctx;
}

async function createProjectController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await projectsService.createProject(req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function getProjectController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await projectsService.getProjectById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function archiveProjectController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await projectsService.archiveProject(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function listProjectsController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await projectsService.listProjects({ page, limit, status, organizationId: req.organizationId });
    res.status(200).json(buildSuccess({ items: result.data, ...result.meta }, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function createFeatureController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await featureService.createFeature(req.params.projectId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function getFeatureController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await featureService.getFeatureById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function listFeaturesController(req, res, next) {
  try {
    assertRequestValid(req);
    const projectId = req.params.projectId;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await featureService.listFeaturesByProject(projectId, { page, limit, status }, req.organizationId);
    res.status(200).json(buildSuccess({ items: result.data, ...result.meta }, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchFeatureStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await featureService.updateFeatureStatus(req.params.id, req.body.status, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function createStoryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.createStory(req.params.featureId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function getStoryController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await userStoryService.getStoryById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function listStoriesController(req, res, next) {
  try {
    assertRequestValid(req);
    const featureId = req.params.featureId;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await userStoryService.listStoriesByFeature(featureId, { page, limit, status }, req.organizationId);
    res.status(200).json(buildSuccess({ items: result.data, ...result.meta }, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchStoryStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.updateStoryStatus(req.params.id, req.body.status, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchStoryAssignController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.assignStory(
      req.params.id,
      req.body.assigned_to !== undefined ? req.body.assigned_to : null,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createProjectController,
  getProjectController,
  listProjectsController,
  archiveProjectController,
  createFeatureController,
  getFeatureController,
  listFeaturesController,
  patchFeatureStatusController,
  createStoryController,
  getStoryController,
  listStoriesController,
  patchStoryStatusController,
  patchStoryAssignController
};
