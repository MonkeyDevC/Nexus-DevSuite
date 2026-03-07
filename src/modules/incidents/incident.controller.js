/**
 * Módulo Incidents - Controller
 */

const incidentService = require("./incident.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

async function createIncidentController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await incidentService.createIncident(req.params.projectId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listIncidentsController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = req.query.status || undefined;
    const result = await incidentService.listIncidents(req.params.projectId, { page, limit, status }, req.organizationId);
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getIncidentController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await incidentService.getIncidentById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchIncidentStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await incidentService.updateIncidentStatus(
      req.params.id,
      req.body.status,
      { root_cause_analysis: req.body.root_cause_analysis },
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchIncidentController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await incidentService.updateIncident(req.params.id, req.body, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createIncidentController,
  listIncidentsController,
  getIncidentController,
  patchIncidentStatusController,
  patchIncidentController
};
