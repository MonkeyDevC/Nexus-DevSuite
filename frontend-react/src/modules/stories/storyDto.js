/**
 * DTO Wave 1 — subset contractual de consumo (campos extra del API ignorados).
 */

export function mapStoryDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  const feature_id = raw.feature_id != null ? String(raw.feature_id).trim() : "";
  if (!id || !feature_id) return null;
  return {
    id,
    feature_id,
    number: raw.number != null ? Number(raw.number) : null,
    title: raw.title != null ? String(raw.title) : "",
    description: raw.description != null ? String(raw.description) : "",
    status: raw.status != null ? String(raw.status) : "",
    priority: raw.priority != null ? String(raw.priority) : "",
    acceptance_criteria: raw.acceptance_criteria ?? null,
    implementation_criteria: raw.implementation_criteria ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export function mapStoryListEnvelope(data) {
  if (!data || typeof data !== "object") {
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
  const items = Array.isArray(data.items) ? data.items.map(mapStoryDto).filter(Boolean) : [];
  return {
    items,
    total: data.total != null ? Number(data.total) : 0,
    page: data.page != null ? Number(data.page) : 1,
    limit: data.limit != null ? Number(data.limit) : 10,
    totalPages: data.totalPages != null ? Number(data.totalPages) : 0,
  };
}

export function mapStoryDeleteResult(data) {
  if (!data || data.id == null) return { id: "" };
  return { id: String(data.id).trim() };
}
