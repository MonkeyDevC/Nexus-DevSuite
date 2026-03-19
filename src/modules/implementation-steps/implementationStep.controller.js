const implementationStepService = require("./implementationStep.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

async function createStepController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await implementationStepService.createStep(
      req.params.projectId,
      req.params.taskId,
      req.params.workOrderId,
      req.body,
      context
    );
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getStepController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await implementationStepService.getStepById(
      req.params.stepId,
      req.params.projectId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listByTaskController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const result = await implementationStepService.listByTask(
      req.params.projectId,
      req.params.taskId,
      { page, limit },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listByWorkOrderController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const result = await implementationStepService.listByWorkOrder(
      req.params.projectId,
      req.params.workOrderId,
      { page, limit },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function startStepController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await implementationStepService.startStep(req.params.stepId, req.params.projectId, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function completeStepController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await implementationStepService.completeStep(req.params.stepId, req.params.projectId, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function failStepController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await implementationStepService.failStep(req.params.stepId, req.params.projectId, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function updateStepController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await implementationStepService.updateStep(
      req.params.stepId,
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
  createStepController,
  getStepController,
  listByTaskController,
  listByWorkOrderController,
  startStepController,
  completeStepController,
  failStepController,
  updateStepController
};
