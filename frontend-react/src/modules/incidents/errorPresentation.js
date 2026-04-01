/** UI solo por error.code */

const MAP = {
  INCIDENT_NOT_FOUND: { tone: "secondary", userMessage: "Incidente no encontrado." },
  INCIDENT_INVALID_TRANSITION: { tone: "warning", userMessage: "Transición de estado no permitida." },
  INCIDENT_INVALID_STATE: { tone: "warning", userMessage: "Estado del incidente no permite esta operación." },
  INCIDENT_CLOSED: { tone: "warning", userMessage: "El incidente está cerrado." },
  INCIDENT_CLOSE_MASTER_ONLY: { tone: "warning", userMessage: "Solo un usuario MASTER puede cerrar el incidente." },
  INCIDENT_ROOT_CAUSE_REQUIRED: { tone: "warning", userMessage: "Debe indicar el análisis de causa raíz antes de cerrar." },
  STORY_NOT_FOUND: { tone: "secondary", userMessage: "Historia no encontrada." },
  STORY_PROJECT_MISMATCH: { tone: "warning", userMessage: "La historia no pertenece a este proyecto." },
  PROJECT_NOT_FOUND: { tone: "secondary", userMessage: "Proyecto no encontrado." },
  VALIDATION_ERROR: { tone: "warning", userMessage: "Datos inválidos." },
  AUTH_FORBIDDEN: { tone: "danger", userMessage: "No autorizado." },
  RESOURCE_OTHER_ORGANIZATION: { tone: "danger", userMessage: "Sin acceso a este recurso." },
  NETWORK_OR_UNKNOWN: { tone: "warning", userMessage: "Error de conexión o desconocido." },
  UNKNOWN_ERROR: { tone: "warning", userMessage: "Error desconocido." },
};

export function presentationForIncidentError(code) {
  const c = code && MAP[code] ? code : "UNKNOWN_ERROR";
  return MAP[c] || MAP.UNKNOWN_ERROR;
}
