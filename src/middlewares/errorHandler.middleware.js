const logger = require("../config/logger");
const { env } = require("../config/env");
const { incrementCounter } = require("../system/metrics/metrics.store");
const { AppError } = require("../shared/errors/AppError");
const { ERROR_CODES } = require("../shared/errors/errorCodes");
const { buildError } = require("../shared/responses/responseLayer");

function errorHandlerMiddleware(error, req, res, next) {
  incrementCounter("total_errors");
  const isAppError = error instanceof AppError;
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const requestId = req.requestId || "no-request-id";

  const errSummary = {
    message: error.message,
    code: error.code || null
  };
  if (statusCode >= 500 && error.stack) {
    errSummary.stack = error.stack.split("\n").slice(0, 4).join("\n");
  }
  const logPayload = {
    request_id: requestId,
    status_code: statusCode,
    path: req.path || req.originalUrl,
    method: req.method,
    err: errSummary
  };
  const isOperationalClientError = statusCode >= 400 && statusCode < 500;
  if (isOperationalClientError) {
    logger.warn(logPayload, "Error controlado por middleware global");
  } else {
    logger.error(logPayload, "Error controlado por middleware global");
  }

  const isUnexpectedServerError = !isAppError && statusCode >= 500;
  const message =
    isUnexpectedServerError && env.NODE_ENV !== "production" ? error.message || "Error interno del servidor" : "Error interno del servidor";
  const code = error.code || ERROR_CODES.INTERNAL_SERVER_ERROR;

  const { body } = buildError({
    code,
    message,
    statusCode,
    requestId,
    details: error.details || null,
    stack: error.stack,
    includeStack: env.NODE_ENV !== "production"
  });

  res.status(statusCode).json(body);
}

module.exports = {
  errorHandlerMiddleware
};
