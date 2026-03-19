/**
 * Módulo Reports - Repositorio
 * Centraliza todas las consultas de reportes usando getModels(). Solo lecturas.
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");

function getReportModels() {
  const models = getModels();
  const { AuditLog, Project, Feature, UserStory, Sprint, Incident, Improvement, Document } = models;
  if (!AuditLog || !Project || !Feature || !UserStory || !Sprint) {
    throw new Error("Modelos requeridos para reportes no registrados en loadModels");
  }
  return { AuditLog, Project, Feature, UserStory, Sprint, Incident, Improvement, Document };
}

/**
 * Lista audit_logs con filtros y paginación. Orden: created_at DESC.
 * @param {Object} filters - user_id?, entity?, entity_id?, from?, to? (fechas ISO), action?
 * @param {Object} pagination - page, limit
 * @returns {{ items: Array, total: number }}
 */
async function getAuditLogs(filters = {}, pagination = {}) {
  const { AuditLog } = getReportModels();
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const where = {};
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entity_id) where.entity_id = filters.entity_id;
  if (filters.action) where.action = filters.action;
  if (filters.from || filters.to) {
    where.created_at = {};
    if (filters.from) where.created_at[Op.gte] = new Date(filters.from);
    if (filters.to) where.created_at[Op.lte] = new Date(filters.to);
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count };
}

/**
 * Conteos por proyecto: features, userStories (vía features), sprints, incidents, improvements (project_id), documents.
 * Evita N+1; ejecuta conteos en paralelo.
 */
async function getProjectCounts(projectId) {
  const { Feature, UserStory, Sprint, Incident, Improvement, Document } = getReportModels();

  const [featuresCount, userStoriesCount, sprintsCount, incidentsCount, improvementsCount, documentsCount] =
    await Promise.all([
      Feature.count({ where: { project_id: projectId } }),
      UserStory.count({
        include: [{ model: Feature, as: "feature", required: true, where: { project_id: projectId } }]
      }),
      Sprint.count({ where: { project_id: projectId } }),
      Incident.count({ where: { project_id: projectId } }),
      Improvement.count({ where: { project_id: projectId } }),
      Document.count({ where: { project_id: projectId } })
    ]);

  return {
    features: featuresCount,
    userStories: userStoriesCount,
    sprints: sprintsCount,
    incidents: incidentsCount,
    improvements: improvementsCount,
    documents: documentsCount
  };
}

/**
 * Sprint con proyecto y lista resumida de stories (id, title, status).
 */
async function getSprintWithProjectAndStories(sprintId) {
  const { Sprint, Project, UserStory } = getReportModels();
  const sprint = await Sprint.findByPk(sprintId, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "organization_id", "name", "description", "status", "created_at"]
      },
      {
        model: UserStory,
        as: "user_stories",
        attributes: ["id", "title", "status"],
        required: false
      }
    ]
  });
  return sprint;
}

/**
 * Resume stories por proyecto en una sola consulta.
 * Retorna [{ project_id, stories_total, stories_done }].
 */
async function getStoryProgressByProjectIds(projectIds = []) {
  if (!Array.isArray(projectIds) || projectIds.length === 0) return [];
  const { Feature, UserStory } = getReportModels();
  const sequelize = Feature.sequelize;

  const rows = await Feature.findAll({
    where: { project_id: { [Op.in]: projectIds } },
    attributes: [
      "project_id",
      [sequelize.fn("COUNT", sequelize.col("user_stories.id")), "stories_total"],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal("CASE WHEN user_stories.status = 'DONE' THEN 1 ELSE 0 END")
        ),
        "stories_done"
      ]
    ],
    include: [
      {
        model: UserStory,
        as: "user_stories",
        attributes: [],
        required: false
      }
    ],
    group: ["project_id"],
    raw: true
  });

  return rows.map((row) => ({
    project_id: row.project_id,
    stories_total: Number(row.stories_total || 0),
    stories_done: Number(row.stories_done || 0)
  }));
}

module.exports = {
  getAuditLogs,
  getProjectCounts,
  getSprintWithProjectAndStories,
  getStoryProgressByProjectIds
};
