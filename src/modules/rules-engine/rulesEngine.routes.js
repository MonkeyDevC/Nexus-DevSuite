const express = require("express");
const rulesEngineService = require("./rulesEngine.service");
const { listRulesExecutionsController } = require("../rules-executions/rulesExecution.controller");
const { RULE_FIELDS } = require("./rulesFields");
const { RULE_OPERATORS } = require("./rulesOperators");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post("/validate-context", async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    if (payload.rules != null && !Array.isArray(payload.rules)) {
      throw new AppError("rules debe ser un arreglo", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    const data = await rulesEngineService.evaluateRules(payload.context || {}, payload.rules || [], {
      rules_version: payload.rules_version,
      correlation_id: payload.correlation_id || req.requestId || null
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/metadata", (req, res) => {
  res.status(200).json({
    fields: RULE_FIELDS,
    operators: RULE_OPERATORS
  });
});

router.get(
  "/executions",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listRulesExecutionsController
);

module.exports = router;
