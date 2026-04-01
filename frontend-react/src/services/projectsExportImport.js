/**
 * Exportación / importación de proyectos en JSON (paridad con la superficie legacy de proyectos ya retirada).
 */
import api from "./apiClient.js";
import { importProjects, listProjectsPage } from "./projectApiClient.js";
import { buildExportFilename } from "../utils/exportFilename.js";

function unwrapListResponse(res) {
  const body = res && res.data;
  if (!body || body.success !== true) {
    const code = body?.error?.code || "UNKNOWN_ERROR";
    throw { code, message: body?.error?.message || "Error cargando datos" };
  }
  return body.data;
}

function criteriaLines(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.items)) return value.items;
  return [];
}

function normalizeNonEmptyText(value) {
  if (value == null) return "";
  const s = String(value).trim();
  return s;
}

function pickTitleLike(raw, fallbackKeys = []) {
  const direct = normalizeNonEmptyText(raw?.title);
  if (direct) return direct;
  for (const key of fallbackKeys) {
    const v = normalizeNonEmptyText(raw?.[key]);
    if (v) return v;
  }
  return "";
}

async function fetchAllProjectFeatures(projectId) {
  const all = [];
  const seenPages = new Set();
  let page = 1;
  let totalPages = 1;
  let safety = 0;
  while (page <= totalPages) {
    safety += 1;
    if (safety > 500) break;
    if (seenPages.has(page)) break;
    seenPages.add(page);

    const res = await api.get(`/projects/${encodeURIComponent(projectId)}/features`, {
      params: { page, limit: 100 },
    });
    const data = unwrapListResponse(res);
    const items = Array.isArray(data.items) ? data.items : [];
    all.push(...items);

    const nextTotal = Number(data.totalPages);
    totalPages = Number.isFinite(nextTotal) && nextTotal > 0 ? Math.floor(nextTotal) : 1;

    if (items.length === 0) break;
    page += 1;
  }
  return all;
}

async function fetchAllFeatureStories(featureId) {
  const all = [];
  const seenPages = new Set();
  let page = 1;
  let totalPages = 1;
  let safety = 0;
  while (page <= totalPages) {
    safety += 1;
    if (safety > 1000) break;
    if (seenPages.has(page)) break;
    seenPages.add(page);

    const res = await api.get(`/features/${encodeURIComponent(featureId)}/stories`, {
      params: { page, limit: 100 },
    });
    const data = unwrapListResponse(res);
    const items = Array.isArray(data.items) ? data.items : [];
    all.push(...items);

    const nextTotal = Number(data.totalPages);
    totalPages = Number.isFinite(nextTotal) && nextTotal > 0 ? Math.floor(nextTotal) : 1;

    if (items.length === 0) break;
    page += 1;
  }
  return all;
}

async function buildFeatureExportNode(feature) {
  const stories = await fetchAllFeatureStories(feature.id);
  const title = pickTitleLike(feature, ["name", "displayTitle"]);
  if (!title) return null;
  return {
    title,
    description: feature.description != null ? String(feature.description) : "",
    priority: feature.priority || "MEDIUM",
    status: feature.status || "DRAFT",
    acceptance_criteria: criteriaLines(feature.acceptance_criteria),
    implementation_criteria: criteriaLines(feature.implementation_criteria),
    stories: stories
      .map((s) => {
        const storyTitle = pickTitleLike(s, ["name", "displayTitle"]);
        if (!storyTitle) return null;
        return {
          title: storyTitle,
          description: s.description != null ? String(s.description) : "",
          status: s.status || "DRAFT",
          priority: s.priority || "MEDIUM",
          assigned_to: s.assigned_to || null,
          sprint_id: s.sprint_id || null,
          acceptance_criteria: criteriaLines(s.acceptance_criteria),
          implementation_criteria: criteriaLines(s.implementation_criteria),
        };
      })
      .filter(Boolean),
  };
}

async function buildProjectExportNode(project) {
  const features = await fetchAllProjectFeatures(project.id);
  const featureNodes = [];
  for (const f of features) {
    const node = await buildFeatureExportNode(f);
    if (node) featureNodes.push(node);
  }
  return {
    project: {
      id: project.id,
      name: project.name || "",
      description: project.description || "",
      status: project.status || "ACTIVE",
      acceptance_criteria: criteriaLines(project.acceptance_criteria),
      implementation_criteria: criteriaLines(project.implementation_criteria),
      evidence_markdown: typeof project.evidence_markdown === "string" ? project.evidence_markdown : "",
    },
    features: featureNodes,
  };
}

/**
 * Exporta un subconjunto de proyectos (por ejemplo, seleccionados en tabla).
 * @param {object[]} projects
 * @returns {Promise<{ exported_at: string, projects: object[] }>}
 */
export async function buildProjectsExportSnapshotForProjects(projects = []) {
  const rows = Array.isArray(projects) ? projects : [];
  const nodes = [];
  for (const p of rows) {
    if (!p || !p.id) continue;
    nodes.push(await buildProjectExportNode(p));
  }
  return {
    exported_at: new Date().toISOString(),
    projects: nodes,
  };
}

/**
 * @returns {Promise<{ exported_at: string, projects: object[] }>}
 */
export async function buildProjectsExportSnapshot() {
  const projects = [];
  let page = 1;
  let totalPages = 1;
  do {
    const chunk = await listProjectsPage({ page, limit: 100 });
    projects.push(...chunk.items);
    totalPages = chunk.totalPages;
    page += 1;
  } while (page <= totalPages);

  const nodes = [];
  for (const p of projects) {
    nodes.push(await buildProjectExportNode(p));
  }
  return {
    exported_at: new Date().toISOString(),
    projects: nodes,
  };
}

export function downloadProjectsJson(snapshot, opts = {}) {
  const { filenameBase } = opts || {};
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildExportFilename(filenameBase || "Proyectos");
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {File} file
 * @returns {Promise<{ projects_created: number, features_created: number, stories_created: number }>}
 */
export async function importProjectsFromJsonFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw { code: "INVALID_IMPORT_FORMAT", message: "El archivo no es un JSON válido." };
  }

  function normalizeString(value) {
    if (value == null) return "";
    return String(value).trim();
  }

  function normalizeCriteria(value) {
    if (Array.isArray(value)) return value.map((x) => String(x ?? ""));
    if (value && typeof value === "object" && Array.isArray(value.items)) return value.items.map((x) => String(x ?? ""));
    return [];
  }

  function normalizeStatusToken(value) {
    if (value == null) return "";
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_")
      .replace(/[.]+/g, "_")
      .replace(/__+/g, "_");
  }

  function normalizeFeatureStatus(value) {
    const normalized = normalizeStatusToken(value);
    const aliases = {
      ACTIVE: "IN_PROGRESS",
      IN_REVIEW: "IN_PROGRESS",
      INREVIEW: "IN_PROGRESS",
      READY: "APPROVED",
      PENDING: "DRAFT",
      TO_DO: "DRAFT",
      TODO: "DRAFT",
      DOING: "IN_PROGRESS",
      PROGRESS: "IN_PROGRESS",
      COMPLETE: "DONE",
      COMPLETED: "DONE",
    };
    return aliases[normalized] || normalized || "DRAFT";
  }

  function normalizeStoryStatus(value) {
    const normalized = normalizeStatusToken(value);
    const aliases = {
      ACTIVE: "IN_PROGRESS",
      IN_REVIEW: "IN_REVIEW",
      INREVIEW: "IN_REVIEW",
      IN_REVISION: "IN_REVIEW",
      EN_REVISION: "IN_REVIEW",
      REVIEW: "IN_REVIEW",
      REVISION: "IN_REVIEW",
      READY: "READY",
      PENDIENTE: "DRAFT",
      PENDING: "DRAFT",
      TO_DO: "DRAFT",
      TODO: "DRAFT",
      DOING: "IN_PROGRESS",
      PROGRESS: "IN_PROGRESS",
      EN_PROGRESO: "IN_PROGRESS",
      BLOCKED: "BLOCKED",
      BLOQUEADO: "BLOCKED",
      DONE: "DONE",
      COMPLETE: "DONE",
      COMPLETED: "DONE",
      TERMINADO: "DONE",
      FINALIZADO: "DONE",
      ARCHIVED: "ARCHIVED",
      ARCHIVADO: "ARCHIVED",
    };
    return aliases[normalized] || normalized || "DRAFT";
  }

  function mapStoryLike(raw) {
    const title = normalizeString(raw?.title || raw?.name || raw?.displayTitle);
    if (!title) return null;
    return {
      title,
      description: raw?.description != null ? String(raw.description) : "",
      status: normalizeStoryStatus(raw?.status || "DRAFT"),
      priority: raw?.priority || "MEDIUM",
      assigned_to: raw?.assigned_to != null ? raw.assigned_to : null,
      sprint_id: raw?.sprint_id != null ? raw.sprint_id : null,
      acceptance_criteria: normalizeCriteria(raw?.acceptance_criteria),
      implementation_criteria: normalizeCriteria(raw?.implementation_criteria),
    };
  }

  /**
   * Soporta dos formatos:
   * 1) Backend canonical: { features: [{ title, stories: [...] }] }
   * 2) Archivo tipo “plan”: { features: [{ feature: { title }, user_stories: [...] }] }
   */
  function normalizeProjectNode(node) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return null;
    const project = node.project;
    if (!project || typeof project !== "object" || Array.isArray(project)) return null;

    const normalizedNode = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description != null ? String(project.description) : "",
        status: project.status || "ACTIVE",
        acceptance_criteria: normalizeCriteria(project.acceptance_criteria),
        implementation_criteria: normalizeCriteria(project.implementation_criteria),
        evidence_markdown: typeof project.evidence_markdown === "string" ? project.evidence_markdown : "",
      },
      features: [],
    };

    const featuresRaw = Array.isArray(node.features) ? node.features : [];
    for (const f of featuresRaw) {
      if (!f || typeof f !== "object" || Array.isArray(f)) continue;

      // Formato canonical (backend)
      if (f.title != null) {
        const title = normalizeString(f.title || f.name || f.displayTitle);
        if (!title) continue;
        const storiesRaw = Array.isArray(f.stories) ? f.stories : [];
        const stories = storiesRaw.map(mapStoryLike).filter(Boolean);
        normalizedNode.features.push({
          title,
          description: f.description != null ? String(f.description) : "",
          status: normalizeFeatureStatus(f.status || "DRAFT"),
          priority: f.priority || "MEDIUM",
          acceptance_criteria: normalizeCriteria(f.acceptance_criteria),
          implementation_criteria: normalizeCriteria(f.implementation_criteria),
          stories,
        });
        continue;
      }

      // Formato “plan”: { feature: {...}, user_stories: [...] }
      const feat = f.feature && typeof f.feature === "object" && !Array.isArray(f.feature) ? f.feature : null;
      const title = normalizeString(feat?.title || feat?.name || feat?.displayTitle);
      if (!title) continue;
      const storiesRaw = Array.isArray(f.user_stories) ? f.user_stories : [];
      const stories = storiesRaw.map(mapStoryLike).filter(Boolean);
      normalizedNode.features.push({
        title,
        description: feat?.description != null ? String(feat.description) : "",
        status: normalizeFeatureStatus(feat?.status || "DRAFT"),
        priority: feat?.priority || "MEDIUM",
        acceptance_criteria: normalizeCriteria(feat?.acceptance_criteria),
        implementation_criteria: normalizeCriteria(feat?.implementation_criteria),
        stories,
      });
    }

    return normalizedNode;
  }

  function normalizeImportPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw { code: "INVALID_IMPORT_FORMAT", message: "Formato inválido: se esperaba un objeto raíz." };
    }
    const exported_at = payload.exported_at || new Date().toISOString();
    const projectsRaw = Array.isArray(payload.projects) ? payload.projects : [];
    const projects = projectsRaw.map(normalizeProjectNode).filter(Boolean);
    return { exported_at, projects };
  }

  const normalized = normalizeImportPayload(parsed);
  return importProjects(normalized);
}
