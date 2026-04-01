/**
 * Normaliza DTO release desde Response Layer v1.
 */

function safeString(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function mapReleaseDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id) return null;
  const version = safeString(raw.version);
  if (!version) return null;
  const name = safeString(raw.name) || version;
  const status = safeString(raw.status) || "UNKNOWN";
  return {
    id,
    name,
    version,
    status,
    description: raw.description != null ? String(raw.description) : null,
    released_at: raw.released_at != null ? String(raw.released_at) : null,
    release_date: raw.release_date != null ? String(raw.release_date) : raw.released_at != null ? String(raw.released_at) : null,
    created_at: raw.created_at != null ? String(raw.created_at) : null,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : null,
    features: Array.isArray(raw.features) ? raw.features : [],
    stories: Array.isArray(raw.stories) ? raw.stories : [],
  };
}

export function mapReleaseListEnvelope(data) {
  if (!data || typeof data !== "object") {
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.map(mapReleaseDto).filter(Boolean);
  return {
    items,
    total: Number(data.total) || items.length,
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 10,
    totalPages: Number(data.totalPages) || 0,
  };
}
