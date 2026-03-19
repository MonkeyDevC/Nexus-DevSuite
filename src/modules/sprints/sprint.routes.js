/**
 * Módulo Sprints - Rutas bajo /api/v1/sprints
 * GET /:id, PATCH /:id/status, POST /:id/stories/:storyId, DELETE /:id/stories/:storyId, GET /:id/stories
 */

const express = require("express");
const {
  getSprintController,
  patchSprintStatusController,
  patchSprintController,
  assignStoryController,
  unassignStoryController,
  listSprintStoriesController,
  getSprintSummaryController,
  deleteSprintController
} = require("./sprint.controller");
const {
  sprintIdParamValidator,
  patchSprintStatusValidator,
  patchSprintValidator,
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
router.get(
  "/:id/summary",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  getSprintSummaryController
);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  deleteSprintController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  patchSprintStatusValidator,
  patchSprintStatusController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  patchSprintValidator,
  patchSprintController
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
