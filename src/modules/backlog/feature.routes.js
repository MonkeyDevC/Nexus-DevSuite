/**
 * Módulo Backlog - Rutas Features
 * GET /features/:id, PATCH /features/:id, PATCH /features/:id/status, POST /features/:featureId/stories
 */

const express = require("express");
const {
  getFeatureController,
  patchFeatureController,
  patchFeatureStatusController,
  createStoryController,
  listStoriesController
} = require("./backlog.controller");
const {
  featureIdParamValidator,
  featureIdAsParamValidator,
  patchFeatureValidator,
  patchFeatureStatusValidator,
  createStoryValidator,
  listQueryValidator
} = require("./backlog.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), featureIdParamValidator, getFeatureController);
router.get("/:featureId/stories", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), featureIdAsParamValidator, listQueryValidator, listStoriesController);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchFeatureValidator,
  patchFeatureController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  patchFeatureStatusValidator,
  patchFeatureStatusController
);
router.post(
  "/:featureId/stories",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  featureIdAsParamValidator,
  createStoryValidator,
  createStoryController
);

module.exports = router;