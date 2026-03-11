/**
 * Dashboard - Controller
 * GET /dashboard/summary
 */

const dashboardService = require("./dashboard.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext, assertRequestValid } = require("../../shared/utils/controllerUtils");

async function getDashboardSummaryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await dashboardService.getDashboardSummary(context.user, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getDashboardSummaryController
};
