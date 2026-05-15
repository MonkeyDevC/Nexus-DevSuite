/**
 * Módulo Backlog - Controllers
 * Construyen contexto { user, requestId, ip, userAgent } y delegan en services. Respuestas con buildSuccess.
 */

const projectsService = require("./projects.service");
const featureService = require("./feature.service");
const userStoryService = require("./userStory.service");
const backlogService = require("./backlog.service");
const releaseService = require("../releases/release.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

const VALIDATION_STATUS = { statusCode: 422 };

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

async function importProjectsController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await projectsService.importProjects(req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
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
    const context = buildContext(req);
    context.expectedVersion = req.body.expected_version;
    const data = await projectsService.archiveProjectWithContext(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function updateProjectController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await projectsService.updateProjectWithContext(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function deleteProjectController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    context.expectedVersion = req.body.expected_version;
    const data = await projectsService.deleteProjectWithContext(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function deleteProjectsBulkController(req, res, next) {
  try {
    assertRequestValid(req);
    const ids = req.body.ids || [];
    const data = await projectsService.deleteProjectsBulk(ids, req.organizationId);
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

async function listFeaturesRootController(req, res, next) {
  try {
    assertRequestValid(req, VALIDATION_STATUS);
    const projectId = req.query.project_id;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await featureService.listFeaturesByProject(projectId, { page, limit, status }, req.organizationId);
    res.status(200).json(buildSuccess({ items: result.data, ...result.meta }, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function createFeatureRootController(req, res, next) {
  try {
    assertRequestValid(req, VALIDATION_STATUS);
    const context = buildContext(req);
    const projectId = req.body.project_id;
    const { project_id: _p, ...payload } = req.body;
    void _p;
    const data = await featureService.createFeature(projectId, payload, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function putFeatureController(req, res, next) {
  try {
    assertRequestValid(req, VALIDATION_STATUS);
    const context = buildContext(req);
    const data = await featureService.updateFeature(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function deleteFeatureController(req, res, next) {
  try {
    assertRequestValid(req, VALIDATION_STATUS);
    const context = buildContext(req);
    const data = await featureService.deleteFeature(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchFeatureController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await featureService.updateFeature(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
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

async function listProjectStoriesController(req, res, next) {
  try {
    assertRequestValid(req);
    const projectId = req.params.projectId;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const feature_id = req.query.feature_id || undefined;
    const sprint_id = req.query.sprint_id !== undefined && req.query.sprint_id !== "" ? req.query.sprint_id : undefined;
    const result = await userStoryService.listStoriesByProject(
      projectId,
      { page, limit, status, feature_id, sprint_id },
      req.organizationId
    );
    res.status(200).json(buildSuccess({ items: result.data, ...result.meta }, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function createProjectStoryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.createStoryForProject(req.params.projectId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function getProjectBacklogController(req, res, next) {
  try {
    assertRequestValid(req);
    const projectId = req.params.projectId;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const status = req.query.status || undefined;
    const feature_id = req.query.feature_id || undefined;
    const sprint_id = req.query.sprint_id !== undefined && req.query.sprint_id !== "" ? req.query.sprint_id : undefined;
    const assigned_to = req.query.assigned_to || undefined;
    const labelsParam = req.query.labels;
    const labels = labelsParam ? (Array.isArray(labelsParam) ? labelsParam : String(labelsParam).split(",").map((l) => l.trim()).filter(Boolean)) : undefined;
    const result = await backlogService.getProjectBacklog(
      projectId,
      { page, limit, status, feature_id, sprint_id, assigned_to, labels },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function reorderProjectBacklogController(req, res, next) {
  try {
    assertRequestValid(req);
    const projectId = req.params.projectId;
    const feature_ids = Array.isArray(req.body.feature_ids) ? req.body.feature_ids : [];
    const story_ids = Array.isArray(req.body.story_ids) ? req.body.story_ids : [];
    const data = await backlogService.reorderProjectBacklog(
      projectId,
      { feature_ids, story_ids },
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
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

async function patchStorySprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const sprintId = req.body.sprint_id !== undefined ? req.body.sprint_id : null;
    const data = await userStoryService.updateStorySprint(req.params.id, sprintId, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function postStoryAssignSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.updateStorySprint(req.params.id, req.body.sprint_id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function postStoryRemoveSprintController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.updateStorySprint(req.params.id, null, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function postStoryAssignReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.assignStoryToRelease(req.params.id, req.body.release_id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function postStoryRemoveReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.removeStoryFromRelease(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchStoryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await userStoryService.updateStory(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function putStoryController(req, res, next) {
  try {
    assertRequestValid(req, VALIDATION_STATUS);
    const context = buildContext(req);
    const data = await userStoryService.updateStory(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function deleteStoryController(req, res, next) {
  try {
    assertRequestValid(req, VALIDATION_STATUS);
    const context = buildContext(req);
    const data = await userStoryService.deleteStory(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createProjectController,
  importProjectsController,
  getProjectController,
  listProjectsController,
  archiveProjectController,
  updateProjectController,
  deleteProjectController,
  deleteProjectsBulkController,
  createFeatureController,
  getFeatureController,
  listFeaturesController,
  listFeaturesRootController,
  createFeatureRootController,
  putFeatureController,
  deleteFeatureController,
  patchFeatureController,
  patchFeatureStatusController,
  createStoryController,
  getStoryController,
  listStoriesController,
  listProjectStoriesController,
  createProjectStoryController,
  getProjectBacklogController,
  reorderProjectBacklogController,
  patchStoryStatusController,
  patchStoryAssignController,
  patchStorySprintController,
  postStoryAssignSprintController,
  postStoryRemoveSprintController,
  postStoryAssignReleaseController,
  postStoryRemoveReleaseController,
  patchStoryController,
  putStoryController,
  deleteStoryController
};
