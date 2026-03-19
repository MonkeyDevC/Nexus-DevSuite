/**
 * GitHub Integration — Rutas bajo /api/v1/projects/:projectId/repository
 */

const express = require("express");
const {
  getBranchesController,
  getPullRequestsController,
  createBranchController,
  createPRController,
  syncController,
  getCommitsController,
  getContributorsController,
  getAvatarProxyController,
  getStatsController,
  getActivityController
} = require("./github.controller");
const {
  projectIdParamValidator,
  avatarProxyValidator,
  createBranchValidator,
  createPRValidator,
  syncValidator
} = require("./github.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router({ mergeParams: true });

router.get(
  "/branches",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  getBranchesController
);

router.get(
  "/pull-requests",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  getPullRequestsController
);

router.get(
  "/commits",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  getCommitsController
);

router.get(
  "/contributors",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  getContributorsController
);

router.get(
  "/avatar",
  avatarProxyValidator,
  getAvatarProxyController
);

router.get(
  "/stats",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  getStatsController
);

router.get(
  "/activity",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  getActivityController
);

router.post(
  "/create-branch",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createBranchValidator,
  createBranchController
);

router.post(
  "/create-pr",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createPRValidator,
  createPRController
);

router.post(
  "/sync",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  syncValidator,
  syncController
);

module.exports = router;
