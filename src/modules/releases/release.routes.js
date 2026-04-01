/**
 * Módulo Releases - Rutas
 * POST /releases, GET /releases, GET /releases/:id, PATCH /releases/:id/status,
 * POST /releases/:id/features/:featureId, PATCH /releases/:id (solo description).
 */

const express = require("express");
const {
  createReleaseController,
  getReleaseController,
  listReleasesController,
  patchReleaseStatusController,
  assignFeatureController,
  removeFeatureController,
  patchReleaseController,
  putReleaseController,
  startReleaseController,
  publishReleaseController,
  createHotfixController,
  deleteReleaseController,
  deleteReleasesBulkController
} = require("./release.controller");
const {
  createReleaseValidator,
  releaseIdParamValidator,
  patchReleaseStatusValidator,
  assignFeatureValidator,
  removeFeatureValidator,
  patchReleaseValidator,
  putReleaseValidator,
  releaseStartBodyValidator,
  releasePublishBodyValidator,
  listReleasesQueryValidator,
  hotfixValidator,
  bulkDeleteReleasesValidator
} = require("./release.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { releasesScopeLockMiddleware } = require("../../middlewares/scopeLock.middleware");

const router = express.Router();

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  createReleaseValidator,
  createReleaseController
);
router.get("/", authenticateMiddleware, authorizeMiddleware("MASTER"), listReleasesQueryValidator, listReleasesController);
router.post(
  "/bulk-delete",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  bulkDeleteReleasesValidator,
  deleteReleasesBulkController
);
router.post(
  "/:id/start",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  releaseStartBodyValidator,
  startReleaseController
);
router.post(
  "/:id/release",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  releasePublishBodyValidator,
  publishReleaseController
);
router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER"), releaseIdParamValidator, getReleaseController);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  releaseIdParamValidator,
  deleteReleaseController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  releaseIdParamValidator,
  patchReleaseStatusValidator,
  patchReleaseStatusController
);
router.post(
  "/:id/features/:featureId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  assignFeatureValidator,
  assignFeatureController
);
router.delete(
  "/:id/features/:featureId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  removeFeatureValidator,
  removeFeatureController
);
router.post(
  "/:id/hotfix",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  hotfixValidator,
  createHotfixController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  releaseIdParamValidator,
  patchReleaseValidator,
  patchReleaseController
);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releasesScopeLockMiddleware,
  releaseIdParamValidator,
  putReleaseValidator,
  putReleaseController
);

module.exports = router;
