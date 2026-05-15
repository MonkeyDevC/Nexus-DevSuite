const workOrderService = require("./workOrder.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

async function createWorkOrderController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const userStoryId = req.body.user_story_id;
    const data = await workOrderService.createWorkOrder(req.params.projectId, userStoryId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getWorkOrderController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workOrderService.getWorkOrderById(
      req.params.workOrderId,
      req.params.projectId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listWorkOrdersController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const result = await workOrderService.listWorkOrders(
      req.params.projectId,
      {
        page,
        limit,
        status: req.query.status,
        user_story_id: req.query.user_story_id,
        kind: req.query.kind
      },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function updateWorkOrderController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await workOrderService.updateWorkOrder(
      req.params.workOrderId,
      req.params.projectId,
      req.body,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function deleteWorkOrderController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await workOrderService.deleteWorkOrder(req.params.workOrderId, req.params.projectId, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createWorkOrderController,
  getWorkOrderController,
  listWorkOrdersController,
  updateWorkOrderController,
  deleteWorkOrderController
};
