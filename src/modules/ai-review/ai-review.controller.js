const aiReviewService = require("./ai-review.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");

async function generateReviewController(req, res, next) {
  try {
    assertRequestValid(req);
    const deliveryId = req.params.deliveryId;
    const projectId = req.query.project_id || req.body.project_id;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: { message: "project_id es requerido (query o body)" }
      });
    }
    const data = await aiReviewService.generateReview(
      deliveryId,
      projectId,
      req.organizationId,
      { user: req.user, requestId: req.requestId }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getLatestReviewController(req, res, next) {
  try {
    assertRequestValid(req);
    const deliveryId = req.params.deliveryId;
    const projectId = req.query.project_id;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: { message: "project_id es requerido (query)" }
      });
    }
    const data = await aiReviewService.getLatestReviewForDelivery(
      deliveryId,
      projectId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data || {}, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  generateReviewController,
  getLatestReviewController
};
