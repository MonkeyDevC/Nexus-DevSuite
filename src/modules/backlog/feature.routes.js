/**
 * Módulo Backlog - Rutas Features
 * GET /features, POST /features, GET /features/:id, PUT/PATCH/DELETE /features/:id, GET /features/:featureId/stories, ...
 */

const express = require("express");
const {
  getFeatureController,
  listFeaturesRootController,
  createFeatureRootController,
  putFeatureController,
  deleteFeatureController,
  patchFeatureController,
  patchFeatureStatusController,
  createStoryController,
  listStoriesController
} = require("./backlog.controller");
const {
  featureIdParamValidator,
  featureIdAsParamValidator,
  patchFeatureValidator,
  putFeatureValidator,
  patchFeatureStatusValidator,
  createStoryValidator,
  createFeatureRootValidator,
  listFeaturesProjectQueryValidator,
  listQueryValidator
} = require("./backlog.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listFeaturesProjectQueryValidator,
  listFeaturesRootController
);
router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createFeatureRootValidator,
  createFeatureRootController
);

router.get(
  "/:featureId/stories",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  featureIdAsParamValidator,
  listQueryValidator,
  listStoriesController
);
router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), featureIdParamValidator, getFeatureController);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  putFeatureValidator,
  putFeatureController
);
router.delete("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), featureIdParamValidator, deleteFeatureController);
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
