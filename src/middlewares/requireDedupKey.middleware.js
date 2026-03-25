/**
 * ----
 * Módulo: Require Dedup Key Middleware
 * Descripción: Exige cabecera x-dedup-key en mutaciones donde el dominio requiere idempotencia estricta.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { AppError } = require("../shared/errors/AppError");
const { ERROR_CODES } = require("../shared/errors/errorCodes");

function requireDedupKeyMiddleware(req, res, next) {
  const headerKey = req.headers["x-dedup-key"];
  const hasKey = typeof headerKey === "string" && headerKey.trim().length > 0;
  if (!hasKey) {
    return next(
      new AppError("Cabecera x-dedup-key obligatoria para esta operación", {
        statusCode: 400,
        code: ERROR_CODES.DEDUP_KEY_REQUIRED
      })
    );
  }
  return next();
}

module.exports = {
  requireDedupKeyMiddleware
};
