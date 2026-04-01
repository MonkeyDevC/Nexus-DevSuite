/**
 * Mapeos de estado de dominio → variantes Badge del design system (Wave 1).
 */

export function mapProjectStatusToDsBadgeVariant(status) {
  if (status === "ACTIVE") return "success";
  if (status === "BLOCKED") return "danger";
  return "neutral";
}

export function mapStoryStatusToDsBadgeVariant(status) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  if (status === "BLOCKED") return "danger";
  return "neutral";
}

export function mapFeatureStatusToDsBadgeVariant(status) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS" || status === "APPROVED") return "warning";
  return "neutral";
}

/** Estados derivados en UI (mapSprintStatusForUi): ACTIVE | COMPLETED | INACTIVE */
export function mapSprintUiStatusToDsBadgeVariant(uiStatus) {
  const s = uiStatus != null ? String(uiStatus).trim() : "";
  if (s === "ACTIVE") return "success";
  if (s === "COMPLETED") return "neutral";
  return "warning";
}

/** Estados API de sprint: PLANNED | IN_PROGRESS | CLOSED */
export function mapSprintApiStatusToDsBadgeVariant(apiStatus) {
  const s = apiStatus != null ? String(apiStatus).trim() : "";
  if (s === "IN_PROGRESS") return "success";
  if (s === "CLOSED") return "neutral";
  if (s === "PLANNED") return "warning";
  return "neutral";
}

export function mapIncidentStatusToDsBadgeVariant(status) {
  const s = status != null ? String(status).trim() : "";
  if (s === "CLOSED" || s === "RESOLVED") return "success";
  if (s === "IN_PROGRESS") return "warning";
  if (s === "OPEN") return "neutral";
  return "neutral";
}

export function mapIncidentSeverityToDsBadgeVariant(sev) {
  const s = String(sev || "").trim();
  if (s === "CRITICAL") return "danger";
  if (s === "HIGH") return "warning";
  return "neutral";
}

export function mapIncidentPriorityToDsBadgeVariant(pri) {
  const p = String(pri || "").trim();
  if (p === "HIGH") return "danger";
  if (p === "MEDIUM") return "warning";
  return "neutral";
}

/** Estados de release: PLANNED | IN_PROGRESS | QA | RELEASED | ROLLED_BACK | ARCHIVED */
export function mapReleaseStatusToDsBadgeVariant(status) {
  const s = status != null ? String(status).trim() : "";
  if (s === "RELEASED") return "success";
  if (s === "QA" || s === "IN_PROGRESS") return "warning";
  if (s === "ROLLED_BACK") return "danger";
  return "neutral";
}
