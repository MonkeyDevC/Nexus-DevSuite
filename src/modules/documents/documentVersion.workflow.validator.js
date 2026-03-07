/**
 * Módulo Documents - Validador de transiciones DocumentVersion
 */

const { TRANSITION_MAP_DOCUMENT_VERSION } = require("./documentVersion.workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function validateDocumentVersionTransition(currentStatus, nextStatus) {
  const allowed = TRANSITION_MAP_DOCUMENT_VERSION[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AppError(`Transición no permitida: ${currentStatus} → ${nextStatus}`, {
      statusCode: 400,
      code: ERROR_CODES.DOCUMENT_VERSION_INVALID_TRANSITION,
      details: { from: currentStatus, to: nextStatus }
    });
  }
}

module.exports = {
  validateDocumentVersionTransition
};
