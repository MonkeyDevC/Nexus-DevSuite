/**
 * ----
 * Modulo: projectApiClient
 * Descripcion: Cliente de dominio Project con validacion de Response Layer v1 y DTO.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
import api from "../../../shared/http/apiClient.js";

const PROJECT_ERROR_MESSAGES = {
  PROJECT_NOT_FOUND: "Elemento no encontrado",
  PROJECT_ARCHIVED: "Proyecto archivado",
  PROJECT_INVALID_TRANSITION: "Transicion de estado invalida",
  PROJECT_HAS_DEPENDENCIES: "Proyecto con dependencias activas",
  PROJECT_NAME_DUPLICATE: "Ya existe un proyecto con ese nombre",
  PROJECT_CONFLICT: "Conflicto de concurrencia en Project",
  TENANT_REQUIRED: "Tenant no resuelto",
  INVALID_IMPORT_FORMAT: "Formato de importación inválido",
  IMPORT_VALIDATION_ERROR: "Error de validación en la importación",
};

function normalizeDescription(value) {
  if (value == null) return "";
  return String(value);
}

/** Criterios de proyecto: siempre array de strings (invariante cliente; null/omitido del API → []). */
function normalizeProjectCriteriaDto(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item == null ? "" : item));
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function normalizeProjectDto(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim();
  if (!isUuid(id)) return null;
  const name = String(raw.name || "").trim();
  if (!name) return null;
  const version = Number(raw.version);
  if (!Number.isInteger(version) || version < 1) return null;
  const cs = raw.current_sprint;
  const currentSprint =
    cs && typeof cs === "object" && cs.id && cs.name != null
      ? { id: String(cs.id), name: String(cs.name) }
      : null;
  const progressRaw = Number(raw.progress_pct);
  const progress_pct = Number.isFinite(progressRaw)
    ? Math.min(100, Math.max(0, Math.round(progressRaw)))
    : 0;
  const teamRaw = Number(raw.team_member_count);
  const normalizedNameRaw = raw.normalized_name != null ? String(raw.normalized_name).trim() : "";
  const createdByRaw = raw.created_by != null ? String(raw.created_by).trim() : "";
  const orgNameRaw = raw.organization_name != null ? String(raw.organization_name).trim() : "";
  return {
    id,
    number: Number(raw.number),
    organization_id: String(raw.organization_id || ""),
    organization_name: orgNameRaw || null,
    normalized_name: normalizedNameRaw || null,
    created_by: createdByRaw || null,
    name,
    description: normalizeDescription(raw.description),
    acceptance_criteria: normalizeProjectCriteriaDto(raw.acceptance_criteria),
    implementation_criteria: normalizeProjectCriteriaDto(raw.implementation_criteria),
    evidence_markdown: normalizeDescription(raw.evidence_markdown),
    status: String(raw.status || "UNKNOWN"),
    version,
    archived_at: raw.archived_at || null,
    created_at: raw.created_at || null,
    updated_at: raw.updated_at || null,
    team_member_count: Number.isFinite(teamRaw) && teamRaw >= 0 ? teamRaw : 0,
    current_sprint: currentSprint,
    progress_pct,
    last_activity_at:
      raw.last_activity_at != null
        ? String(raw.last_activity_at)
        : raw.updated_at != null
          ? String(raw.updated_at)
          : null,
  };
}

function normalizeError(data) {
  const code = data && data.error && data.error.code ? String(data.error.code) : "UNKNOWN_ERROR";
  return {
    code,
    message: PROJECT_ERROR_MESSAGES[code] || "Error cargando datos",
  };
}

function unwrapApiResponse(response) {
  const body = response && response.data;
  if (!body || body.success !== true) {
    const error = normalizeError(body);
    throw error;
  }
  return body.data;
}

export async function listProjects() {
  // IMPORTANTE: el backend por defecto pagina con limit=10. Para evitar "desapariciones" de proyectos
  // en UI (p.ej. al importar/crear más de 10), se trae todo con paginación controlada (max limit=100).
  const limit = 100;
  let page = 1;
  const all = [];
  while (true) {
    const response = await api.get("/projects", { params: { page, limit } });
    const data = unwrapApiResponse(response);
    const raw = Array.isArray(data && data.items) ? data.items : [];
    all.push(...raw.map(normalizeProjectDto).filter(Boolean));
    const totalPages = Math.max(1, Number(data.totalPages) || 1);
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

/**
 * @param {{ page?: number, limit?: number }} opts
 * @returns {Promise<{ items: ReturnType<typeof normalizeProjectDto>[], totalPages: number, page: number }>}
 */
export async function listProjectsPage({ page = 1, limit = 100 } = {}) {
  const response = await api.get("/projects", { params: { page, limit } });
  const data = unwrapApiResponse(response);
  const raw = Array.isArray(data && data.items) ? data.items : [];
  const items = raw.map(normalizeProjectDto).filter(Boolean);
  const totalPages = Math.max(1, Number(data.totalPages) || 1);
  return {
    items,
    totalPages,
    page: Number(data.page) || page,
  };
}

export async function getProjectById(id) {
  const response = await api.get(`/projects/${encodeURIComponent(id)}`);
  const data = unwrapApiResponse(response);
  const project = normalizeProjectDto(data);
  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: PROJECT_ERROR_MESSAGES.PROJECT_NOT_FOUND };
  }
  return project;
}

export async function createProject(payload) {
  const response = await api.post("/projects", {
    name: payload.name,
    description: normalizeDescription(payload.description),
  });
  const data = unwrapApiResponse(response);
  const project = normalizeProjectDto(data);
  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: PROJECT_ERROR_MESSAGES.PROJECT_NOT_FOUND };
  }
  return project;
}

export async function updateProject(id, payload) {
  const body = {
    name: payload.name,
    description: normalizeDescription(payload.description),
    acceptance_criteria: Array.isArray(payload.acceptance_criteria)
      ? payload.acceptance_criteria
      : normalizeProjectCriteriaDto(payload.acceptance_criteria),
    implementation_criteria: Array.isArray(payload.implementation_criteria)
      ? payload.implementation_criteria
      : normalizeProjectCriteriaDto(payload.implementation_criteria),
    expected_version: payload.expected_version,
  };
  if (payload.evidence_markdown !== undefined) {
    body.evidence_markdown = normalizeDescription(payload.evidence_markdown);
  }
  if (payload.status != null) {
    const st = String(payload.status).toUpperCase();
    if (st === "ACTIVE" || st === "ARCHIVED") {
      body.status = st;
    }
  }
  const response = await api.put(`/projects/${encodeURIComponent(id)}`, body);
  const data = unwrapApiResponse(response);
  const project = normalizeProjectDto(data);
  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: PROJECT_ERROR_MESSAGES.PROJECT_NOT_FOUND };
  }
  return project;
}

export async function archiveProject(id, expectedVersion) {
  const response = await api.patch(`/projects/${encodeURIComponent(id)}/archive`, {
    expected_version: expectedVersion,
  });
  const data = unwrapApiResponse(response);
  const project = normalizeProjectDto(data);
  if (!project) {
    throw { code: "PROJECT_NOT_FOUND", message: PROJECT_ERROR_MESSAGES.PROJECT_NOT_FOUND };
  }
  return project;
}

export async function deleteProject(id, expectedVersion) {
  const response = await api.delete(`/projects/${encodeURIComponent(id)}`, {
    data: { expected_version: expectedVersion },
  });
  const data = unwrapApiResponse(response);
  return {
    id: String((data && data.id) || id),
    deleted: Boolean(data && data.deleted),
  };
}

/**
 * @param {string[]} ids
 * @returns {Promise<{ deleted: number, ids: string[] }>}
 */
export async function deleteProjectsBulk(ids) {
  const response = await api.post("/projects/bulk-delete", { ids });
  const data = unwrapApiResponse(response);
  return {
    deleted: Number(data && data.deleted) || 0,
    ids: Array.isArray(data && data.ids) ? data.ids.map(String) : [],
  };
}

/**
 * @param {object} payload — mismo formato que exportación legacy (`exported_at`, `projects`).
 * @returns {Promise<{ projects_created: number, features_created: number, stories_created: number }>}
 */
export async function importProjects(payload) {
  const response = await api.post("/projects/import", payload);
  const data = unwrapApiResponse(response);
  return {
    projects_created: Number(data && data.projects_created) || 0,
    features_created: Number(data && data.features_created) || 0,
    stories_created: Number(data && data.stories_created) || 0,
  };
}
