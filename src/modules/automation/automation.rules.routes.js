"use strict";

const express = require("express");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const { createAutomationRuleController } = require("./automation.rules.controller");

const { body } = require("express-validator");

const router = express.Router();

// Validación mínima de forma (schema real se valida en controller).
const createAutomationRuleValidator = [
  body("event_type").optional().isString(),
  body("conditions").optional().isArray(),
  body("actions").optional().isArray(),
  body("is_active").optional().isBoolean(),
  body("priority").optional().isInt(),
  body("tenant_id").optional().isUUID()
];

router.post(
  "/rules",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createAutomationRuleValidator,
  createAutomationRuleController
);

module.exports = router;

