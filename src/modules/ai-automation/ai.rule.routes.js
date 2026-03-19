"use strict";

const express = require("express");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const { parseRuleController, createRuleFromAiController } = require("./ai.rule.controller");
const { parseRuleValidator } = require("./ai.rule.validator");

const router = express.Router();

router.post(
  "/ai/parse-rule",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  parseRuleValidator,
  parseRuleController
);

router.post(
  "/ai/create-rule",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  parseRuleValidator,
  createRuleFromAiController
);

module.exports = router;

