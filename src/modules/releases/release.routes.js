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
  patchReleaseController,
  createHotfixController,
  deleteReleaseController,
  deleteReleasesBulkController
} = require("./release.controller");
const {
  createReleaseValidator,
  releaseIdParamValidator,
  patchReleaseStatusValidator,
  assignFeatureValidator,
  patchReleaseValidator,
  listReleasesQueryValidator,
  hotfixValidator,
  bulkDeleteReleasesValidator
} = require("./release.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post("/", authenticateMiddleware, authorizeMiddleware("MASTER"), createReleaseValidator, createReleaseController);
router.get("/", authenticateMiddleware, authorizeMiddleware("MASTER"), listReleasesQueryValidator, listReleasesController);
router.post(
  "/bulk-delete",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  bulkDeleteReleasesValidator,
  deleteReleasesBulkController
);
router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER"), releaseIdParamValidator, getReleaseController);
router.delete("/:id", authenticateMiddleware, authorizeMiddleware("MASTER"), releaseIdParamValidator, deleteReleaseController);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releaseIdParamValidator,
  patchReleaseStatusValidator,
  patchReleaseStatusController
);
router.post(
  "/:id/features/:featureId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  assignFeatureValidator,
  assignFeatureController
);
router.post(
  "/:id/hotfix",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  hotfixValidator,
  createHotfixController
);
router.patch(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  releaseIdParamValidator,
  patchReleaseValidator,
  patchReleaseController
);

module.exports = router;
