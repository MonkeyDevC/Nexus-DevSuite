/**
 * Módulo Reports - Rutas
 * GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary,
 * GET /reports/users/:userId/activity, GET /reports/audit
 */

const express = require("express");
const {
  getProjectSummaryController,
  getSprintSummaryController,
  getUserActivityController,
  getAuditLogsController
} = require("./report.controller");
const {
  projectIdParam,
  sprintIdParam,
  userIdParam,
  auditQueryValidator,
  activityQueryValidator
} = require("./report.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/projects/:projectId/summary",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParam,
  getProjectSummaryController
);

router.get(
  "/sprints/:sprintId/summary",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParam,
  getSprintSummaryController
);

router.get(
  "/users/:userId/activity",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  userIdParam,
  activityQueryValidator,
  getUserActivityController
);

router.get(
  "/audit",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  auditQueryValidator,
  getAuditLogsController
);

module.exports = router;
