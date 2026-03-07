/**
 * Módulo Reports - Controller
 * Solo GET; buildSuccess, controllerUtils; sin lógica de negocio.
 */

const reportService = require("./report.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext, assertRequestValid } = require("../../shared/utils/controllerUtils");

async function getProjectSummaryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await reportService.getProjectSummary(req.params.projectId, context.user, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getSprintSummaryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await reportService.getSprintSummary(req.params.sprintId, context.user, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getUserActivityController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const filters = {
      from: req.query.from,
      to: req.query.to,
      action: req.query.action
    };
    const pagination = { page: req.query.page, limit: req.query.limit };
    const data = await reportService.getUserActivity(
      req.params.userId,
      context.user,
      filters,
      pagination,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getAuditLogsController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const filters = {
      entity: req.query.entity,
      entity_id: req.query.entity_id,
      user_id: req.query.user_id,
      from: req.query.from,
      to: req.query.to,
      action: req.query.action
    };
    const pagination = { page: req.query.page, limit: req.query.limit };
    const data = await reportService.getAuditLogs(context.user, filters, pagination, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getProjectSummaryController,
  getSprintSummaryController,
  getUserActivityController,
  getAuditLogsController
};
