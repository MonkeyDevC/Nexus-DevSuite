/** UI solo por error.code */

const MAP = {
  SPRINT_NOT_FOUND: { tone: "secondary", userMessage: "Sprint no encontrado." },
  SPRINT_CLOSED: { tone: "warning", userMessage: "El sprint está cerrado; operación no permitida." },
  SPRINT_INVALID_STATE: { tone: "warning", userMessage: "Estado del sprint no permite esta operación." },
  SPRINT_INVALID_TRANSITION: { tone: "warning", userMessage: "Transición de estado no permitida." },
  SPRINT_ALREADY_ACTIVE: { tone: "warning", userMessage: "Ya hay un sprint en curso en este proyecto." },
  SPRINT_HAS_ACTIVE_WORK: { tone: "warning", userMessage: "Hay historias en progreso o bloqueadas; no se puede cerrar." },
  SPRINT_STORY_PROJECT_MISMATCH: { tone: "warning", userMessage: "La historia no pertenece al mismo proyecto." },
  STORY_ALREADY_IN_SPRINT: { tone: "warning", userMessage: "La historia ya está en un sprint; quítela antes de reasignar." },
  STORY_NOT_FOUND: { tone: "secondary", userMessage: "Historia no encontrada." },
  STORY_NOT_READY_FOR_SPRINT: {
    tone: "warning",
    userMessage:
      "El refinamiento de la historia debe estar en READY para asignarla al sprint (edítala y sube refinamiento a READY).",
  },
  STORY_IN_SPRINT: { tone: "warning", userMessage: "La historia está asignada a un sprint." },
  PROJECT_NOT_FOUND: { tone: "secondary", userMessage: "Proyecto no encontrado." },
  AUTH_FORBIDDEN: { tone: "danger", userMessage: "No autorizado." },
  VALIDATION_ERROR: { tone: "warning", userMessage: "Datos inválidos." },
  RULE_BLOCKED: { tone: "warning", userMessage: "Reglas de flujo no permiten la acción." },
  RESOURCE_OTHER_ORGANIZATION: { tone: "danger", userMessage: "Sin acceso a este recurso." },
  NETWORK_OR_UNKNOWN: { tone: "warning", userMessage: "Error de conexión o desconocido." },
  UNKNOWN_ERROR: { tone: "warning", userMessage: "Error desconocido." },
};

export function presentationForSprintError(code) {
  const c = code && MAP[code] ? code : "UNKNOWN_ERROR";
  return MAP[c] || MAP.UNKNOWN_ERROR;
}
