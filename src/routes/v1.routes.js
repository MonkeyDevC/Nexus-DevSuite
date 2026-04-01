const express = require("express");
const { healthController } = require("../modules/health/health.controller");
const { tenantResolutionMiddleware } = require("../middlewares/tenantResolution.middleware");
const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const metricsRoutes = require("../system/metrics/metrics.routes");
const projectsRoutes = require("../modules/backlog/projects.routes");
const featureRoutes = require("../modules/backlog/feature.routes");
const storiesRoutes = require("../modules/backlog/stories.routes");
const releaseRoutes = require("../modules/releases/release.routes");
const changeRequestRoutes = require("../modules/changeRequests/changeRequest.routes");
const sprintRoutes = require("../modules/sprints/sprint.routes");
const incidentRoutes = require("../modules/incidents/incident.routes");
const improvementRoutes = require("../modules/improvements/improvement.routes");
const documentRoutes = require("../modules/documents/document.routes");
const documentationRoutes = require("../modules/documentation/documentation.routes");
const reportRoutes = require("../modules/reports/report.routes");
const organizationRoutes = require("../modules/organizations/organization.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const docsExportRoutes = require("../modules/docs-export/docsExport.routes");
const githubRoutes = require("../modules/github-integration/github.routes");
const codeDeliveryRoutes = require("../modules/code-deliveries/codeDelivery.routes");
const workOrdersRoutes = require("../modules/work-orders/workOrder.routes");
const tasksRoutes = require("../modules/tasks/task.routes");
const implementationStepsRoutes = require("../modules/implementation-steps/implementationStep.routes");
const aiAutomationRoutes = require("../modules/ai-automation/ai.rule.routes");
const automationRulesRoutes = require("../modules/automation/automation.rules.routes");
const workflowRoutes = require("../modules/workflow/workflow.routes");
const rulesEngineRoutes = require("../modules/rules-engine/rulesEngine.routes");
const { buildFeatureDisabledResponse } = require("../config/optionalModules");
const { env } = require("../config/env");
const devToolsRoutes = require("../system/dev-tools/devTools.routes");

const router = express.Router();

router.get("/health", healthController);
router.use(tenantResolutionMiddleware);
router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/users", usersRoutes);
router.use("/system", metricsRoutes);
if (env.NODE_ENV === "development" && env.DEV_DATA_RESET_ENABLED === true) {
  router.use("/system/dev-tools", devToolsRoutes);
}
router.use("/projects", projectsRoutes);
router.use("/features", featureRoutes);
router.use("/stories", storiesRoutes);
router.use("/releases", releaseRoutes);
router.use("/change-requests", changeRequestRoutes);
router.use("/sprints", sprintRoutes);
router.use("/incidents", incidentRoutes);
router.use("/improvements", improvementRoutes);
router.use("/documents", documentRoutes);
// Contenido documental de plataforma (documentation_contents). ISO documents permanece en /documents.
router.use("/documentation", documentationRoutes);
router.use("/docs", docsExportRoutes);
router.use("/projects/:projectId/repository", githubRoutes);
router.use("/projects/:projectId/code-deliveries", codeDeliveryRoutes);
router.use("/projects/:projectId/work-orders", workOrdersRoutes);
router.use("/projects/:projectId/tasks", tasksRoutes);
router.use("/projects/:projectId/work-orders/:workOrderId/implementation-steps", implementationStepsRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/automation", aiAutomationRoutes);
router.use("/automation", automationRulesRoutes);
router.use("/workflows", workflowRoutes);
router.use("/rules-engine", rulesEngineRoutes);
router.use("/ai/review", (req, res) => {
  void req;
  const result = buildFeatureDisabledResponse("ai-review", {
    status: "disabled",
    checks: []
  });
  return res.status(400).json(result);
});

module.exports = router;
