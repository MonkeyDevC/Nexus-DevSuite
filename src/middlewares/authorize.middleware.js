const { AppError } = require("../shared/errors/AppError");
const { ERROR_CODES } = require("../shared/errors/errorCodes");
const { incrementCounter } = require("../system/metrics/metrics.store");

function authorizeMiddleware(...allowedRoles) {
  return function authorize(req, res, next) {
    if (!req.user) {
      incrementCounter("auth_failures");
      const error = new AppError("Usuario no autenticado", {
        statusCode: 401,
        code: ERROR_CODES.AUTH_UNAUTHORIZED
      });
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      incrementCounter("auth_failures");
      const error = new AppError("No tiene permisos para realizar esta accion", {
        statusCode: 403,
        code: ERROR_CODES.AUTH_FORBIDDEN
      });
      return next(error);
    }

    return next();
  };
}

module.exports = {
  authorizeMiddleware
};
