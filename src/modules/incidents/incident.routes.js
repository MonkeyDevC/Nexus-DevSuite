/**
 * Módulo Incidents - Rutas bajo /api/v1/incidents
 * Orden: rutas estáticas y POST transiciones antes de /:id genérico.
 */

const express = require("express");
const {
  getIncidentController,
  patchIncidentStatusController,
  patchIncidentController,
  putIncidentController,
  listIncidentsRootController,
  createIncidentRootController,
  deleteIncidentController,
  postIncidentStartController,
  postIncidentResolveController,
  postIncidentCloseController
} = require("./incident.controller");
const {
  incidentIdParamValidator,
  patchIncidentStatusValidator,
  patchIncidentValidator,
  putIncidentValidator,
  listIncidentsRootQueryValidator,
  createIncidentRootValidator,
  postIncidentCloseValidator
} = require("./incident.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listIncidentsRootQueryValidator,
  listIncidentsRootController
);
router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createIncidentRootValidator,
  createIncidentRootController
);
router.post(
  "/:id/start",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  postIncidentStartController
);
router.post(
  "/:id/resolve",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  postIncidentResolveController
);
router.post(
  "/:id/close",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  postIncidentCloseValidator,
  postIncidentCloseController
);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  deleteIncidentController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchIncidentStatusValidator,
  patchIncidentStatusController
);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  putIncidentValidator,
  putIncidentController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  patchIncidentValidator,
  patchIncidentController
);
router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  incidentIdParamValidator,
  getIncidentController
);

module.exports = router;
