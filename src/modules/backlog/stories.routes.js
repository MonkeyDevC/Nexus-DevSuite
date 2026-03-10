/**
 * Módulo Backlog - Rutas Stories (UserStory)
 * GET /stories/:id, PATCH /stories/:id/status, PATCH /stories/:id/assign
 */

const express = require("express");
const {
  getStoryController,
  patchStoryStatusController,
  patchStoryAssignController,
  patchStorySprintController,
  patchStoryController
} = require("./backlog.controller");
const {
  storyIdParamValidator,
  patchStoryStatusValidator,
  patchStoryAssignValidator,
  patchStorySprintValidator,
  patchStoryValidator
} = require("./backlog.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), storyIdParamValidator, getStoryController);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchStoryStatusValidator,
  patchStoryStatusController
);
router.patch(
  "/:id/assign",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchStoryAssignValidator,
  patchStoryAssignController
);
router.patch(
  "/:id/sprint",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchStorySprintValidator,
  patchStorySprintController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchStoryValidator,
  patchStoryController
);

module.exports = router;