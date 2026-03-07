/**
 * Módulo Incidents - Validador de transiciones de estado
 */

const { TRANSITION_MAP_INCIDENT } = require("./incident.workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function validateIncidentTransition(currentStatus, nextStatus) {
  const allowed = TRANSITION_MAP_INCIDENT[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(`Transición no permitida: ${currentStatus} → ${nextStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.INCIDENT_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
}

module.exports = {
  validateIncidentTransition
};
