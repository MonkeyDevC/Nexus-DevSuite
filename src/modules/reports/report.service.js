/**
 * Módulo Reports - Service
 * Solo lecturas. getProjectSummary, getSprintSummary, getUserActivity, getAuditLogs.
 * RBAC: MASTER y EMPLOYEE ven reportes proyecto/sprint; EMPLOYEE solo propia activity; solo MASTER en /reports/audit.
 */

const reportRepository = require("./report.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const authRepository = require("../auth/auth.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

/** RBAC: Por defecto MASTER y EMPLOYEE pueden ver todos los reportes de proyecto y de sprint (sin restricción por proyecto). */
const CAN_VIEW_PROJECT_AND_SPRINT_REPORTS = ["MASTER", "EMPLOYEE"];

function toPlainProject(project) {
  if (!project) return null;
  const p = typeof project.toJSON === "function" ? project.toJSON() : project;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    created_by: p.created_by,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

function toPlainSprint(sprint) {
  if (!sprint) return null;
  const s = typeof sprint.toJSON === "function" ? sprint.toJSON() : sprint;
  return {
    id: s.id,
    project_id: s.project_id,
    name: s.name,
    goal: s.goal,
    start_date: s.start_date,
    end_date: s.end_date,
    status: s.status,
    created_by: s.created_by,
    closed_by: s.closed_by,
    closed_at: s.closed_at,
    created_at: s.created_at,
    updated_at: s.updated_at
  };
}

function toPlainUserSafe(user) {
  if (!user) return null;
  const u = typeof user.toJSON === "function" ? user.toJSON() : user;
  return {
    id: u.id,
    email: u.email,
    role: u.role ? (u.role.name || u.role) : null
  };
}

function toPlainAuditLog(entry) {
  if (!entry) return null;
  const e = typeof entry.toJSON === "function" ? entry.toJSON() : entry;
  return {
    id: e.id,
    user_id: e.user_id,
    action: e.action,
    entity: e.entity,
    entity_id: e.entity_id,
    metadata: e.metadata,
    request_id: e.request_id,
    ip_address: e.ip_address,
    user_agent: e.user_agent,
    created_at: e.created_at
  };
}

async function getProjectSummary(projectId, user, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);
  const counts = await reportRepository.getProjectCounts(projectId);
  return {
    project: toPlainProject(project),
    counts
  };
}

async function getSprintSummary(sprintId, user, organizationId) {
  const sprint = await reportRepository.getSprintWithProjectAndStories(sprintId);
  if (!sprint) {
    throw new AppError("Sprint no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.SPRINT_NOT_FOUND
    });
  }
  if (sprint.project) featureService.ensureProjectInOrg(sprint.project, organizationId);
  const plain = toPlainSprint(sprint);
  const project = sprint.project ? toPlainProject(sprint.project) : null;
  const stories = (sprint.user_stories || []).map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status
  }));
  return {
    sprint: plain,
    project,
    stories,
    storiesCount: stories.length
  };
}

async function getUserActivity(userId, requestingUser, filters = {}, pagination = {}, organizationId) {
  const targetUser = await authRepository.findUserById(userId);
  if (!targetUser) {
    throw new AppError("Usuario no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
  if (requestingUser.role !== "MASTER" && requestingUser.id !== userId) {
    throw new AppError("No autorizado para ver la actividad de otro usuario", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }
  if (organizationId != null && targetUser.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a la actividad de este usuario", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const { items, total } = await reportRepository.getAuditLogs(
    { user_id: userId, ...filters },
    pagination
  );
  const page = Math.max(1, Number.parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(pagination.limit, 10) || 20));
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    user: toPlainUserSafe(targetUser),
    auditLogs: items.map(toPlainAuditLog),
    pagination: { page, limit, total, totalPages }
  };
}

async function getAuditLogs(requestingUser, filters, pagination, context) {
  if (requestingUser.role !== "MASTER") {
    throw new AppError("Solo MASTER puede acceder al listado de auditoría", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }
  const page = Math.max(1, Number.parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(pagination.limit, 10) || 20));
  const { items, total } = await reportRepository.getAuditLogs(filters, { page, limit });
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  if (context?.user && context.requestId) {
    await authRepository.createAuditLog({
      user_id: context.user.id,
      request_id: context.requestId,
      action: "REPORT_AUDIT_ACCESS",
      entity: "AUDIT_REPORT",
      entity_id: null,
      metadata: { filters: { ...filters }, page, limit, total },
      ip_address: context.ip || null,
      user_agent: context.userAgent || null
    });
  }

  return {
    auditLogs: items.map(toPlainAuditLog),
    pagination: { page, limit, total, totalPages }
  };
}

module.exports = {
  getProjectSummary,
  getSprintSummary,
  getUserActivity,
  getAuditLogs
};
