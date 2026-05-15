/**
 * DTO WAVE 2 — subset contractual sprint (API usa PLANNED | IN_PROGRESS | CLOSED).
 */

export function mapSprintDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id) return null;
  const nameRaw = raw.name;
  const name =
    typeof nameRaw === "string"
      ? nameRaw.trim()
      : nameRaw != null && String(nameRaw).trim() !== ""
        ? String(nameRaw).trim()
        : "";
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
  if (data == null) {
    return { items: [], meta: {} };
  }
  /** Soporta `{ data: Sprint[] }`, `{ items: Sprint[] }` o el array suelto (por si el envelope variara). */
  let raw = [];
  let meta = {};
  if (Array.isArray(data)) {
    raw = data;
  } else if (typeof data === "object") {
    if (Array.isArray(data.data)) raw = data.data;
    else if (Array.isArray(data.items)) raw = data.items;
    if (data.meta && typeof data.meta === "object") meta = data.meta;
  }
  const items = raw.map(mapSprintDto).filter(Boolean);
  return { items, meta };
}

export function mapSprintDeleteResult(data) {
  if (!data || data.id == null) return { id: "" };
  return { id: String(data.id).trim() };
}
