/**
 * Validador de transiciones de estado para ChangeRequest.
 * Usa TRANSITION_MAP_CR.
 */

const { TRANSITION_MAP_CR } = require("./changeRequest.workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

/**
 * Valida que la transición de currentStatus a nextStatus esté permitida.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @throws {AppError} CHANGE_REQUEST_INVALID_TRANSITION si no permitida
 */
function validateCRTransition(currentStatus, nextStatus) {
  const allowed = TRANSITION_MAP_CR[currentStatus];
  if (allowed === undefined) {
    throw new AppError(`Estado actual de ChangeRequest no reconocido: ${currentStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
  if (!Array.isArray(allowed) || !allowed.includes(nextStatus)) {
    throw new AppError(`Transición no permitida: ${currentStatus} → ${nextStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.CHANGE_REQUEST_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
}

module.exports = {
  validateCRTransition,
  TRANSITION_MAP_CR
};
