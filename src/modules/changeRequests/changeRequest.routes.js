/**
 * Módulo ChangeRequest - Rutas
 * POST /change-requests, PATCH /:id/submit, /:id/approve, /:id/reject, /:id/implement
 */

const express = require("express");
const {
  listChangeRequestsByProjectController,
  createChangeRequestController,
  updateDraftChangeRequestController,
  submitChangeRequestController,
  approveChangeRequestController,
  rejectChangeRequestController,
  implementChangeRequestController,
  restoreChangeRequestToDraftController
} = require("./changeRequest.controller");
const {
  createChangeRequestValidator,
  updateDraftChangeRequestValidator,
  crIdParamValidator,
  listChangeRequestsByProjectValidator
} = require("./changeRequest.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listChangeRequestsByProjectValidator,
  listChangeRequestsByProjectController
);

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createChangeRequestValidator,
  createChangeRequestController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  crIdParamValidator,
  updateDraftChangeRequestValidator,
  updateDraftChangeRequestController
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
router.patch(
  "/:id/restore-draft",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  crIdParamValidator,
  restoreChangeRequestToDraftController
);

module.exports = router;
