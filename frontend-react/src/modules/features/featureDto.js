/**
 * DTO Wave 1 — subset contractual de consumo (no depende de campos extra del API).
 * project_id: incluido cuando el backend lo envía (validación de contexto de ruta).
 */

export function mapFeatureDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id) return null;
  const progressRaw = Number(raw.progress_pct);
  const acceptance = raw.acceptance_criteria;
  const implementation = raw.implementation_criteria;
  const acceptance_criteria = Array.isArray(acceptance)
    ? acceptance.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const implementation_criteria = Array.isArray(implementation)
    ? implementation.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  const storyCount = raw.user_stories_count != null ? Number(raw.user_stories_count) : null;
  const doneCount = raw.stories_done != null ? Number(raw.stories_done) : null;
  return {
    id,
    number: raw.number != null ? Number(raw.number) : null,
    title: raw.title != null ? String(raw.title) : "",
    description: raw.description != null ? String(raw.description) : "",
    acceptance_criteria,
    implementation_criteria,
    status: raw.status != null ? String(raw.status) : "",
    priority: raw.priority != null ? String(raw.priority) : "",
    evidence_markdown: raw.evidence_markdown != null ? String(raw.evidence_markdown) : "",
    progress_pct: Number.isFinite(progressRaw) ? Math.min(100, Math.max(0, Math.round(progressRaw))) : 0,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    project_id: raw.project_id != null ? String(raw.project_id).trim() : null,
    user_stories_count: Number.isFinite(storyCount) ? storyCount : null,
    stories_done: Number.isFinite(doneCount) ? doneCount : null,
  };
}

export function mapFeatureListEnvelope(data) {
  if (!data || typeof data !== "object") {
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
  const items = Array.isArray(data.items) ? data.items.map(mapFeatureDto).filter(Boolean) : [];
  return {
    items,
    total: data.total != null ? Number(data.total) : 0,
    page: data.page != null ? Number(data.page) : 1,
    limit: data.limit != null ? Number(data.limit) : 10,
    totalPages: data.totalPages != null ? Number(data.totalPages) : 0,
  };
}

export function mapFeatureDeleteResult(data) {
  if (!data || data.id == null) return { id: "" };
  return { id: String(data.id).trim() };
}
