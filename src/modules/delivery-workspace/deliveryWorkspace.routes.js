/**
 * Delivery Workspace — Rutas bajo /api/v1/projects/:projectId/code-deliveries/:deliveryId
 * GET/POST /files, GET/PATCH/DELETE /files/:fileId, POST /commit, GET /commits
 */

const express = require("express");
const {
  listFilesController,
  addFileController,
  getFileController,
  updateFileController,
  deleteFileController,
  clearFilesController,
  commitDeliveryController,
  listCommitsController,
  compareFileController,
  getFileGitDiffController,
  getDiffClassificationController,
  getMasterFileContentForDeletedController,
  getGitHubChangedFilesController,
  getGitStatusController,
  getRepoStatusMetaController,
  syncFromGitController,
  compareSnapshotWithCurrentController,
  compareDeliveriesController,
  suggestCommitMessageController,
  getCommitPreviewController,
  simulateCommitController,
  generateReleaseNotesController,
  listReviewCommentsController,
  addReviewCommentController,
  listDeliveryReviewsController,
  getMyDeliveryReviewController,
  submitDeliveryReviewController,
  canMergeDeliveryController
} = require("./deliveryWorkspace.controller");
const {
  projectIdParamValidator,
  deliveryIdParamValidator,
  fileIdParamValidator,
  addFileValidator,
  updateFileValidator,
  commitDeliveryValidator,
  syncFromGitValidator,
  releaseNotesValidator,
  commitPreviewValidator,
  addReviewCommentValidator,
  submitReviewValidator
} = require("./deliveryWorkspace.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router({ mergeParams: true });

router.get(
  "/git-status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getGitStatusController
);
router.get(
  "/repo-status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getRepoStatusMetaController
);
router.post(
  "/sync-from-git",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  syncFromGitValidator,
  syncFromGitController
);
router.get(
  "/snapshot-compare",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  compareSnapshotWithCurrentController
);
router.get(
  "/compare-with/:otherDeliveryId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  compareDeliveriesController
);
router.get(
  "/github-changed-files",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getGitHubChangedFilesController
);
router.get(
  "/diff-classification",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getDiffClassificationController
);
router.get(
  "/deleted-file-content",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getMasterFileContentForDeletedController
);
router.get(
  "/files",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  listFilesController
);
router.post(
  "/files",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  addFileValidator,
  addFileController
);
router.delete(
  "/files",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  clearFilesController
);
router.get(
  "/files/:fileId/compare",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  fileIdParamValidator,
  compareFileController
);
router.get(
  "/files/:fileId/git-diff",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  fileIdParamValidator,
  getFileGitDiffController
);
router.get(
  "/files/:fileId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  fileIdParamValidator,
  getFileController
);
router.patch(
  "/files/:fileId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  updateFileValidator,
  updateFileController
);
router.delete(
  "/files/:fileId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  fileIdParamValidator,
  deleteFileController
);
router.get(
  "/suggest-commit-message",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  suggestCommitMessageController
);
router.get(
  "/release-notes",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  releaseNotesValidator,
  generateReleaseNotesController
);
router.get(
  "/review-comments",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  listReviewCommentsController
);
router.post(
  "/review-comments",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  addReviewCommentValidator,
  addReviewCommentController
);
router.get(
  "/delivery-reviews/me",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  getMyDeliveryReviewController
);
router.get(
  "/delivery-reviews",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  listDeliveryReviewsController
);
router.post(
  "/delivery-reviews/submit",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  submitReviewValidator,
  submitDeliveryReviewController
);
router.get(
  "/can-merge",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  canMergeDeliveryController
);
router.post(
  "/commit-preview",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  commitPreviewValidator,
  getCommitPreviewController
);
router.post(
  "/commit-simulate",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  commitPreviewValidator,
  simulateCommitController
);
router.post(
  "/commit",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  commitDeliveryValidator,
  commitDeliveryController
);
router.get(
  "/commits",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  deliveryIdParamValidator,
  listCommitsController
);

module.exports = router;
