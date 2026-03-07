/**
 * Módulo Improvements - Controller
 */

const improvementService = require("./improvement.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

async function createImprovementController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await improvementService.createImprovement(req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listImprovementsController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const project_id = req.query.project_id || undefined;
    const incident_id = req.query.incident_id || undefined;
    const status = req.query.status || undefined;
    const result = await improvementService.listImprovements(
      { page, limit, project_id, incident_id, status },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getImprovementController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await improvementService.getImprovementById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchImprovementStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await improvementService.updateImprovementStatus(
      req.params.id,
      req.body.status,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createImprovementController,
  listImprovementsController,
  getImprovementController,
  patchImprovementStatusController
};
