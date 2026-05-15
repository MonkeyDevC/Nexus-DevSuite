/**
 * Rutas para backlog y sprints.
 * Product Backlog (SPA canónico): `/backlog` y `/backlog?project=<uuid>`. La ruta `/projects/:id/backlog` solo redirige (legacy).
 */
import { isValidNexusUuid } from "../cache/domainWorkCache.js";

function safeProjectId(projectId) {
  const id = projectId != null ? String(projectId).trim() : "";
  return isValidNexusUuid(id) ? id : "";
}

/** URL canónica del Product Backlog para un proyecto (query `project`, no path anidado). */
export function backlogListUrl(projectId) {
  const id = safeProjectId(projectId);
  if (!id) return "/backlog";
  return `/backlog?project=${encodeURIComponent(id)}`;
}

/** Listado de sprints de un proyecto. */
export function sprintsListUrl(projectId) {
  const id = safeProjectId(projectId);
  if (!id) return "/sprints";
  return `/sprints?project=${encodeURIComponent(id)}`;
}

/**
 * Detalle de sprint. Si se pasa `projectId`, se añade `?project=` para alinear contexto con SprintDetailPage.
 * @param {string} sprintId
 * @param {string} [projectId]
 */
export function sprintDetailUrl(sprintId, projectId) {
  const id = sprintId != null ? String(sprintId).trim() : "";
  if (!isValidNexusUuid(id)) return "/sprints";
  const base = `/sprints/${encodeURIComponent(id)}`;
  const pid = projectId != null ? safeProjectId(projectId) : "";
  return pid ? `${base}?project=${encodeURIComponent(pid)}` : base;
}

/** Crear sprint: requiere `?project=` */
export function sprintNewUrl(projectId) {
  const id = safeProjectId(projectId);
  if (!id) return "/sprints/new";
  return `/sprints/new?project=${encodeURIComponent(id)}`;
}

/**
 * @param {string} sprintId
 * @param {string} [projectId]
 */
export function sprintEditUrl(sprintId, projectId) {
  const id = sprintId != null ? String(sprintId).trim() : "";
  if (!isValidNexusUuid(id)) return "/sprints";
  const base = `/sprints/${encodeURIComponent(id)}/edit`;
  const pid = projectId != null ? safeProjectId(projectId) : "";
  return pid ? `${base}?project=${encodeURIComponent(pid)}` : base;
}
