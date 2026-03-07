/**
 * Módulo ChangeRequest - Rutas
 * POST /change-requests, PATCH /:id/submit, /:id/approve, /:id/reject, /:id/implement
 */

const express = require("express");
const {
  createChangeRequestController,
  submitChangeRequestController,
  approveChangeRequestController,
  rejectChangeRequestController,
  implementChangeRequestController
} = require("./changeRequest.controller");
const { createChangeRequestValidator, crIdParamValidator } = require("./changeRequest.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createChangeRequestValidator,
  createChangeRequestController
);
router.patch(
  "/:id/submit",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  crIdParamValidator,
  submitChangeRequestController
);
router.patch(
  "/:id/approve",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  crIdParamValidator,
  approveChangeRequestController
);
router.patch(
  "/:id/reject",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  crIdParamValidator,
  rejectChangeRequestController
);
router.patch(
  "/:id/implement",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  crIdParamValidator,
  implementChangeRequestController
);

module.exports = router;
