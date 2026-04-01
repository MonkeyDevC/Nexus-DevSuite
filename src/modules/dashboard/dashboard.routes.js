/**
 * Dashboard - Rutas
 * GET /dashboard/summary — resumen panel (KPIs, salud proyectos, actividad, reglas, CR; query ?days= ventana 1–366)
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
