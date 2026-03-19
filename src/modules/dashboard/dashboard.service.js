/**
 * Dashboard - Service
 * Resumen para el panel: proyectos, stories, sprint activo, incidentes críticos, mis asignaciones.
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");
const projectsRepository = require("../backlog/projects.repository");
const reportRepository = require("../reports/report.repository");
const featureService = require("../backlog/feature.service");

async function getDashboardSummary(user, organizationId) {
  const { Project } = getModels();
  const projectIds = await projectsRepository.findIdsByOrganization(organizationId);
  const { getSprintWithProjectAndStories, getStoryProgressByProjectIds } = reportRepository;

  const [projectsTotal, projectsActiveCount, projectsForHealth] = await Promise.all([
    Project.count({ where: { organization_id: organizationId } }),
    Project.count({ where: { organization_id: organizationId, status: "ACTIVE" } }),
    Project.findAll({
      where: { organization_id: organizationId },
      attributes: ["id", "number", "name", "status", "created_at"],
      order: [["created_at", "DESC"]],
      limit: 10
    })
  ]);

  const [activeSprintRow, criticalIncidentsCount, myAssignments, projectStoryProgress] = await Promise.all([
    findActiveSprint(projectIds),
    countCriticalIncidents(projectIds),
    getMyAssignments(user.id, organizationId),
    getStoryProgressByProjectIds(projectIds)
  ]);

  const progressByProjectId = {};
  projectStoryProgress.forEach((row) => {
    progressByProjectId[row.project_id] = row;
  });

  const storiesTotal = projectStoryProgress.reduce((acc, row) => acc + (row.stories_total || 0), 0);
  const projectHealth = (projectsForHealth || []).map((project) => {
    const plain = typeof project.toJSON === "function" ? project.toJSON() : project;
    const progress = progressByProjectId[plain.id] || { stories_total: 0, stories_done: 0 };
    const storiesTotalForProject = progress.stories_total || 0;
    const storiesDoneForProject = progress.stories_done || 0;
    const progressPercent =
      storiesTotalForProject > 0 ? Math.round((storiesDoneForProject / storiesTotalForProject) * 100) : 0;
    return {
      id: plain.id,
      number: plain.number,
      name: plain.name,
      status: plain.status,
      storiesTotal: storiesTotalForProject,
      storiesDone: storiesDoneForProject,
      progressPercent
    };
  });

  let activeSprint = null;
  if (activeSprintRow) {
    const sprintData = await getSprintWithProjectAndStories(activeSprintRow.id);
    if (sprintData && sprintData.project) featureService.ensureProjectInOrg(sprintData.project, organizationId);
    const stories = sprintData?.user_stories || [];
    const done = stories.filter((s) => (s.status || "").toUpperCase() === "DONE").length;
    const progressPercent = stories.length > 0 ? Math.round((done / stories.length) * 100) : 0;
    activeSprint = {
      id: activeSprintRow.id,
      name: activeSprintRow.name || "Sprint activo",
      progressPercent
    };
  }

  return {
    projectsActive: projectsActiveCount,
    projectsTotal,
    storiesTotal,
    activeSprint,
    criticalIncidentsCount: criticalIncidentsCount || 0,
    myAssignments,
    projectHealth
  };
}

async function findActiveSprint(projectIds) {
  if (!projectIds || projectIds.length === 0) return null;
  const { Sprint } = getModels();
  if (!Sprint) return null;
  const sprint = await Sprint.findOne({
    where: { project_id: { [Op.in]: projectIds }, status: "IN_PROGRESS" },
    order: [["start_date", "DESC"]]
  });
  return sprint;
}

async function countCriticalIncidents(projectIds) {
  if (!projectIds || projectIds.length === 0) return 0;
  const { Incident } = getModels();
  if (!Incident) return 0;
  const count = await Incident.count({
    where: {
      project_id: { [Op.in]: projectIds },
      severity: "CRITICAL",
      status: { [Op.in]: ["OPEN", "IN_PROGRESS"] }
    }
  });
  return count;
}

async function getMyAssignments(userId, organizationId) {
  const { UserStory, Feature, Project } = getModels();
  if (!UserStory || !Feature || !Project) return [];
  const rows = await UserStory.findAll({
    where: { assigned_to: userId },
    include: [
      {
        model: Feature,
        as: "feature",
        attributes: ["id", "title"],
        required: true,
        include: [
          {
            model: Project,
            as: "project",
            attributes: [],
            required: true,
            where: { organization_id: organizationId }
          }
        ]
      }
    ],
    limit: 50,
    order: [["updated_at", "DESC"]]
  });
  return rows.map((s) => {
    const plain = typeof s.toJSON === "function" ? s.toJSON() : s;
    return {
      id: plain.id,
      number: plain.number,
      title: plain.title,
      status: plain.status,
      priority: plain.priority || "MEDIUM",
      feature_id: plain.feature_id,
      feature_title: plain.feature && (plain.feature.title || plain.feature.id)
    };
  });
}

module.exports = {
  getDashboardSummary
};
