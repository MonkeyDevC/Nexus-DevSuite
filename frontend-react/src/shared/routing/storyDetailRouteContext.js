/**
 * Contexto de navegación para `/projects/:projectId/stories/:storyId`.
 * El query `from` evita que el detalle compartido se asocie por error al Backlog del sidebar
 * y permite cerrar / migas coherentes con el origen (User Stories, Backlog, Feature, Proyecto).
 */
import { isValidNexusUuid } from "../cache/domainWorkCache.js";

export const STORY_DETAIL_FROM_QUERY = "from";

/** Mismo nombre de query que User Stories (`?feature=`) para volver al listado filtrado. */
export const STORY_DETAIL_FEATURE_FILTER_QUERY = "feature";

export const STORY_DETAIL_FROM_USER_STORIES = "user-stories";
export const STORY_DETAIL_FROM_BACKLOG = "backlog";
/** Origen: detalle de feature (overlay o página). */
export const STORY_DETAIL_FROM_FEATURE = "feature";
/** Origen: workspace de proyecto (overlay de historia). */
export const STORY_DETAIL_FROM_PROJECT = "project";

/**
 * @param {string} projectId
 * @param {string} storyId
 * @param {Record<string, string>} [query] — p. ej. `{ from: 'backlog', createWorkOrder: '1' }`
 */
export function buildStoryDetailHref(projectId, storyId, query = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    const t = String(v).trim();
    if (t !== "") qs.set(k, t);
  }
  const q = qs.toString();
  const pid = String(projectId ?? "").trim();
  const sid = String(storyId ?? "").trim();
  const base = `/projects/${encodeURIComponent(pid)}/stories/${encodeURIComponent(sid)}`;
  return q ? `${base}?${q}` : base;
}

/**
 * @param {string} pathname
 * @param {string|null|undefined} projectId
 * @returns {boolean}
 */
export function isProjectScopedStoryDetailPath(pathname, projectId) {
  const pid = projectId != null ? String(projectId).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return false;
  const prefix = `/projects/${pid}/stories/`;
  if (typeof pathname !== "string" || !pathname.startsWith(prefix)) return false;
  const rest = pathname.slice(prefix.length);
  if (!rest || rest.includes("/")) return false;
  return isValidNexusUuid(rest);
}
