/**
 * DTO WAVE 2 — subset contractual sprint (API usa PLANNED | IN_PROGRESS | CLOSED).
 */

export function mapSprintDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id) return null;
  const name = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!name) return null;
  return {
    id,
    project_id: raw.project_id != null ? String(raw.project_id).trim() : null,
    name,
    goal: raw.goal != null && String(raw.goal).trim() !== "" ? String(raw.goal).trim() : null,
    start_date: raw.start_date != null && raw.start_date !== "" ? String(raw.start_date).slice(0, 10) : null,
    end_date: raw.end_date != null && raw.end_date !== "" ? String(raw.end_date).slice(0, 10) : null,
    status: raw.status != null ? String(raw.status) : "",
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export function mapSprintListEnvelope(data) {
  if (!data || typeof data !== "object") {
    return { items: [], meta: {} };
  }
  const raw = Array.isArray(data.data) ? data.data : [];
  const items = raw.map(mapSprintDto).filter(Boolean);
  return { items, meta: data.meta && typeof data.meta === "object" ? data.meta : {} };
}

export function mapSprintDeleteResult(data) {
  if (!data || data.id == null) return { id: "" };
  return { id: String(data.id).trim() };
}
