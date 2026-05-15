/**
 * Módulo Backlog - Validador de transiciones de estado
 * Única validación de transiciones; los services solo delegan aquí. Nunca retorna boolean silencioso.
 */

const { TRANSITION_MAP } = require("./workflow.constants");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const ENTITY_TYPES = {
  FEATURE: "FEATURE",
  STORY: "STORY"
};

function normalizeWorkflowStatus(value) {
  if (value == null) return "";
  return String(value).trim().toUpperCase();
}

function validateTransition(entityType, currentStatus, nextStatus) {
  const cur = normalizeWorkflowStatus(currentStatus);
  const next = normalizeWorkflowStatus(nextStatus);
  if (cur === next) {
    return;
  }
  const map = TRANSITION_MAP[entityType];
  if (!map) {
    throw new AppError(`Tipo de entidad no soportado: ${entityType}`, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }

  const allowed = map[cur];
  if (allowed == null) {
    throw new AppError(`Estado actual no permitido: ${cur || currentStatus}`, {
      statusCode: 400,
      code: entityType === ENTITY_TYPES.FEATURE ? ERROR_CODES.FEATURE_INVALID_TRANSITION : ERROR_CODES.STORY_INVALID_TRANSITION
    });
  }

  if (!allowed.includes(next)) {
    throw new AppError(
      `Transición no permitida: ${currentStatus} → ${nextStatus}`,
      {
        statusCode: 400,
        code: entityType === ENTITY_TYPES.FEATURE ? ERROR_CODES.FEATURE_INVALID_TRANSITION : ERROR_CODES.STORY_INVALID_TRANSITION,
        details: { from: currentStatus, to: nextStatus }
      }
    );
  }
}

module.exports = {
  validateTransition,
  ENTITY_TYPES,
  normalizeWorkflowStatus
};
