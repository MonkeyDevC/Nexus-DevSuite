/**
 * Módulo Sprints - Rutas bajo /api/v1/sprints
 * GET /?project_id=, POST /, GET /:id, PUT /:id, POST /:id/start|close, DELETE /:id, stories...
 */

const express = require("express");
const {
  getSprintController,
  patchSprintStatusController,
  patchSprintController,
  putSprintController,
  postStartSprintController,
  postCloseSprintController,
  assignStoryController,
  unassignStoryController,
  listSprintStoriesController,
  getSprintSummaryController,
  deleteSprintController,
  listSprintsRootController,
  createSprintRootController
} = require("./sprint.controller");
const {
  sprintIdParamValidator,
  patchSprintStatusValidator,
  patchSprintValidator,
  putSprintValidator,
  storyIdParamValidator,
  listSprintsQueryValidator,
  listSprintsRootQueryValidator,
  createSprintRootValidator
} = require("./sprint.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { sprintsScopeLockMiddleware } = require("../../middlewares/scopeLock.middleware");

const router = express.Router();

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listSprintsRootQueryValidator,
  listSprintsRootController
);
router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  createSprintRootValidator,
  createSprintRootController
);

router.get(
  "/:id/summary",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  getSprintSummaryController
);
router.get(
  "/:id/stories",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  listSprintsQueryValidator,
  listSprintStoriesController
);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  deleteSprintController
);
router.post(
  "/:id/start",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  postStartSprintController
);
router.post(
  "/:id/close",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  postCloseSprintController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  patchSprintStatusValidator,
  patchSprintStatusController
);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  putSprintValidator,
  putSprintController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  patchSprintValidator,
  patchSprintController
);
router.post(
  "/:id/stories/:storyId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  storyIdParamValidator,
  assignStoryController
);
router.delete(
  "/:id/stories/:storyId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintsScopeLockMiddleware,
  sprintIdParamValidator,
  storyIdParamValidator,
  unassignStoryController
);
router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  sprintIdParamValidator,
  getSprintController
);

module.exports = router;
