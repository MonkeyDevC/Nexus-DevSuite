/**
 * -------------------------------------------------------------
 * Módulo: controllerUtils
 * Descripción: Utilidades compartidas para controllers (buildContext, assertRequestValid).
 * Autor: Agente NEXUS
 * -------------------------------------------------------------
 */

const { validationResult } = require("express-validator");
const { AppError } = require("../errors/AppError");
const { ERROR_CODES } = require("../errors/errorCodes");

/**
 * Construye el contexto de request para servicios (user, requestId, ip, userAgent).
 * @param {object} req - Objeto request de Express
 * @returns {{ user, requestId, ip, userAgent }}
 */
function buildContext(req) {
  const ip = req.ip;
  return {
    user: req.user,
    requestId: req.requestId || "no-request-id",
    dedupKey: req.idempotencyContext?.dedup_key || null,
    ip,
    ipAddress: ip,
    userAgent: req.get("user-agent") || null
  };
}

/**
 * Valida el resultado de express-validator; lanza AppError si hay errores de validación.
 * @param {object} req - Objeto request de Express
 * @throws {AppError} Si validationResult(req) no está vacío
 */
function assertRequestValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError("Datos de entrada invalidos", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: errors.array()
    });
  }
}

module.exports = {
  buildContext,
  assertRequestValid
};
