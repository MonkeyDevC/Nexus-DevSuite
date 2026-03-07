const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const authRepository = require("../modules/auth/auth.repository");
const { AppError } = require("../shared/errors/AppError");
const { ERROR_CODES } = require("../shared/errors/errorCodes");
const { incrementCounter } = require("../system/metrics/metrics.store");

function buildUnauthorizedError(message) {
  incrementCounter("auth_failures");
  return new AppError(message, {
    statusCode: 401,
    code: ERROR_CODES.AUTH_UNAUTHORIZED
  });
}

async function authenticateMiddleware(req, res, next) {
  try {
    const authorizationHeader = req.get("authorization");
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      throw buildUnauthorizedError("Token de acceso requerido");
    }

    const token = authorizationHeader.replace("Bearer ", "").trim();
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.is_active) {
      throw buildUnauthorizedError("Token invalido o usuario inactivo");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role ? user.role.name : null,
      name: user.name || null,
      profile_photo_url: user.profile_photo_url || null
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return next(buildUnauthorizedError("Token de acceso invalido"));
    }

    return next(error);
  }
}

module.exports = {
  authenticateMiddleware
};
