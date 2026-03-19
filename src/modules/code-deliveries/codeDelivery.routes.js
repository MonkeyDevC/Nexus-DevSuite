/**
 * Módulo Code Deliveries - Rutas bajo /api/v1/projects/:projectId/code-deliveries y .../tasks/:taskId/deliveries
 * Aislamiento: projectId obligatorio en todas las rutas.
 * Delivery Workspace: /:deliveryId/files, /:deliveryId/commit, /:deliveryId/commits
 */

const express = require("express");
const {
  createCodeDeliveryController,
  getCodeDeliveryController,
  listCodeDeliveriesController,
  updateCodeDeliveryController
} = require("./codeDelivery.controller");
const {
  projectIdParamValidator,
  taskIdParamValidator,
  deliveryIdParamValidator,
  createCodeDeliveryValidator,
  updateCodeDeliveryValidator,
  listCodeDeliveriesQueryValidator
} = require("./codeDelivery.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const deliveryWorkspaceRoutes = require("../delivery-workspace/deliveryWorkspace.routes");

const router = express.Router({ mergeParams: true });

// Delivery Workspace (archivos y commit & push) — antes de GET /:deliveryId para que /:deliveryId/files coincida
router.use("/:deliveryId", deliveryWorkspaceRoutes);

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  listCodeDeliveriesQueryValidator,
  listCodeDeliveriesController
);

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  createCodeDeliveryValidator,
  createCodeDeliveryController
);

router.get(
  "/:deliveryId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getCodeDeliveryController
);

router.patch(
  "/:deliveryId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  updateCodeDeliveryValidator,
  updateCodeDeliveryController
);

module.exports = router;
