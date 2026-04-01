/**
 * Módulo Releases - Controller
 * Construye contexto y delega en service. Respuestas con buildSuccess.
 */

const releaseService = require("./release.service");
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

async function createReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.createRelease(req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function getReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await releaseService.getReleaseById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function listReleasesController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await releaseService.listReleases({ page, limit, status, organizationId: req.organizationId });
    res.status(200).json(buildSuccess({ items: result.data, ...result.meta }, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchReleaseStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.updateStatus(req.params.id, req.body.status, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function assignFeatureController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.assignFeatureToRelease(
      req.params.id,
      req.params.featureId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function removeFeatureController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.removeFeatureFromRelease(
      req.params.id,
      req.params.featureId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.updateReleaseDescription(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function putReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.putRelease(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function startReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.startRelease(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function publishReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.finalizeRelease(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function createHotfixController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await releaseService.createHotfixFromRelease(req.params.id, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function deleteReleaseController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await releaseService.deleteRelease(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: { id: data.id }, meta: {} });
  } catch (e) {
    next(e);
  }
}

async function deleteReleasesBulkController(req, res, next) {
  try {
    assertRequestValid(req);
    const ids = req.body.ids || [];
    const data = await releaseService.deleteReleasesBulk(ids, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createReleaseController,
  getReleaseController,
  listReleasesController,
  patchReleaseStatusController,
  assignFeatureController,
  removeFeatureController,
  patchReleaseController,
  putReleaseController,
  startReleaseController,
  publishReleaseController,
  createHotfixController,
  deleteReleaseController,
  deleteReleasesBulkController
};
