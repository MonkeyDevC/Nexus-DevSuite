/**
 * Módulo Backlog - Repositorio Projects
 * Único punto de acceso a datos de proyectos.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { Op } = require("sequelize");

function getProjectModel() {
  const { Project } = getModels();
  if (!Project) throw new Error("Modelo Project no registrado en loadModels");
  return Project;
}

async function getMaxProjectNumber(transaction) {
  const Project = getProjectModel();
  const max = await Project.max("number", { transaction: transaction || undefined });
  return max != null ? max : 0;
}

async function create(payload, options = {}) {
  const Project = getProjectModel();
  return Project.create(payload, options);
}

async function findById(id, options = {}) {
  const Project = getProjectModel();
  return Project.findByPk(id, options);
}

async function findByNameAndOrganization(name, organizationId, options = {}) {
  const Project = getProjectModel();
  return Project.findOne({
    where: { normalized_name: name, organization_id: organizationId },
    transaction: options.transaction
  });
}

async function findByOrganizationAndNumber(organizationId, number) {
  const Project = getProjectModel();
  const n = Number(number);
  if (!Number.isFinite(n) || n < 1) return null;
  return Project.findOne({
    where: { organization_id: organizationId, number: n }
  });
}

async function findIdsByOrganization(organizationId) {
  const Project = getProjectModel();
  const rows = await Project.findAll({
    where: { organization_id: organizationId },
    attributes: ["id"]
  });
  return rows.map((r) => r.id);
}

async function list({ page = 1, limit = 10, status, organizationId } = {}) {
  const Project = getProjectModel();
  const offset = (page - 1) * limit;
  const where = {};
  if (organizationId != null) where.organization_id = organizationId;
  if (status) where.status = status;

  const { rows, count } = await Project.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const Project = getProjectModel();
  const [affected] = await Project.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

async function getNextProjectNumberForOrganization(organizationId, transaction) {
  const Project = getProjectModel();
  const sequelize = Project.sequelize;
  const [rows] = await sequelize.query(
    "SELECT COALESCE(MAX(number), 0) AS max_number FROM projects WHERE organization_id = :organizationId FOR UPDATE",
    {
      replacements: { organizationId },
      transaction
    }
  );
  const maxNumber = Array.isArray(rows) && rows[0] ? Number(rows[0].max_number) : 0;
  return maxNumber + 1;
}

/**
 * Métricas de listado por lote (equipo, sprint activo, bases para progreso y última actividad).
 * @param {string[]} projectIds
 * @returns {Promise<Map<string, object>>}
 */
async function getListAggregates(projectIds) {
  const Project = getProjectModel();
  const sequelize = Project.sequelize;
  const ids = [...new Set((projectIds || []).map((id) => String(id)))].filter(Boolean);
  const empty = () => ({
    team_count: 0,
    current_sprint_id: null,
    current_sprint_name: null,
    feat_active: 0,
    feat_done: 0,
    feat_max_u: null,
    st_active: 0,
    st_done: 0,
    st_max_u: null,
    sprint_max_u: null
  });
  const map = new Map(ids.map((id) => [id, empty()]));
  if (ids.length === 0) return map;

  const ph = ids.map(() => "?").join(",");

  const teamRows = await sequelize.query(
    `SELECT t.project_id AS project_id, COUNT(DISTINCT t.user_id) AS cnt
     FROM (
       SELECT f.project_id AS project_id, us.assigned_to AS user_id
       FROM user_stories us
       INNER JOIN features f ON f.id = us.feature_id
       WHERE f.project_id IN (${ph}) AND us.assigned_to IS NOT NULL
       UNION ALL
       SELECT project_id, created_by AS user_id FROM features WHERE project_id IN (${ph})
       UNION ALL
       SELECT f.project_id AS project_id, us.created_by AS user_id
       FROM user_stories us
       INNER JOIN features f ON f.id = us.feature_id
       WHERE f.project_id IN (${ph})
       UNION ALL
       SELECT id AS project_id, created_by AS user_id FROM projects WHERE id IN (${ph})
     ) t
     WHERE t.user_id IS NOT NULL
     GROUP BY t.project_id`,
    { replacements: [...ids, ...ids, ...ids, ...ids], type: sequelize.QueryTypes.SELECT }
  );
  for (const row of teamRows) {
    const pid = String(row.project_id);
    const cell = map.get(pid);
    if (cell) cell.team_count = Number(row.cnt) || 0;
  }

  const sprintRows = await sequelize.query(
    `SELECT id, project_id, name, updated_at
     FROM sprints
     WHERE project_id IN (${ph}) AND status = 'IN_PROGRESS' AND deleted_at IS NULL`,
    { replacements: ids, type: sequelize.QueryTypes.SELECT }
  );
  for (const row of sprintRows) {
    const pid = String(row.project_id);
    const cell = map.get(pid);
    if (!cell) continue;
    const prev = cell._sprint_u ? new Date(cell._sprint_u).getTime() : 0;
    const cur = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if (!cell.current_sprint_id || cur >= prev) {
      cell.current_sprint_id = String(row.id);
      cell.current_sprint_name = row.name != null ? String(row.name) : "";
      cell._sprint_u = row.updated_at;
    }
  }
  for (const cell of map.values()) {
    delete cell._sprint_u;
  }

  const featRows = await sequelize.query(
    `SELECT project_id,
            SUM(CASE WHEN status <> 'ARCHIVED' THEN 1 ELSE 0 END) AS feat_active,
            SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS feat_done,
            MAX(updated_at) AS feat_max_u
     FROM features
     WHERE project_id IN (${ph})
     GROUP BY project_id`,
    { replacements: ids, type: sequelize.QueryTypes.SELECT }
  );
  for (const row of featRows) {
    const pid = String(row.project_id);
    const cell = map.get(pid);
    if (!cell) continue;
    cell.feat_active = Number(row.feat_active) || 0;
    cell.feat_done = Number(row.feat_done) || 0;
    cell.feat_max_u = row.feat_max_u || null;
  }

  const storyRows = await sequelize.query(
    `SELECT f.project_id AS project_id,
            SUM(CASE WHEN us.status <> 'ARCHIVED' THEN 1 ELSE 0 END) AS st_active,
            SUM(CASE WHEN us.status = 'DONE' THEN 1 ELSE 0 END) AS st_done,
            MAX(us.updated_at) AS st_max_u
     FROM user_stories us
     INNER JOIN features f ON f.id = us.feature_id
     WHERE f.project_id IN (${ph})
     GROUP BY f.project_id`,
    { replacements: ids, type: sequelize.QueryTypes.SELECT }
  );
  for (const row of storyRows) {
    const pid = String(row.project_id);
    const cell = map.get(pid);
    if (!cell) continue;
    cell.st_active = Number(row.st_active) || 0;
    cell.st_done = Number(row.st_done) || 0;
    cell.st_max_u = row.st_max_u || null;
  }

  const sprintMaxRows = await sequelize.query(
    `SELECT project_id, MAX(updated_at) AS sprint_max_u
     FROM sprints
     WHERE project_id IN (${ph}) AND deleted_at IS NULL
     GROUP BY project_id`,
    { replacements: ids, type: sequelize.QueryTypes.SELECT }
  );
  for (const row of sprintMaxRows) {
    const pid = String(row.project_id);
    const cell = map.get(pid);
    if (cell) cell.sprint_max_u = row.sprint_max_u || null;
  }

  return map;
}

module.exports = {
  create,
  findById,
  findByNameAndOrganization,
  findByOrganizationAndNumber,
  findIdsByOrganization,
  getMaxProjectNumber,
  getNextProjectNumberForOrganization,
  getListAggregates,
  list,
  update
};
