/**
 * ----
 * Módulo: Workflow Routes
 * Descripción: Rutas API v1 para foundation del workflow engine.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const express = require("express");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const {
  createWorkflowController,
  listWorkflowsController,
  getWorkflowByIdController,
  addNodeController,
  addEdgeController,
  addRuleController,
  validateWorkflowController,
  activateWorkflowController
} = require("./workflow.controller");

const router = express.Router();

router.post("/", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), createWorkflowController);
router.get("/", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), listWorkflowsController);
router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), getWorkflowByIdController);
router.post("/:id/nodes", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), addNodeController);
router.post("/:id/edges", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), addEdgeController);
router.post("/:id/rules", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), addRuleController);
router.post("/:id/validate", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), validateWorkflowController);
router.post("/:id/activate", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), activateWorkflowController);

module.exports = router;
