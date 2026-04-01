/**
 * DTO WAVE 3 — Incident (API contract)
 */

export function mapIncidentDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) return null;
  return {
    id,
    project_id: raw.project_id != null ? String(raw.project_id).trim() : null,
    title,
    description: raw.description != null && String(raw.description).trim() !== "" ? String(raw.description).trim() : null,
    severity: raw.severity != null ? String(raw.severity) : "",
    priority: raw.priority != null ? String(raw.priority) : "MEDIUM",
    status: raw.status != null ? String(raw.status) : "",
    story_id:
      raw.story_id != null && String(raw.story_id).trim() !== "" ? String(raw.story_id).trim() : null,
    root_cause_analysis:
      raw.root_cause_analysis != null && String(raw.root_cause_analysis).trim() !== ""
        ? String(raw.root_cause_analysis).trim()
        : null,
    reported_by: raw.reported_by ?? null,
    assigned_to: raw.assigned_to ?? null,
    closed_by: raw.closed_by ?? null,
    closed_at: raw.closed_at ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export function mapIncidentListEnvelope(data) {
  if (!data || typeof data !== "object") {
    return { items: [], meta: {} };
  }
  const raw = Array.isArray(data.data) ? data.data : [];
  const items = raw.map(mapIncidentDto).filter(Boolean);
  return { items, meta: data.meta && typeof data.meta === "object" ? data.meta : {} };
}

export function mapIncidentDeleteResult(data) {
  if (!data || data.id == null) return { id: "" };
  return { id: String(data.id).trim() };
}
