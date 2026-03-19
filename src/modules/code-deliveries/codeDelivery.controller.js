/**
 * Módulo Code Deliveries - Controller
 * Valida project_id y task ownership. Delega en service. Respuestas con buildSuccess.
 */

const codeDeliveryService = require("./codeDelivery.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return {
    ...buildContextBase(req),
    organizationId: req.organizationId
  };
}

async function createCodeDeliveryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const taskId = req.body.task_id;
    const data = await codeDeliveryService.createCodeDelivery(
      req.params.projectId,
      taskId,
      req.body,
      context
    );
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getCodeDeliveryController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await codeDeliveryService.getCodeDeliveryById(
      req.params.deliveryId,
      req.params.projectId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listCodeDeliveriesController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const result = await codeDeliveryService.listCodeDeliveries(
      req.params.projectId,
      {
        page,
        limit,
        status: req.query.status,
        task_id: req.query.task_id,
        user_story_id: req.query.user_story_id
      },
      req.organizationId
    );
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function updateCodeDeliveryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await codeDeliveryService.updateCodeDelivery(
      req.params.deliveryId,
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
  createCodeDeliveryController,
  getCodeDeliveryController,
  listCodeDeliveriesController,
  updateCodeDeliveryController
};
