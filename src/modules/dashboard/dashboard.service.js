/**
 * Dashboard - Service
 * Resumen para el panel: KPIs, proyectos, sprint(s), incidentes, CR pendientes, actividad y catálogo de reglas.
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");
const projectsRepository = require("../backlog/projects.repository");
const reportRepository = require("../reports/report.repository");
const featureService = require("../backlog/feature.service");
const { listRulesCatalogForDashboard } = require("../rules-engine/rulesConfig");

function utcStartOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function utcStartOfWeekMonday() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgoStartUtc(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function releaseStatusLabel(status) {
  const s = String(status || "").toUpperCase();
  const map = {
    PLANNED: "Planificada",
    IN_PROGRESS: "En progreso",
    QA: "En QA",
    RELEASED: "Publicada",
    ROLLED_BACK: "Revertida",
    ARCHIVED: "Archivada"
  };
  return map[s] || status || "—";
}

/**
 * @param {object} user
 * @param {string} organizationId
 * @param {{ windowDays?: number }} [options]
 */
async function getDashboardSummary(user, organizationId, options = {}) {
  const windowDays = Math.min(366, Math.max(1, Number(options.windowDays) || 30));
  const sinceWindow = daysAgoStartUtc(windowDays);
  const sinceMonth = utcStartOfMonth();
  const sinceWeek = utcStartOfWeekMonday();

  const { Project, Sprint, Release, Incident } = getModels();
  const projectIds = await projectsRepository.findIdsByOrganization(organizationId);
  const { getSprintWithProjectAndStories, getStoryProgressByProjectIds } = reportRepository;

  const [
    projectsTotal,
    projectsActiveCount,
    projectsForHealth,
    projectsCreatedInWindow,
    projectsCreatedThisMonth
  ] = await Promise.all([
    Project.count({ where: { organization_id: organizationId } }),
    Project.count({ where: { organization_id: organizationId, status: "ACTIVE" } }),
    Project.findAll({
      where: { organization_id: organizationId },
      attributes: ["id", "number", "name", "status", "created_at"],
      order: [["created_at", "DESC"]],
      limit: 5
    }),
    Project.count({
      where: { organization_id: organizationId, created_at: { [Op.gte]: sinceWindow } }
    }),
    Project.count({
      where: { organization_id: organizationId, created_at: { [Op.gte]: sinceMonth } }
    })
  ]);

  const healthIds = (projectsForHealth || []).map((p) => p.id);
  const [
    activeSprintRow,
    criticalIncidentsCount,
    openIncidentsCount,
    myAssignments,
    projectStoryProgress,
    listAggregates,
    sprintsInProgressCount,
    sprintsAvgCompletionPct,
    releasesPendingCount,
    releasesPendingCreatedThisWeek,
    pendingChangeRequests,
    recentActivity
  ] = await Promise.all([
    findActiveSprint(projectIds),
    countCriticalIncidents(projectIds),
    countOpenIncidents(projectIds),
    getMyAssignments(user.id, organizationId),
    getStoryProgressByProjectIds(projectIds),
    healthIds.length ? projectsRepository.getListAggregates(healthIds) : Promise.resolve(new Map()),
    countSprintsInProgress(projectIds),
    averageInProgressSprintsCompletionPct(projectIds),
    countPendingReleases(organizationId),
    countPendingReleasesCreatedSince(organizationId, sinceWeek),
    listSubmittedCrsForOrg(organizationId, 6),
    buildActivityFeed(organizationId, projectIds, sinceWindow, 5)
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
    const agg = listAggregates.get(String(plain.id)) || {};
    return {
      id: plain.id,
      number: plain.number,
      name: plain.name,
      status: plain.status,
      storiesTotal: storiesTotalForProject,
      storiesDone: storiesDoneForProject,
      progressPercent,
      currentSprintName: agg.current_sprint_name != null ? String(agg.current_sprint_name) : null
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

  const pendingChangeRequestsNormalized = (pendingChangeRequests || []).map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title || "—",
    description: row.description || "",
    impact_level: row.impact_level || "MEDIUM",
    status: row.status,
    updated_at: row.updated_at
  }));

  const recentActivityNormalized = (recentActivity || []).map((ev) => ({
    id: ev.id,
    kind: ev.kind,
    title: ev.title,
    subtitle: ev.subtitle,
    at: ev.at
  }));

  return {
    windowDays,
    projectsActive: projectsActiveCount,
    projectsTotal,
    projectsCreatedInWindow,
    projectsCreatedThisMonth,
    storiesTotal,
    activeSprint,
    sprintsInProgressCount,
    sprintsAvgCompletionPct,
    criticalIncidentsCount: criticalIncidentsCount || 0,
    openIncidentsCount: openIncidentsCount || 0,
    releasesPendingCount,
    releasesPendingCreatedThisWeek,
    myAssignments,
    projectHealth,
    pendingChangeRequests: pendingChangeRequestsNormalized,
    recentActivity: recentActivityNormalized,
    rulesCatalog: listRulesCatalogForDashboard()
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

async function countSprintsInProgress(projectIds) {
  if (!projectIds || projectIds.length === 0) return 0;
  const { Sprint } = getModels();
  if (!Sprint) return 0;
  return Sprint.count({
    where: { project_id: { [Op.in]: projectIds }, status: "IN_PROGRESS" }
  });
}

async function averageInProgressSprintsCompletionPct(projectIds) {
  if (!projectIds || projectIds.length === 0) return null;
  const { Project } = getModels();
  const sequelize = Project.sequelize;
  const ph = projectIds.map(() => "?").join(",");
  const rows = await sequelize.query(
    `SELECT us.sprint_id AS sprint_id,
            COUNT(us.id) AS total,
            SUM(CASE WHEN us.status = 'DONE' THEN 1 ELSE 0 END) AS done_cnt
     FROM user_stories us
     INNER JOIN sprints sp ON sp.id = us.sprint_id AND sp.deleted_at IS NULL
     WHERE sp.project_id IN (${ph}) AND sp.status = 'IN_PROGRESS'
     GROUP BY us.sprint_id`,
    { replacements: projectIds, type: sequelize.QueryTypes.SELECT }
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let sum = 0;
  let n = 0;
  for (const row of rows) {
    const t = Number(row.total) || 0;
    const done = Number(row.done_cnt) || 0;
    if (t > 0) {
      sum += Math.round((done / t) * 100);
      n += 1;
    }
  }
  return n > 0 ? Math.round(sum / n) : 0;
}

async function countCriticalIncidents(projectIds) {
  if (!projectIds || projectIds.length === 0) return 0;
  const { Incident } = getModels();
  if (!Incident) return 0;
  return Incident.count({
    where: {
      project_id: { [Op.in]: projectIds },
      severity: "CRITICAL",
      status: { [Op.in]: ["OPEN", "IN_PROGRESS"] }
    }
  });
}

async function countOpenIncidents(projectIds) {
  if (!projectIds || projectIds.length === 0) return 0;
  const { Incident } = getModels();
  if (!Incident) return 0;
  return Incident.count({
    where: {
      project_id: { [Op.in]: projectIds },
      status: { [Op.in]: ["OPEN", "IN_PROGRESS"] }
    }
  });
}

async function countPendingReleases(organizationId) {
  if (!organizationId) return 0;
  const { Release } = getModels();
  if (!Release) return 0;
  return Release.count({
    where: {
      organization_id: organizationId,
      status: { [Op.in]: ["PLANNED", "IN_PROGRESS", "QA"] }
    }
  });
}

async function countPendingReleasesCreatedSince(organizationId, since) {
  if (!organizationId || !since) return 0;
  const { Release } = getModels();
  if (!Release) return 0;
  return Release.count({
    where: {
      organization_id: organizationId,
      status: { [Op.in]: ["PLANNED", "IN_PROGRESS", "QA"] },
      created_at: { [Op.gte]: since }
    }
  });
}

async function listSubmittedCrsForOrg(organizationId, limit) {
  if (!organizationId) return [];
  const { Project } = getModels();
  const sequelize = Project.sequelize;
  const lim = Math.min(20, Math.max(1, limit));
  const [rows] = await sequelize.query(
    `SELECT cr.id, cr.code, cr.title, cr.description, cr.impact_level, cr.status, cr.updated_at
     FROM change_requests cr
     LEFT JOIN features f ON cr.entity_type = 'FEATURE' AND cr.entity_id = f.id
     LEFT JOIN projects p_feat ON f.project_id = p_feat.id AND p_feat.organization_id = :orgId
     LEFT JOIN releases rel ON cr.entity_type = 'RELEASE' AND cr.entity_id = rel.id AND rel.organization_id = :orgId
     WHERE cr.deleted_at IS NULL
       AND cr.status = 'SUBMITTED'
       AND (
         (cr.entity_type = 'FEATURE' AND p_feat.id IS NOT NULL)
         OR (cr.entity_type = 'RELEASE' AND rel.id IS NOT NULL)
       )
     ORDER BY cr.updated_at DESC
     LIMIT :lim`,
    { replacements: { orgId: organizationId, lim } }
  );
  return Array.isArray(rows) ? rows : [];
}

async function buildActivityFeed(organizationId, projectIds, since, limit) {
  const { Release, Incident, Sprint } = getModels();
  const events = [];
  const cap = 6;

  if (organizationId && Release) {
    const rels = await Release.findAll({
      where: {
        organization_id: organizationId,
        updated_at: { [Op.gte]: since }
      },
      order: [["updated_at", "DESC"]],
      limit: cap,
      attributes: ["id", "name", "version", "status", "updated_at"]
    });
    for (const r of rels) {
      const plain = typeof r.toJSON === "function" ? r.toJSON() : r;
      events.push({
        id: `release-${plain.id}`,
        kind: "release",
        title: `Release ${plain.version || plain.name || ""}`.trim(),
        subtitle: releaseStatusLabel(plain.status),
        at: plain.updated_at
      });
    }
  }

  if (projectIds.length && Incident) {
    const incs = await Incident.findAll({
      where: { project_id: { [Op.in]: projectIds }, updated_at: { [Op.gte]: since } },
      order: [["updated_at", "DESC"]],
      limit: cap,
      attributes: ["id", "title", "status", "severity", "updated_at"]
    });
    for (const inc of incs) {
      const plain = typeof inc.toJSON === "function" ? inc.toJSON() : inc;
      events.push({
        id: `incident-${plain.id}`,
        kind: "incident",
        title: plain.title || "Incidente",
        subtitle: `${plain.status} · ${plain.severity}`,
        at: plain.updated_at
      });
    }
  }

  if (projectIds.length && Sprint) {
    const sprints = await Sprint.findAll({
      where: {
        project_id: { [Op.in]: projectIds },
        status: "IN_PROGRESS",
        updated_at: { [Op.gte]: since }
      },
      order: [["updated_at", "DESC"]],
      limit: 3,
      attributes: ["id", "name", "project_id", "updated_at"]
    });
    for (const sp of sprints) {
      const plain = typeof sp.toJSON === "function" ? sp.toJSON() : sp;
      events.push({
        id: `sprint-${plain.id}`,
        kind: "sprint",
        title: plain.name || "Sprint en curso",
        subtitle: "Sprint activo",
        at: plain.updated_at
      });
    }
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events.slice(0, limit);
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
