/**
 * Parámetros de referencia alineados a public/js/views/settings.js (solo lectura; sin persistencia).
 */

/** @typedef {{ code: string, description: string }} StatusRow */

/** @type {StatusRow[]} */
export const SETTINGS_SPRINT_STATUSES = [
  { code: "PLANNED", description: "Planificado" },
  { code: "IN_PROGRESS", description: "En progreso" },
  { code: "CLOSED", description: "Cerrado" },
];

/** @type {StatusRow[]} */
export const SETTINGS_PROJECT_STATUSES = [
  { code: "ACTIVE", description: "Activo" },
  { code: "ARCHIVED", description: "Archivado" },
];

/** @type {StatusRow[]} */
export const SETTINGS_RELEASE_STATUSES = [
  { code: "PLANNED", description: "Planificado" },
  { code: "IN_PROGRESS", description: "En progreso" },
  { code: "QA", description: "En pruebas" },
  { code: "RELEASED", description: "Publicado" },
  { code: "ROLLED_BACK", description: "Revocado" },
  { code: "ARCHIVED", description: "Archivado" },
];

/** @type {StatusRow[]} */
export const SETTINGS_FEATURE_STATUSES = [
  { code: "DRAFT", description: "Borrador" },
  { code: "APPROVED", description: "Aprobado" },
  { code: "IN_PROGRESS", description: "En progreso" },
  { code: "DONE", description: "Hecho" },
  { code: "ARCHIVED", description: "Archivado" },
];

/** @type {StatusRow[]} */
export const SETTINGS_STORY_STATUSES = [
  { code: "DRAFT", description: "Borrador" },
  { code: "READY", description: "Lista" },
  { code: "IN_PROGRESS", description: "En progreso" },
  { code: "BLOCKED", description: "Bloqueada" },
  { code: "IN_REVIEW", description: "En revisión" },
  { code: "DONE", description: "Hecha" },
  { code: "ARCHIVED", description: "Archivada" },
];

/** @type {StatusRow[]} */
export const SETTINGS_INCIDENT_STATUSES = [
  { code: "OPEN", description: "Abierto" },
  { code: "IN_PROGRESS", description: "En progreso" },
  { code: "RESOLVED", description: "Resuelto" },
  { code: "CLOSED", description: "Cerrado" },
];

/** @type {StatusRow[]} */
export const SETTINGS_DOCUMENT_STATUSES = [
  { code: "DRAFT", description: "Borrador" },
  { code: "APPROVED", description: "Aprobado" },
  { code: "ARCHIVED", description: "Archivado" },
];

/**
 * Secciones de tabla estática: id de navegación → título + filas.
 * @type {{ id: string, title: string, rows: StatusRow[] }[]}
 */
export const SETTINGS_STATIC_SECTIONS = [
  { id: "sprint", title: "Estados de sprint", rows: SETTINGS_SPRINT_STATUSES },
  { id: "project", title: "Estados de proyecto", rows: SETTINGS_PROJECT_STATUSES },
  { id: "release", title: "Estados de release", rows: SETTINGS_RELEASE_STATUSES },
  { id: "feature", title: "Estados de feature", rows: SETTINGS_FEATURE_STATUSES },
  { id: "story", title: "Estados de user story", rows: SETTINGS_STORY_STATUSES },
  { id: "incident", title: "Estados de incidente", rows: SETTINGS_INCIDENT_STATUSES },
  { id: "document", title: "Estados de documento / versión", rows: SETTINGS_DOCUMENT_STATUSES },
];
