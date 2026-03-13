/**
 * Dashboard - Rutas
 * GET /dashboard/summary — resumen para el panel (proyectos, stories, sprint activo, incidentes críticos, mis asignaciones)
 */

const express = require("express");
const { getDashboardSummaryController } = require("./dashboard.controller");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

const summaryHandlers = [
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  getDashboardSummaryController
];

router.get("/summary", ...summaryHandlers);
router.get("/", ...summaryHandlers);

module.exports = router;
