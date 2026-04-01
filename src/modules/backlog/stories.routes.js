/**
 * Módulo Backlog - Rutas Stories (UserStory)
 * GET /stories/:id, PATCH /stories/:id/status, PATCH /stories/:id/assign
 */

const express = require("express");
const {
  getStoryController,
  putStoryController,
  deleteStoryController,
  patchStoryStatusController,
  patchStoryAssignController,
  patchStorySprintController,
  postStoryAssignSprintController,
  postStoryRemoveSprintController,
  postStoryAssignReleaseController,
  postStoryRemoveReleaseController,
  patchStoryController
} = require("./backlog.controller");
const {
  storyIdParamValidator,
  putStoryValidator,
  patchStoryStatusValidator,
  patchStoryAssignValidator,
  patchStorySprintValidator,
  postStoryAssignSprintValidator,
  postStoryRemoveSprintValidator,
  postStoryAssignReleaseValidator,
  postStoryRemoveReleaseValidator,
  patchStoryValidator
} = require("./backlog.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post(
  "/:id/assign-sprint",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  postStoryAssignSprintValidator,
  postStoryAssignSprintController
);
router.post(
  "/:id/remove-sprint",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  postStoryRemoveSprintValidator,
  postStoryRemoveSprintController
);
router.post(
  "/:id/assign-release",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  postStoryAssignReleaseValidator,
  postStoryAssignReleaseController
);
router.post(
  "/:id/remove-release",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  postStoryRemoveReleaseValidator,
  postStoryRemoveReleaseController
);

router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), storyIdParamValidator, getStoryController);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  putStoryValidator,
  putStoryController
);
router.delete("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), storyIdParamValidator, deleteStoryController);
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