const logger = require("../config/logger");
const authRepository = require("../modules/auth/auth.repository");

function shouldIgnorePath(path) {
  return path.startsWith("/api/v1/health");
}

function shouldRegisterAutomaticAudit(req, statusCode) {
  if (!req.user || !req.user.id) {
    return false;
  }

  return req.method !== "GET" || statusCode >= 400;
}

function auditLoggerMiddleware(req, res, next) {
  res.on("finish", () => {
    if (shouldIgnorePath(req.originalUrl)) {
      return;
    }

    if (!shouldRegisterAutomaticAudit(req, res.statusCode)) {
      return;
    }

    authRepository
      .createAuditLog({
        user_id: req.user.id,
        action: "HTTP_REQUEST",
        entity: "request",
        entity_id: req.originalUrl,
        request_id: req.requestId || null,
        metadata: {
          method: req.method,
          status_code: res.statusCode,
          request_id: req.requestId
        },
        ip_address: req.ip,
        user_agent: req.get("user-agent") || null
      })
      .catch((error) => {
        logger.error({ err: error, request_id: req.requestId }, "No se pudo registrar auditoria automatica");
      });
  });

  next();
}

module.exports = {
  auditLoggerMiddleware
};
