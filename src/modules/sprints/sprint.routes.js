/**
 * Módulo Sprints - Rutas bajo /api/v1/sprints
 * GET /:id, PATCH /:id/status, POST /:id/stories/:storyId, DELETE /:id/stories/:storyId, GET /:id/stories
 */

const express = require("express");
const {
  getSprintController,
  patchSprintStatusController,
  assignStoryController,
  unassignStoryController,
  listSprintStoriesController
} = require("./sprint.controller");
const {
  sprintIdParamValidator,
  patchSprintStatusValidator,
  storyIdParamValidator
} = require("./sprint.validator");
const { listSprintsQueryValidator } = require("./sprint.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  getSprintController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  patchSprintStatusValidator,
  patchSprintStatusController
);
router.post(
  "/:id/stories/:storyId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  storyIdParamValidator,
  assignStoryController
);
router.delete(
  "/:id/stories/:storyId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  storyIdParamValidator,
  unassignStoryController
);
router.get(
  "/:id/stories",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  listSprintsQueryValidator,
  listSprintStoriesController
);

module.exports = router;
