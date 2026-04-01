/**
 * Módulo Backlog - Service Projects
 * Reglas de negocio: duplicados, archivado, acceso a datos vía repository.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const projectsRepository = require("./projects.repository");
const featureRepository = require("./feature.repository");
const userStoryRepository = require("./userStory.repository");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const PROJECT_IMPORT_STATUSES = ["ACTIVE", "ARCHIVED"];
const FEATURE_IMPORT_STATUSES = ["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"];
const STORY_IMPORT_STATUSES = ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"];
const IMPORT_ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function normalizeStatusToken(value) {
  if (value == null) return "";
  // Normaliza variantes como: "in progress", "IN-PROGRESS", "In.Progress" => "IN_PROGRESS"
  return String(value)
    .normalize("NFD")
    // Elimina diacríticos (tildes) para que "revisión" == "revision"
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[.]+/g, "_")
    .replace(/__+/g, "_");
}

function normalizeFeatureStatus(status) {
  const normalized = normalizeStatusToken(status);
  const aliases = {
    // Posibles estados legacy exportados (sin romper el enum real de Feature).
    IN_REVIEW: "IN_PROGRESS",
    INREVIEW: "IN_PROGRESS",
    READY: "APPROVED",
    PENDING: "DRAFT",
    TO_DO: "DRAFT",
    TODO: "DRAFT",
    DOING: "IN_PROGRESS",
    PROGRESS: "IN_PROGRESS",
    COMPLETE: "DONE",
    COMPLETED: "DONE"
  };
  return aliases[normalized] || normalized;
}

function normalizeStoryStatus(status) {
  const normalized = normalizeStatusToken(status);
  const aliases = {
    // English-ish legacy
    IN_REVIEW: "IN_REVIEW",
    INREVIEW: "IN_REVIEW",
    IN_REVISION: "IN_REVIEW",
    INREVISION: "IN_REVIEW",
    EN_REVISION: "IN_REVIEW",
    ENREVISION: "IN_REVIEW",
    REVIEW: "IN_REVIEW",
    REVISION: "IN_REVIEW",

    READY: "READY",
    PENDIENTE: "DRAFT",
    PENDING: "DRAFT",
    POR_HACER: "DRAFT",
    PORHACER: "DRAFT",
    TO_DO: "DRAFT",
    TODO: "DRAFT",
    TODOITEM: "DRAFT",

    IN_PROGRESS: "IN_PROGRESS",
    INPROGRESS: "IN_PROGRESS",
    EN_PROGRESO: "IN_PROGRESS",
    ENPROGRESO: "IN_PROGRESS",
    DOING: "IN_PROGRESS",
    PROGRESS: "IN_PROGRESS",

    BLOCKED: "BLOCKED",
    BLOCK: "BLOCKED",
    BLOQUEADO: "BLOCKED",
    BLOQUEADA: "BLOCKED",

    DONE: "DONE",
    COMPLETED: "DONE",
    COMPLETE: "DONE",
    TERMINADO: "DONE",
    FINALIZADO: "DONE",

    ARCHIVED: "ARCHIVED",
    ARCHIVE: "ARCHIVED",
    ARCHIVADO: "ARCHIVED",
    ARCHIVADA: "ARCHIVED"
  };
  return aliases[normalized] || normalized;
}

function normalizeProjectName(value) {
  const normalized = String(value == null ? "" : value).trim().replace(/\s+/g, " ");
  return normalized;
}

function normalizeDescription(value) {
  if (value == null) return "";
  return String(value);
}

const MAX_PROJECT_CRITERIA_ITEMS = 50;
const MAX_PROJECT_CRITERIA_ITEM_LEN = 2000;
const MAX_PROJECT_EVIDENCE_MARKDOWN_LEN = 120000;

function normalizeProjectCriteriaFromDb(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((x) => (x == null ? "" : String(x))).map((s) => s.slice(0, MAX_PROJECT_CRITERIA_ITEM_LEN));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeProjectCriteriaFromDb(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeProjectCriteriaForUpdate(value) {
  if (!Array.isArray(value)) {
    throw new AppError("criterios debe ser un arreglo", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const out = [];
  for (const item of value.slice(0, MAX_PROJECT_CRITERIA_ITEMS)) {
    const s = String(item == null ? "" : item).trim().slice(0, MAX_PROJECT_CRITERIA_ITEM_LEN);
    if (s.length > 0) out.push(s);
  }
  return out;
}

function normalizeEvidenceMarkdownForUpdate(value) {
  const s = value == null ? "" : String(value);
  return s.slice(0, MAX_PROJECT_EVIDENCE_MARKDOWN_LEN);
}

function toPlain(project) {
  if (!project) return null;
  const p = typeof project.toJSON === "function" ? project.toJSON() : project;
  const org = p.organization;
  const organization_name =
    org && typeof org === "object" && org.name != null && String(org.name).trim()
      ? String(org.name).trim()
      : null;
  return {
    id: p.id,
    number: p.number,
    name: p.name,
    normalized_name: p.normalized_name == null ? "" : String(p.normalized_name),
    description: p.description == null ? "" : String(p.description),
    acceptance_criteria: normalizeProjectCriteriaFromDb(p.acceptance_criteria),
    implementation_criteria: normalizeProjectCriteriaFromDb(p.implementation_criteria),
    evidence_markdown: p.evidence_markdown == null ? "" : String(p.evidence_markdown),
    status: p.status,
    organization_id: p.organization_id,
    organization_name,
    created_by: p.created_by,
    archived_at: p.archived_at,
    version: p.version,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

function toNormalizedName(value) {
  return normalizeProjectName(value).toLowerCase();
}

function assertTenant(context) {
  const organizationId = context && context.organizationId;
  if (!organizationId) {
    throw new AppError("Tenant no resuelto", {
      statusCode: 400,
      code: ERROR_CODES.TENANT_REQUIRED
    });
  }
  return organizationId;
}

function assertExpectedVersion(expectedVersion) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new AppError("expected_version invalido", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
}

function assertVersionMatch(expectedVersion, currentVersion) {
  if (Number(expectedVersion) !== Number(currentVersion)) {
    throw new AppError("Conflicto de concurrencia en Project", {
      statusCode: 409,
      code: ERROR_CODES.PROJECT_CONFLICT
    });
  }
}

function assertProjectVisible(project, organizationId) {
  if (!project || String(project.organization_id) !== String(organizationId)) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
}

async function createProjectAuditEvent(context, operation, projectId, organizationId) {
  if (!context || !context.user || !context.user.id) return;
  await authRepository.createAuditLog({
    user_id: context.user.id,
    action: operation.toUpperCase(),
    entity: "PROJECT",
    entity_id: projectId,
    request_id: context.requestId || null,
    metadata: {
      project_id: projectId,
      organization_id: organizationId,
      user_id: context.user.id,
      operation,
      timestamp: new Date().toISOString()
    },
    ip_address: context.ip || null,
    user_agent: context.userAgent || null
  });
}

function isUuid(value) {
  if (value == null) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function throwImportError(message, path, code = ERROR_CODES.IMPORT_VALIDATION_ERROR, detailsExtra = {}) {
  throw new AppError(message, {
    statusCode: 400,
    code,
    details: { path, ...detailsExtra }
  });
}

function validateImportPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throwImportError("Formato inválido: se esperaba un objeto raíz.", "payload", ERROR_CODES.INVALID_IMPORT_FORMAT);
  }
  if (!payload.exported_at) {
    throwImportError("Falta `exported_at` en el JSON de importación.", "exported_at", ERROR_CODES.INVALID_IMPORT_FORMAT);
  }
  if (!Array.isArray(payload.projects)) {
    throwImportError("Falta `projects` o no es un array.", "projects", ERROR_CODES.INVALID_IMPORT_FORMAT);
  }

  payload.projects.forEach((node, pIdx) => {
    const basePath = `projects[${pIdx}]`;
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      throwImportError("Cada elemento de `projects` debe ser un objeto.", basePath);
    }
    const project = node.project;
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      throwImportError("Cada entrada debe contener `project`.", `${basePath}.project`);
    }
    if (!project.id) throwImportError("`project.id` es obligatorio.", `${basePath}.project.id`);
    if (!project.name || !String(project.name).trim()) throwImportError("`project.name` es obligatorio.", `${basePath}.project.name`);
    const normalizedProjectStatus = normalizeStatusToken(project.status);
    if (!normalizedProjectStatus || !PROJECT_IMPORT_STATUSES.includes(normalizedProjectStatus)) {
      throwImportError("`project.status` inválido.", `${basePath}.project.status`);
    }
    if (project.acceptance_criteria != null && !Array.isArray(project.acceptance_criteria)) {
      throwImportError("`acceptance_criteria` debe ser un array.", `${basePath}.project.acceptance_criteria`);
    }
    if (project.implementation_criteria != null && !Array.isArray(project.implementation_criteria)) {
      throwImportError("`implementation_criteria` debe ser un array.", `${basePath}.project.implementation_criteria`);
    }

    if (node.features != null && !Array.isArray(node.features)) {
      throwImportError("`features` debe ser un array.", `${basePath}.features`);
    }
    (node.features || []).forEach((feature, fIdx) => {
      const featPath = `${basePath}.features[${fIdx}]`;
      if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
        throwImportError("Cada feature debe ser un objeto.", featPath);
      }
      if (!feature.title || !String(feature.title).trim()) throwImportError("`title` es obligatorio.", `${featPath}.title`);
      const normalizedFeatureStatusValue = normalizeFeatureStatus(feature.status);
      if (!normalizedFeatureStatusValue || !FEATURE_IMPORT_STATUSES.includes(normalizedFeatureStatusValue)) {
        throwImportError("`status` de feature inválido.", `${featPath}.status`, undefined, { received: feature.status });
      }
      if (!feature.priority || !IMPORT_ALLOWED_PRIORITIES.includes(String(feature.priority).toUpperCase())) {
        throwImportError("`priority` de feature inválido. Permitido: LOW, MEDIUM, HIGH, CRITICAL.", `${featPath}.priority`);
      }
      if (feature.stories != null && !Array.isArray(feature.stories)) {
        throwImportError("`stories` debe ser un array.", `${featPath}.stories`);
      }
      (feature.stories || []).forEach((story, sIdx) => {
        const storyPath = `${featPath}.stories[${sIdx}]`;
        if (!story || typeof story !== "object" || Array.isArray(story)) {
          throwImportError("Cada story debe ser un objeto.", storyPath);
        }
        if (!story.title || !String(story.title).trim()) throwImportError("`title` es obligatorio.", `${storyPath}.title`);
        const normalizedStoryStatusValue = normalizeStoryStatus(story.status);
        if (!normalizedStoryStatusValue || !STORY_IMPORT_STATUSES.includes(normalizedStoryStatusValue)) {
          throwImportError("`status` de story inválido.", `${storyPath}.status`, undefined, { received: story.status });
        }
        if (!story.priority || !IMPORT_ALLOWED_PRIORITIES.includes(String(story.priority).toUpperCase())) {
          throwImportError("`priority` de story inválido. Permitido: LOW, MEDIUM, HIGH, CRITICAL.", `${storyPath}.priority`);
        }
        if (story.acceptance_criteria != null && !Array.isArray(story.acceptance_criteria)) {
          throwImportError("`acceptance_criteria` debe ser un array.", `${storyPath}.acceptance_criteria`);
        }
        if (story.implementation_criteria != null && !Array.isArray(story.implementation_criteria)) {
          throwImportError("`implementation_criteria` debe ser un array.", `${storyPath}.implementation_criteria`);
        }
        if (story.assigned_to != null && !isUuid(story.assigned_to)) {
          throwImportError("`assigned_to` debe ser UUID válido o null.", `${storyPath}.assigned_to`);
        }
        if (story.sprint_id != null && !isUuid(story.sprint_id)) {
          throwImportError("`sprint_id` debe ser UUID válido o null.", `${storyPath}.sprint_id`);
        }
      });
    });
  });
}

async function createProject(payload, context) {
  const organizationId = assertTenant(context);
  const normalizedName = normalizeProjectName(payload && payload.name);
  if (!normalizedName) {
    throw new AppError("name es obligatorio", {
      statusCode: 400,
      code: ERROR_CODES.PROJECT_NAME_REQUIRED
    });
  }
  const normalizedNameToken = toNormalizedName(normalizedName);
  const existing = await projectsRepository.findByNameAndOrganization(normalizedNameToken, organizationId);
  if (existing) {
    throw new AppError("Ya existe un proyecto con ese nombre", {
      statusCode: 409,
      code: ERROR_CODES.PROJECT_NAME_DUPLICATE
    });
  }
  const { Project } = getModels();
  const sequelize = Project.sequelize;
  const created = await sequelize.transaction(async (t) => {
    const nextNumber = await projectsRepository.getNextProjectNumberForOrganization(organizationId, t);
    const entity = await projectsRepository.create(
      {
        name: normalizedName,
        normalized_name: normalizedNameToken,
        description: normalizeDescription(payload && payload.description),
        status: "ACTIVE",
        organization_id: organizationId,
        created_by: context.user && context.user.id,
        number: nextNumber,
        version: 1
      },
      { transaction: t }
    );
    return entity;
  });
  await createProjectAuditEvent(context, "create", created.id, organizationId);
  return toPlain(created);
}

async function getProjectById(id, organizationId) {
  const { Organization } = getModels();
  const project = await projectsRepository.findById(id, {
    include: [{ model: Organization, as: "organization", attributes: ["name"] }]
  });
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null) {
    assertProjectVisible(project, organizationId);
  }
  return toPlain(project);
}

function computeListProgressPct(featActive, featDone, stActive, stDone) {
  const parts = [];
  if (featActive > 0) parts.push(featDone / featActive);
  if (stActive > 0) parts.push(stDone / stActive);
  if (parts.length === 0) return 0;
  const ratio = parts.reduce((a, b) => a + b, 0) / parts.length;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

function maxIsoFromDates(values) {
  const times = values
    .filter((v) => v != null && v !== "")
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString();
}

function toListPlainWithMetrics(projectRow, agg) {
  const plain = toPlain(projectRow);
  const a = agg || {};
  const progress_pct = computeListProgressPct(
    a.feat_active || 0,
    a.feat_done || 0,
    a.st_active || 0,
    a.st_done || 0
  );
  const last_activity_at = maxIsoFromDates([
    plain.updated_at,
    a.feat_max_u,
    a.st_max_u,
    a.sprint_max_u
  ]);
  return {
    ...plain,
    team_member_count: a.team_count != null ? Number(a.team_count) : 0,
    current_sprint:
      a.current_sprint_id && a.current_sprint_name != null
        ? { id: String(a.current_sprint_id), name: String(a.current_sprint_name) }
        : null,
    progress_pct,
    last_activity_at: last_activity_at || (plain.updated_at != null ? new Date(plain.updated_at).toISOString() : null)
  };
}

async function listProjects(params) {
  const page = params && params.page ? params.page : 1;
  const limit = params && params.limit ? params.limit : 10;
  const status = params && params.status;
  const organizationId = params && params.organizationId;
  const { items, total } = await projectsRepository.list({ page, limit, status, organizationId });
  const ids = items.map((p) => p.id);
  const aggregates = await projectsRepository.getListAggregates(ids);
  const data = items.map((p) => toListPlainWithMetrics(p, aggregates.get(String(p.id))));
  return {
    data,
    meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
}

async function archiveProject(id, organizationId, expectedVersion) {
  return archiveProjectWithContext(id, { organizationId, expectedVersion });
}

async function updateProject(id, payload, organizationId) {
  return updateProjectWithContext(id, payload, { organizationId });
}

async function deleteProject(id, organizationId, expectedVersion) {
  return deleteProjectWithContext(id, { organizationId, expectedVersion });
}

async function updateProjectWithContext(id, payload, context) {
  const organizationId = assertTenant(context);
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  assertProjectVisible(project, organizationId);

  if (project.status === "ARCHIVED") {
    throw new AppError("Proyecto archivado", {
      statusCode: 409,
      code: ERROR_CODES.PROJECT_ARCHIVED
    });
  }

  const expectedVersion = payload ? payload.expected_version : undefined;
  assertExpectedVersion(expectedVersion);
  assertVersionMatch(expectedVersion, project.version);

  const updates = {};
  if (payload && payload.name !== undefined) {
    const normalizedName = normalizeProjectName(payload.name);
    if (!normalizedName) {
      throw new AppError("name es obligatorio", {
        statusCode: 400,
        code: ERROR_CODES.PROJECT_NAME_REQUIRED
      });
    }
    updates.name = normalizedName;
    updates.normalized_name = toNormalizedName(normalizedName);
  }
  if (payload && payload.description !== undefined) {
    updates.description = normalizeDescription(payload.description);
  }
  if (payload && payload.status !== undefined) {
    const st = String(payload.status).toUpperCase();
    if (st !== "ACTIVE" && st !== "ARCHIVED") {
      throw new AppError("status invalido", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    if (project.status === "ACTIVE" && st === "ARCHIVED") {
      updates.status = "ARCHIVED";
      updates.archived_at = new Date();
    } else if (project.status === "ACTIVE" && st === "ACTIVE") {
      /* sin cambio de estado */
    } else if (String(project.status) !== st) {
      throw new AppError("Transicion de estado invalida", {
        statusCode: 409,
        code: ERROR_CODES.PROJECT_INVALID_TRANSITION
      });
    }
  }
  if (payload && payload.acceptance_criteria !== undefined) {
    updates.acceptance_criteria = normalizeProjectCriteriaForUpdate(payload.acceptance_criteria);
  }
  if (payload && payload.implementation_criteria !== undefined) {
    updates.implementation_criteria = normalizeProjectCriteriaForUpdate(payload.implementation_criteria);
  }
  if (payload && payload.evidence_markdown !== undefined) {
    updates.evidence_markdown = normalizeEvidenceMarkdownForUpdate(payload.evidence_markdown);
  }

  if (updates.normalized_name && updates.normalized_name !== project.normalized_name) {
    const existing = await projectsRepository.findByNameAndOrganization(updates.normalized_name, project.organization_id);
    if (existing && String(existing.id) !== String(project.id)) {
      throw new AppError("Ya existe un proyecto con ese nombre", {
        statusCode: 409,
        code: ERROR_CODES.PROJECT_NAME_DUPLICATE
      });
    }
  }

  if (Object.keys(updates).length === 0) {
    return toPlain(project);
  }

  updates.version = Number(project.version) + 1;
  const updated = await projectsRepository.update(id, updates);
  await createProjectAuditEvent(context, "update", id, organizationId);
  return toPlain(updated);
}

async function archiveProjectWithContext(id, context) {
  const organizationId = assertTenant(context);
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  assertProjectVisible(project, organizationId);

  if (project.status !== "ACTIVE") {
    throw new AppError("Transicion de estado invalida", {
      statusCode: 409,
      code: ERROR_CODES.PROJECT_INVALID_TRANSITION
    });
  }

  const expectedVersion = context && context.expectedVersion;
  assertExpectedVersion(expectedVersion);
  assertVersionMatch(expectedVersion, project.version);

  const updated = await projectsRepository.update(id, {
    status: "ARCHIVED",
    archived_at: new Date(),
    version: Number(project.version) + 1
  });
  await createProjectAuditEvent(context, "archive", id, organizationId);
  return toPlain(updated);
}

/**
 * Elimina en cascada datos ligados a los projectIds (features, historias, sprints, incidents, documents, proyecto).
 * Debe ejecutarse dentro de una transacción activa.
 */
async function cascadeDeleteProjectsByIds(sequelize, projectIds, transaction) {
  const ph = buildPlaceholders(projectIds);

  async function safeExec(sql, replacements) {
    try {
      await sequelize.query(sql, { replacements, transaction });
      return true;
    } catch (e) {
      const code = e && (e.original?.code || e.parent?.code || e.code);
      if (code === "ER_NO_SUCH_TABLE") {
        return false;
      }
      throw e;
    }
  }

  // 1) Eliminar dependencias del Delivery Workspace (code_deliveries y sus hijos)
  // Motivo: user_stories tiene FK RESTRICT desde code_deliveries.user_story_id (y otros enlaces).
  const deliveryRows = await sequelize.query(
    `SELECT id FROM code_deliveries WHERE project_id IN (${ph})`,
    { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction }
  );
  const deliveryIds = deliveryRows.map((r) => r.id);
  if (deliveryIds.length > 0) {
    const dph = buildPlaceholders(deliveryIds);
    await safeExec(`DELETE FROM review_comments WHERE delivery_id IN (${dph})`, deliveryIds);
    await safeExec(`DELETE FROM delivery_reviews WHERE delivery_id IN (${dph})`, deliveryIds);
    await safeExec(`DELETE FROM delivery_commits WHERE delivery_id IN (${dph})`, deliveryIds);
    await safeExec(`DELETE FROM delivery_files WHERE delivery_id IN (${dph})`, deliveryIds);
    // WorkOrder tiene delivery_id -> code_deliveries (desvincular antes de borrar deliveries)
    await safeExec(`UPDATE work_orders SET delivery_id = NULL WHERE project_id IN (${ph})`, projectIds);
    await safeExec(`DELETE FROM code_deliveries WHERE id IN (${dph})`, deliveryIds);
  }

  const featureRows = await sequelize.query(
    `SELECT id FROM features WHERE project_id IN (${ph})`,
    { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction }
  );
  const featureIds = featureRows.map((r) => r.id);

  if (featureIds.length > 0) {
    const fph = buildPlaceholders(featureIds);
    // Work Orders / Tasks vinculados a stories del proyecto
    const storyRows = await sequelize.query(
      `SELECT id FROM user_stories WHERE feature_id IN (${fph})`,
      { type: sequelize.QueryTypes.SELECT, replacements: featureIds, transaction }
    );
    const storyIds = storyRows.map((r) => r.id);
    if (storyIds.length > 0) {
      const sph = buildPlaceholders(storyIds);
      await safeExec(
        `DELETE FROM implementation_steps WHERE work_order_id IN (SELECT id FROM work_orders WHERE user_story_id IN (${sph}))`,
        storyIds
      );
      await safeExec(`DELETE FROM tasks WHERE user_story_id IN (${sph})`, storyIds);
      await safeExec(`UPDATE work_orders SET delivery_id = NULL WHERE user_story_id IN (${sph})`, storyIds);
      await safeExec(`DELETE FROM work_orders WHERE user_story_id IN (${sph})`, storyIds);
    }

    await sequelize.query(`UPDATE user_stories SET sprint_id = NULL WHERE feature_id IN (${fph})`, {
      replacements: featureIds,
      transaction
    });
    await sequelize.query(`DELETE FROM user_stories WHERE feature_id IN (${fph})`, {
      replacements: featureIds,
      transaction
    });
  }

  // 2) Eliminar Work Orders / Tasks directos por project (si existen)
  await safeExec(
    `DELETE FROM implementation_steps WHERE work_order_id IN (SELECT id FROM work_orders WHERE project_id IN (${ph}))`,
    projectIds
  );
  await safeExec(`DELETE FROM tasks WHERE project_id IN (${ph})`, projectIds);
  await safeExec(`UPDATE work_orders SET delivery_id = NULL WHERE project_id IN (${ph})`, projectIds);
  await safeExec(`DELETE FROM work_orders WHERE project_id IN (${ph})`, projectIds);

  await sequelize.query(`DELETE FROM sprints WHERE project_id IN (${ph})`, {
    replacements: projectIds,
    transaction
  });
  await sequelize.query(`UPDATE features SET release_id = NULL WHERE project_id IN (${ph})`, {
    replacements: projectIds,
    transaction
  });
  await sequelize.query(`DELETE FROM features WHERE project_id IN (${ph})`, {
    replacements: projectIds,
    transaction
  });

  const incidentRows = await sequelize.query(
    `SELECT id FROM incidents WHERE project_id IN (${ph})`,
    { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction }
  );
  const incidentIds = incidentRows.map((r) => r.id);
  if (incidentIds.length > 0) {
    const incPh = buildPlaceholders(incidentIds);
    await sequelize.query(
      `DELETE FROM improvements WHERE project_id IN (${ph}) OR incident_id IN (${incPh})`,
      { replacements: [...projectIds, ...incidentIds], transaction }
    );
  } else {
    await sequelize.query(`DELETE FROM improvements WHERE project_id IN (${ph})`, {
      replacements: projectIds,
      transaction
    });
  }

  await sequelize.query(`DELETE FROM incidents WHERE project_id IN (${ph})`, {
    replacements: projectIds,
    transaction
  });

  const docRows = await sequelize.query(
    `SELECT id FROM documents WHERE project_id IN (${ph})`,
    { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction }
  );
  const docIds = docRows.map((r) => r.id);
  if (docIds.length > 0) {
    const dph = buildPlaceholders(docIds);
    await sequelize.query(`DELETE FROM document_versions WHERE document_id IN (${dph})`, {
      replacements: docIds,
      transaction
    });
  }
  await sequelize.query(`DELETE FROM documents WHERE project_id IN (${ph})`, {
    replacements: projectIds,
    transaction
  });
  await sequelize.query(`DELETE FROM projects WHERE id IN (${ph})`, {
    replacements: projectIds,
    transaction
  });
}

async function deleteProjectWithContext(id, context) {
  const organizationId = assertTenant(context);
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  assertProjectVisible(project, organizationId);

  const expectedVersion = context && context.expectedVersion;
  assertExpectedVersion(expectedVersion);
  assertVersionMatch(expectedVersion, project.version);

  const { Project } = getModels();
  const sequelize = Project.sequelize;
  const projectIds = [String(project.id)];

  try {
    await sequelize.transaction(async (t) => {
      await cascadeDeleteProjectsByIds(sequelize, projectIds, t);
    });
  } catch (err) {
    const mysqlMessage = err.original?.message || err.parent?.message || err.message;
    throw new AppError(`Error al eliminar proyecto: ${mysqlMessage}`, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      details: { originalError: mysqlMessage }
    });
  }

  await createProjectAuditEvent(context, "delete", project.id, organizationId);
  return { id: project.id, deleted: true };
}

function buildPlaceholders(arr) {
  return arr.map(() => "?").join(",");
}

async function deleteProjectsBulk(ids, organizationId) {
  if (!ids || ids.length === 0) {
    throw new AppError("Se requiere al menos un id de proyecto", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const uniqueIds = [...new Set(ids.map((id) => String(id)))];
  const projects = await Promise.all(uniqueIds.map((id) => projectsRepository.findById(id)));
  const notFound = uniqueIds.filter((id, i) => !projects[i]);
  if (notFound.length > 0) {
    throw new AppError("Proyecto(s) no encontrado(s): " + notFound.join(", "), {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null) {
    const forbidden = projects.filter((p) => p && p.organization_id !== organizationId);
    if (forbidden.length > 0) {
      throw new AppError("No tiene acceso a uno o más proyectos", {
        statusCode: 403,
        code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
      });
    }
  }

  const { Project } = getModels();
  const sequelize = Project.sequelize;
  const projectIds = uniqueIds;

  try {
    await sequelize.transaction(async (t) => {
      await cascadeDeleteProjectsByIds(sequelize, projectIds, t);
    });
  } catch (err) {
    const mysqlMessage = err.original?.message || err.parent?.message || err.message;
    throw new AppError(`Error al eliminar proyectos: ${mysqlMessage}`, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      details: { originalError: mysqlMessage }
    });
  }

  return { deleted: projectIds.length, ids: projectIds };
}

async function importProjects(payload, context) {
  validateImportPayload(payload);
  const organizationId = context.organizationId;
  if (!organizationId) {
    throw new AppError("Tenant no resuelto", {
      statusCode: 400,
      code: ERROR_CODES.TENANT_REQUIRED
    });
  }

  const { Project, Feature, UserStory } = getModels();
  const sequelize = Project.sequelize;
  const summary = { projects_created: 0, features_created: 0, stories_created: 0 };

  await sequelize.transaction(async (t) => {
    let maxProjectNumber = await projectsRepository.getMaxProjectNumber(t);
    maxProjectNumber = maxProjectNumber || 0;
    let maxFeatureNumber = await featureRepository.getMaxFeatureNumberGlobal(t);
    maxFeatureNumber = maxFeatureNumber || 0;
    let maxStoryNumber = await userStoryRepository.getMaxStoryNumberGlobal(t);
    maxStoryNumber = maxStoryNumber || 0;

    for (let pIdx = 0; pIdx < payload.projects.length; pIdx += 1) {
      const node = payload.projects[pIdx];
      const projectData = node.project;
      const projectName = normalizeProjectName(projectData.name);
      const normalizedProjectName = toNormalizedName(projectName);
      const existing = await projectsRepository.findByNameAndOrganization(normalizedProjectName, organizationId);
      if (existing) {
        throwImportError(`Ya existe un proyecto con el nombre '${projectName}'.`, `projects[${pIdx}].project.name`);
      }

      maxProjectNumber += 1;
      const createdProject = await Project.create(
        {
          number: maxProjectNumber,
          name: projectName,
          normalized_name: normalizedProjectName,
          description: normalizeDescription(projectData.description),
          status: normalizeStatusToken(projectData.status),
          organization_id: organizationId,
          created_by: context.user && context.user.id,
          version: 1
        },
        { transaction: t }
      );
      summary.projects_created += 1;

      const features = Array.isArray(node.features) ? node.features : [];
      for (let fIdx = 0; fIdx < features.length; fIdx += 1) {
        const feature = features[fIdx];
        maxFeatureNumber += 1;
          const normalizedStatus = normalizeFeatureStatus(feature.status);
        const createdFeature = await Feature.create(
          {
            project_id: createdProject.id,
            number: maxFeatureNumber,
            title: String(feature.title).trim(),
            description: feature.description != null ? String(feature.description) : "",
              status: normalizedStatus,
            priority: String(feature.priority).toUpperCase(),
            created_by: context.user && context.user.id
          },
          { transaction: t }
        );
        summary.features_created += 1;

        const stories = Array.isArray(feature.stories) ? feature.stories : [];
        for (let sIdx = 0; sIdx < stories.length; sIdx += 1) {
          const story = stories[sIdx];
          maxStoryNumber += 1;
          const normalizedStoryStatus = normalizeStoryStatus(story.status);
          await UserStory.create(
            {
              feature_id: createdFeature.id,
              number: maxStoryNumber,
              title: String(story.title).trim(),
              description: story.description != null ? String(story.description) : "",
              acceptance_criteria: Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria : null,
              implementation_criteria: Array.isArray(story.implementation_criteria) ? story.implementation_criteria : null,
              status: normalizedStoryStatus,
              priority: String(story.priority).toUpperCase(),
              assigned_to: story.assigned_to != null ? String(story.assigned_to) : null,
              sprint_id: story.sprint_id != null ? String(story.sprint_id) : null,
              created_by: context.user && context.user.id
            },
            { transaction: t }
          );
          summary.stories_created += 1;
        }
      }
    }
  });

  return summary;
}

module.exports = {
  createProject,
  getProjectById,
  listProjects,
  archiveProject,
  archiveProjectWithContext,
  updateProject,
  updateProjectWithContext,
  deleteProject,
  deleteProjectWithContext,
  deleteProjectsBulk,
  importProjects
};
