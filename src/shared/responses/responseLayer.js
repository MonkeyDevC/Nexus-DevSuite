/**
 * -------------------------------------------------------------
 * Módulo: Response Layer v1
 * Descripción: Construcción contractual de respuestas HTTP (éxito y error). Todas las respuestas siguen Response Layer v1.
 * -------------------------------------------------------------
 */

const { ERROR_CODES } = require("../errors/errorCodes");

function getUtcTimestamp() {
  return new Date().toISOString();
}

function buildSuccess(data, meta = {}) {
  return {
    success: true,
    data: data ?? null,
    meta: {
      request_id: meta.request_id ?? "no-request-id",
      timestamp: meta.timestamp ?? getUtcTimestamp()
    }
  };
}

function buildError(options) {
  const {
    code = ERROR_CODES.INTERNAL_SERVER_ERROR,
    message = "Error interno del servidor",
    statusCode = 500,
    requestId = "no-request-id",
    details = null,
    stack = null,
    includeStack = false
  } = options;

  const body = {
    success: false,
    data: null,
    error: {
      code,
      message
    },
    meta: {
      request_id: requestId,
      timestamp: getUtcTimestamp()
    }
  };

  if (details) {
    body.error.details = details;
  }

  if (includeStack && stack) {
    body.stack = stack;
  }

  return { statusCode, body };
}

module.exports = {
  buildSuccess,
  buildError,
  getUtcTimestamp
};
