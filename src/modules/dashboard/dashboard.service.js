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
  const projectIds = await projectsRepository.findIdsByOrganization(organizationId);
  const { list } = projectsRepository;
  const { getProjectCounts, getSprintWithProjectAndStories } = reportRepository;

  const [projectsResult, activeSprintRow, criticalIncidentsCount, myAssignments] = await Promise.all([
    list({ organizationId, limit: 500, page: 1 }),
    findActiveSprint(projectIds),
    countCriticalIncidents(projectIds),
    getMyAssignments(user.id)
  ]);

  const projects = projectsResult.items || [];
  const totalProjects = projectsResult.total != null ? projectsResult.total : projects.length;
  const activeProjects = projects.filter((p) => (p.status || "").toUpperCase() === "ACTIVE");
  const projectsActiveCount = activeProjects.length;

  let storiesTotal = 0;
  if (projectIds.length > 0) {
    const counts = await Promise.all(projectIds.slice(0, 100).map((pid) => getProjectCounts(pid)));
    storiesTotal = counts.reduce((acc, c) => acc + (c.userStories || 0), 0);
  }

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
    projectsTotal: totalProjects,
    storiesTotal,
    activeSprint,
    criticalIncidentsCount: criticalIncidentsCount || 0,
    myAssignments
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
    where: { project_id: { [Op.in]: projectIds }, severity: "CRITICAL" }
  });
  return count;
}

async function getMyAssignments(userId) {
  const { UserStory, Feature } = getModels();
  if (!UserStory || !Feature) return [];
  const rows = await UserStory.findAll({
    where: { assigned_to: userId },
    include: [{ model: Feature, as: "feature", attributes: ["id", "title"], required: true }],
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
