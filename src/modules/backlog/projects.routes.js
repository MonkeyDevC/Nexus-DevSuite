/**
 * Módulo Backlog - Rutas Projects
 * POST /projects, GET /projects, GET /projects/:id, POST /projects/:projectId/features
 */

const express = require("express");
const {
  createProjectController,
  getProjectController,
  listProjectsController,
  archiveProjectController,
  updateProjectController,
  deleteProjectController,
  deleteProjectsBulkController,
  createFeatureController,
  listFeaturesController
} = require("./backlog.controller");
const {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator,
  projectIdAsParamValidator,
  createFeatureValidator,
  listQueryValidator,
  bulkDeleteProjectsValidator
} = require("./backlog.validator");
const {
  createSprintController,
  listSprintsController
} = require("../sprints/sprint.controller");
const {
  createSprintValidator,
  projectIdParamValidator: sprintProjectIdParamValidator,
  listSprintsQueryValidator
} = require("../sprints/sprint.validator");
const {
  createIncidentController,
  listIncidentsController
} = require("../incidents/incident.controller");
const {
  createIncidentValidator,
  projectIdParamValidator: incidentProjectIdParamValidator,
  listIncidentsQueryValidator
} = require("../incidents/incident.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post("/", authenticateMiddleware, authorizeMiddleware("MASTER"), createProjectValidator, createProjectController);
router.get("/", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), listQueryValidator, listProjectsController);
router.get("/:projectId/features", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), projectIdAsParamValidator, listQueryValidator, listFeaturesController);
router.get("/:projectId/sprints", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), sprintProjectIdParamValidator, listSprintsQueryValidator, listSprintsController);
router.post("/:projectId/sprints", authenticateMiddleware, authorizeMiddleware("MASTER"), sprintProjectIdParamValidator, createSprintValidator, createSprintController);
router.get("/:projectId/incidents", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), incidentProjectIdParamValidator, listIncidentsQueryValidator, listIncidentsController);
router.post("/:projectId/incidents", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), incidentProjectIdParamValidator, createIncidentValidator, createIncidentController);
router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), projectIdParamValidator, getProjectController);
router.patch("/:id", authenticateMiddleware, authorizeMiddleware("MASTER"), projectIdParamValidator, updateProjectValidator, updateProjectController);
router.patch("/:id/archive", authenticateMiddleware, authorizeMiddleware("MASTER"), projectIdParamValidator, archiveProjectController);
router.post(
  "/bulk-delete",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  bulkDeleteProjectsValidator,
  deleteProjectsBulkController
);
router.delete("/:id", authenticateMiddleware, authorizeMiddleware("MASTER"), projectIdParamValidator, deleteProjectController);
router.post(
  "/:projectId/features",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdAsParamValidator,
  createFeatureValidator,
  createFeatureController
);

module.exports = router;
