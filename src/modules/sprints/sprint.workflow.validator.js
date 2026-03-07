/**
 * Módulo Sprints - Validador de transiciones de estado
 * Valida transiciones de Sprint según TRANSITION_MAP_SPRINT.
 */

const { TRANSITION_MAP_SPRINT } = require("./sprint.workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function validateSprintTransition(currentStatus, nextStatus) {
  const allowed = TRANSITION_MAP_SPRINT[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(`Transición no permitida: ${currentStatus} → ${nextStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.SPRINT_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
}

module.exports = {
  validateSprintTransition
};
