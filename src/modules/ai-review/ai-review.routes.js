/**
 * AI Code Review — Rutas bajo /api/v1/ai/review
 * POST /deliveries/:deliveryId — generar revisión (query: project_id)
 * GET /deliveries/:deliveryId — última revisión (query: project_id)
 */

const express = require("express");
const { generateReviewController, getLatestReviewController } = require("./ai-review.controller");
const { deliveryIdParamValidator, projectIdQueryValidator } = require("./ai-review.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post(
  "/deliveries/:deliveryId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  deliveryIdParamValidator,
  projectIdQueryValidator,
  generateReviewController
);

router.get(
  "/deliveries/:deliveryId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  deliveryIdParamValidator,
  projectIdQueryValidator,
  getLatestReviewController
);

module.exports = router;
