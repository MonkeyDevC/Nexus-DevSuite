/**
 * Módulo ChangeRequest - Controller
 * Construye contexto y delega en service. Respuestas con buildSuccess.
 */

const changeRequestService = require("./changeRequest.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext, assertRequestValid } = require("../../shared/utils/controllerUtils");

async function createChangeRequestController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await changeRequestService.createChangeRequest(req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function submitChangeRequestController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await changeRequestService.submitChangeRequest(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function approveChangeRequestController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await changeRequestService.approveChangeRequest(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function rejectChangeRequestController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await changeRequestService.rejectChangeRequest(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function implementChangeRequestController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await changeRequestService.markAsImplemented(req.params.id, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createChangeRequestController,
  submitChangeRequestController,
  approveChangeRequestController,
  rejectChangeRequestController,
  implementChangeRequestController
};
