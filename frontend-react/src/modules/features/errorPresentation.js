/** Texto de UI derivado solo de error.code (sin heurística sobre message). */

const MAP = {
  FEATURE_NOT_FOUND: { tone: "secondary", userMessage: "Feature no encontrada." },
  FEATURE_HAS_STORIES: { tone: "warning", userMessage: "No se puede eliminar: la feature tiene historias." },
  FEATURE_INVALID_STATE: { tone: "warning", userMessage: "No se puede eliminar en el estado actual." },
  FEATURE_ARCHIVED: { tone: "warning", userMessage: "Operación no permitida en feature archivada." },
  PROJECT_NOT_FOUND: { tone: "secondary", userMessage: "Proyecto no encontrado." },
  PROJECT_ARCHIVED: { tone: "warning", userMessage: "Proyecto archivado." },
  RESOURCE_OTHER_ORGANIZATION: { tone: "danger", userMessage: "Sin acceso a este recurso." },
  VALIDATION_ERROR: { tone: "warning", userMessage: "Datos inválidos." },
  AUTH_UNAUTHORIZED: { tone: "warning", userMessage: "Sesión requerida." },
  AUTH_FORBIDDEN: { tone: "danger", userMessage: "No autorizado." },
  NETWORK_OR_UNKNOWN: { tone: "warning", userMessage: "Error de conexión o desconocido." },
  UNKNOWN_ERROR: { tone: "warning", userMessage: "Error desconocido." },
};

export function presentationForFeatureError(code) {
  const c = code && MAP[code] ? code : "UNKNOWN_ERROR";
  return MAP[c] || MAP.UNKNOWN_ERROR;
}
