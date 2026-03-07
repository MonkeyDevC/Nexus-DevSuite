/**
 * Validador de transiciones de estado para Release.
 * Usa TRANSITION_MAP_RELEASE; no permite transición desde ARCHIVED.
 */

const { TRANSITION_MAP_RELEASE } = require("./release.workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

/**
 * Valida que la transición de currentStatus a nextStatus esté permitida.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @throws {AppError} RELEASE_INVALID_TRANSITION si no permitida
 */
function validateReleaseTransition(currentStatus, nextStatus) {
  const allowed = TRANSITION_MAP_RELEASE[currentStatus];
  if (allowed === undefined) {
    throw new AppError(`Estado actual de release no reconocido: ${currentStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
  if (Array.isArray(allowed) && allowed.length === 0) {
    throw new AppError("No se permite cambiar estado desde ARCHIVED", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_ARCHIVED,
      details: { from: currentStatus, to: nextStatus }
    });
  }
  if (!Array.isArray(allowed) || !allowed.includes(nextStatus)) {
    throw new AppError(`Transición no permitida: ${currentStatus} → ${nextStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
}

module.exports = {
  validateReleaseTransition,
  TRANSITION_MAP_RELEASE
};
