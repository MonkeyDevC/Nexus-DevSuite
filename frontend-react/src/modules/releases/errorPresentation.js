/** Errores de dominio Releases — solo por error.code */

const MAP = {
  RELEASE_NOT_FOUND: { tone: "secondary", userMessage: "Release no encontrada." },
  RELEASE_FROZEN: { tone: "warning", userMessage: "La release está publicada; no se puede modificar ni reasignar historias." },
  RELEASE_EMPTY: { tone: "warning", userMessage: "La release debe tener al menos una historia asignada para publicar." },
  RELEASE_INVALID_STATE: { tone: "warning", userMessage: "Estado de la release no permite esta operación." },
  RELEASE_INVALID_TRANSITION: { tone: "warning", userMessage: "Transición de estado no permitida." },
  RELEASE_ALREADY_EXISTS: { tone: "warning", userMessage: "Ya existe una release con esa versión." },
  RELEASE_INVALID_VERSION: { tone: "warning", userMessage: "Versión inválida." },
  RELEASE_ARCHIVED: { tone: "warning", userMessage: "La release está archivada." },
  STORY_ALREADY_IN_RELEASE: { tone: "warning", userMessage: "La historia ya está asignada a otra release." },
  STORY_NOT_FOUND: { tone: "secondary", userMessage: "Historia no encontrada." },
  CHANGE_REQUEST_REQUIRED: { tone: "warning", userMessage: "Se requiere change_request_id aprobado para la release." },
  CHANGE_REQUEST_NOT_FOUND: { tone: "secondary", userMessage: "Change request no encontrado." },
  CHANGE_REQUEST_NOT_APPROVED: { tone: "warning", userMessage: "El change request debe estar aprobado." },
  CHANGE_REQUEST_INVALID: { tone: "warning", userMessage: "El change request no corresponde a esta release." },
  CHANGE_REQUEST_ALREADY_IMPLEMENTED: { tone: "warning", userMessage: "El change request ya fue consumido." },
  FEATURE_NOT_FOUND: { tone: "secondary", userMessage: "Feature no encontrada." },
  FEATURE_ALREADY_IN_RELEASE: { tone: "warning", userMessage: "La feature ya está en otra release." },
  VALIDATION_ERROR: { tone: "warning", userMessage: "Datos inválidos." },
  RESOURCE_OTHER_ORGANIZATION: { tone: "danger", userMessage: "Sin acceso a este recurso." },
  AUTH_FORBIDDEN: { tone: "danger", userMessage: "No autorizado." },
  NETWORK_OR_UNKNOWN: { tone: "warning", userMessage: "Error de conexión o desconocido." },
  UNKNOWN_ERROR: { tone: "warning", userMessage: "Error desconocido." },
};

export function presentationForReleaseError(code) {
  const c = code && MAP[code] ? code : "UNKNOWN_ERROR";
  return MAP[c] || MAP.UNKNOWN_ERROR;
}
