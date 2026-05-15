/**
 * Redirecciones desde rutas antiguas bajo /projects/:id/... para no romper enlaces ni E2E.
 */
import { Navigate, useLocation, useParams } from "react-router-dom";
import { isValidNexusUuid } from "../shared/cache/domainWorkCache.js";
import { sprintDetailUrl, sprintEditUrl, sprintNewUrl, sprintsListUrl } from "../shared/routing/workspaceNavUrls.js";

export function LegacyProjectSprintsRedirect() {
  const { projectId } = useParams();
  const pid = projectId != null ? String(projectId).trim() : "";
  return <Navigate to={sprintsListUrl(pid)} replace />;
}

export function LegacyProjectSprintNewRedirect() {
  const { projectId } = useParams();
  const pid = projectId != null ? String(projectId).trim() : "";
  return <Navigate to={sprintNewUrl(pid)} replace />;
}

export function LegacyProjectSprintDetailRedirect() {
  const { projectId, sprintId } = useParams();
  const pid = projectId != null ? String(projectId).trim() : "";
  const base = sprintDetailUrl(sprintId);
  const qs = isValidNexusUuid(pid) ? `?project=${encodeURIComponent(pid)}` : "";
  return <Navigate to={`${base}${qs}`} replace />;
}

export function LegacyProjectSprintEditRedirect() {
  const { projectId, sprintId } = useParams();
  const pid = projectId != null ? String(projectId).trim() : "";
  const base = sprintEditUrl(sprintId);
  const qs = isValidNexusUuid(pid) ? `?project=${encodeURIComponent(pid)}` : "";
  return <Navigate to={`${base}${qs}`} replace />;
}

/**
 * `/projects/:projectId/backlog` → canónico `/backlog?...`.
 * El `projectId` del path sobrescribe `project` en query; si el path no es UUID válido, se elimina `project` del destino.
 * Si no quedan params, destino exacto `/backlog` (nunca `/backlog?` vacío).
 */
export function LegacyProjectBacklogRedirect() {
  const { projectId } = useParams();
  const { search } = useLocation();
  const pid = projectId != null ? String(projectId).trim() : "";
  const next = new URLSearchParams(search);
  if (isValidNexusUuid(pid)) {
    next.set("project", pid);
  } else {
    next.delete("project");
  }
  const qs = next.toString();
  const to = qs === "" ? "/backlog" : `/backlog?${qs}`;
  return <Navigate to={to} replace />;
}
