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
    const rawDays = req.query && req.query.days != null ? Number.parseInt(String(req.query.days), 10) : 30;
    const windowDays = Number.isFinite(rawDays) ? Math.min(366, Math.max(1, rawDays)) : 30;
    const data = await dashboardService.getDashboardSummary(context.user, req.organizationId, { windowDays });
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getDashboardSummaryController
};
