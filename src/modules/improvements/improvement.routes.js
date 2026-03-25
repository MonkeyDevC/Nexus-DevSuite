/**
 * Módulo Improvements - Rutas bajo /api/v1/improvements
 */

const express = require("express");
const {
  createImprovementController,
  listImprovementsController,
  getImprovementController,
  patchImprovementStatusController
} = require("./improvement.controller");
const {
  createImprovementValidator,
  improvementIdParamValidator,
  patchImprovementStatusValidator,
  listImprovementsQueryValidator
} = require("./improvement.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { improvementsScopeLockMiddleware } = require("../../middlewares/scopeLock.middleware");

const router = express.Router();

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  improvementsScopeLockMiddleware,
  createImprovementValidator,
  createImprovementController
);
router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listImprovementsQueryValidator,
  listImprovementsController
);
router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  improvementIdParamValidator,
  getImprovementController
);
router.patch(
  "/:id/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  improvementsScopeLockMiddleware,
  improvementIdParamValidator,
  patchImprovementStatusValidator,
  patchImprovementStatusController
);

module.exports = router;
module.exports.improvementIdParamValidator = improvementIdParamValidator;
