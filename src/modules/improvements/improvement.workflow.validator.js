/**
 * Módulo Improvements - Validador de transiciones de estado
 */

const { TRANSITION_MAP_IMPROVEMENT } = require("./improvement.workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function validateImprovementTransition(currentStatus, nextStatus) {
  const allowed = TRANSITION_MAP_IMPROVEMENT[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(`Transición no permitida: ${currentStatus} → ${nextStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.IMPROVEMENT_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
}

module.exports = {
  validateImprovementTransition
};
