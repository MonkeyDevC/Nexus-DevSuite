/**
 * Módulo Incidents - Rutas bajo /api/v1/incidents
 */

const express = require("express");
const {
  getIncidentController,
  patchIncidentStatusController,
  patchIncidentController
} = require("./incident.controller");
const {
  incidentIdParamValidator,
  patchIncidentStatusValidator,
  patchIncidentValidator,
  listIncidentsQueryValidator
} = require("./incident.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  getIncidentController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  patchIncidentStatusValidator,
  patchIncidentStatusController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  patchIncidentValidator,
  patchIncidentController
);

module.exports = router;
