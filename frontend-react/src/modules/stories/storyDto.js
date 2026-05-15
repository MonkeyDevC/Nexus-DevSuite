/**
 * DTO Wave 1 — subset contractual de consumo (campos extra del API ignorados).
 */

export function mapStoryDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  const feature_id = raw.feature_id != null ? String(raw.feature_id).trim() : "";
  if (!id || !feature_id) return null;
  const project_id = raw.project_id != null ? String(raw.project_id).trim() : "";
  const assigned_to =
    raw.assigned_to != null && String(raw.assigned_to).trim() !== ""
      ? String(raw.assigned_to).trim()
      : null;
  const sp = raw.story_points;
  const story_points =
    sp != null && sp !== "" && !Number.isNaN(Number(sp)) ? Number(sp) : null;
  let assignee = null;
  if (raw.assignee && typeof raw.assignee === "object") {
    const aid = raw.assignee.id != null ? String(raw.assignee.id).trim() : "";
    if (aid) {
      assignee = {
        id: aid,
        name: raw.assignee.name != null ? String(raw.assignee.name) : "",
        email: raw.assignee.email != null ? String(raw.assignee.email) : "",
      };
    }
  }
  const sprint = raw.sprint && typeof raw.sprint === "object" ? raw.sprint : null;
  const nameFromSprint = sprint?.name != null ? String(sprint.name).trim() : "";
  const nameFlat = raw.sprint_name != null ? String(raw.sprint_name).trim() : "";
  const sprintNameCombined = nameFromSprint || nameFlat;
  const sprintIdNorm =
    raw.sprint_id != null && String(raw.sprint_id).trim() !== "" ? String(raw.sprint_id).trim() : null;
  return {
    id,
    feature_id,
    project_id,
    number: raw.number != null ? Number(raw.number) : null,
    title: raw.title != null ? String(raw.title) : "",
    description: raw.description != null ? String(raw.description) : "",
    status: raw.status != null ? String(raw.status) : "",
    refinement_status: raw.refinement_status != null ? String(raw.refinement_status) : "DRAFT",
    item_type: raw.item_type != null ? String(raw.item_type) : "STORY",
    sprint_id: sprintIdNorm,
    sprint_name: sprintNameCombined || null,
    priority: raw.priority != null ? String(raw.priority) : "",
    acceptance_criteria: raw.acceptance_criteria ?? null,
    implementation_criteria: raw.implementation_criteria ?? null,
    evidence_markdown: raw.evidence_markdown != null ? String(raw.evidence_markdown) : "",
    assigned_to,
    story_points,
    assignee,
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
