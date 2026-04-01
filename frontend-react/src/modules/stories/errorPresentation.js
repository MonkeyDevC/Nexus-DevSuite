/** Texto de UI derivado solo de error.code. */

const MAP = {
  STORY_NOT_FOUND: { tone: "secondary", userMessage: "Historia no encontrada." },
  STORY_IN_SPRINT: { tone: "warning", userMessage: "No se puede eliminar: la historia está en un sprint." },
  STORY_INVALID_STATE: { tone: "warning", userMessage: "No se puede eliminar en el estado actual." },
  FEATURE_NOT_FOUND: { tone: "secondary", userMessage: "Feature no encontrada." },
  RESOURCE_OTHER_ORGANIZATION: { tone: "danger", userMessage: "Sin acceso a este recurso." },
  VALIDATION_ERROR: { tone: "warning", userMessage: "Datos inválidos." },
  AUTH_UNAUTHORIZED: { tone: "warning", userMessage: "Sesión requerida." },
  AUTH_FORBIDDEN: { tone: "danger", userMessage: "No autorizado." },
  NETWORK_OR_UNKNOWN: { tone: "warning", userMessage: "Error de conexión o desconocido." },
  UNKNOWN_ERROR: { tone: "warning", userMessage: "Error desconocido." },
};

export function presentationForStoryError(code) {
  const c = code && MAP[code] ? code : "UNKNOWN_ERROR";
  return MAP[c] || MAP.UNKNOWN_ERROR;
}
