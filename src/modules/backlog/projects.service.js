/**
 * Módulo Backlog - Service Projects
 * Reglas de negocio: duplicados, archivado, acceso a datos vía repository.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { Op } = require("sequelize");
const projectsRepository = require("./projects.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(project) {
  if (!project) return null;
  const p = typeof project.toJSON === "function" ? project.toJSON() : project;
  return {
    id: p.id,
    number: p.number,
    name: p.name,
    description: p.description,
    status: p.status,
    organization_id: p.organization_id,
    created_by: p.created_by,
    archived_at: p.archived_at,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

async function createProject(payload, context) {
  const organizationId = context.organizationId;
  if (!organizationId) {
    throw new AppError("Tenant no resuelto", {
      statusCode: 400,
      code: ERROR_CODES.TENANT_REQUIRED
    });
  }
  const existing = await projectsRepository.findByNameAndOrganization(payload.name, organizationId);
  if (existing) {
    throw new AppError("Ya existe un proyecto con ese nombre", {
      statusCode: 409,
      code: ERROR_CODES.PROJECT_ALREADY_EXISTS
    });
  }
  const { getModels } = require("../../infrastructure/db/loadModels");
  const { Project } = getModels();
  const sequelize = Project.sequelize;
  const created = await sequelize.transaction(async (t) => {
    const maxNumber = await projectsRepository.getMaxProjectNumber(t);
    const nextNumber = (maxNumber || 0) + 1;
    return projectsRepository.create(
      {
        ...payload,
        organization_id: organizationId,
        created_by: context.user && context.user.id,
        number: nextNumber
      },
      { transaction: t }
    );
  });
  return toPlain(created);
}

async function getProjectById(id, organizationId) {
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  return toPlain(project);
}

async function listProjects(params) {
  const page = params && params.page ? params.page : 1;
  const limit = params && params.limit ? params.limit : 10;
  const status = params && params.status;
  const organizationId = params && params.organizationId;
  const { items, total } = await projectsRepository.list({ page, limit, status, organizationId });
  return {
    data: items.map(toPlain),
    meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
}

async function archiveProject(id, organizationId) {
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const updated = await projectsRepository.update(id, {
    status: "ARCHIVED",
    archived_at: new Date()
  });
  return toPlain(updated);
}

async function updateProject(id, payload, organizationId) {
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const updates = {};
  if (payload.name != null) updates.name = payload.name.trim();
  if (payload.description != null) updates.description = payload.description.trim();
  if (Object.keys(updates).length === 0) return toPlain(project);
  if (updates.name && updates.name !== project.name) {
    const existing = await projectsRepository.findByNameAndOrganization(updates.name, project.organization_id);
    if (existing) {
      throw new AppError("Ya existe un proyecto con ese nombre", {
        statusCode: 409,
        code: ERROR_CODES.PROJECT_ALREADY_EXISTS
      });
    }
  }
  const updated = await projectsRepository.update(id, updates);
  return toPlain(updated);
}

async function deleteProject(id, organizationId) {
  const project = await projectsRepository.findById(id);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  if (organizationId != null && project.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a este proyecto", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }

  const { Project } = getModels();

  const sequelize = Project.sequelize;
  const projectId = String(project.id);

  try {
    await sequelize.transaction(async (t) => {
      const featureRows = await sequelize.query(
        "SELECT id FROM features WHERE project_id = :projectId",
        { type: sequelize.QueryTypes.SELECT, replacements: { projectId }, transaction: t }
      );
      const featureIds = featureRows.map((r) => r.id);

      if (featureIds.length > 0) {
        const placeholders = featureIds.map(() => "?").join(",");
        await sequelize.query(
          `UPDATE user_stories SET sprint_id = NULL WHERE feature_id IN (${placeholders})`,
          { replacements: featureIds, transaction: t }
        );
        await sequelize.query(
          `DELETE FROM user_stories WHERE feature_id IN (${placeholders})`,
          { replacements: featureIds, transaction: t }
        );
      }

      await sequelize.query("DELETE FROM sprints WHERE project_id = :projectId", {
        replacements: { projectId },
        transaction: t
      });
      await sequelize.query("UPDATE features SET release_id = NULL WHERE project_id = :projectId", {
        replacements: { projectId },
        transaction: t
      });
      await sequelize.query("DELETE FROM features WHERE project_id = :projectId", {
        replacements: { projectId },
        transaction: t
      });

      const incidentRows = await sequelize.query(
        "SELECT id FROM incidents WHERE project_id = :projectId",
        { type: sequelize.QueryTypes.SELECT, replacements: { projectId }, transaction: t }
      );
      const incidentIds = incidentRows.map((r) => r.id);
      if (incidentIds.length > 0) {
        const incPlaceholders = incidentIds.map(() => "?").join(",");
        await sequelize.query(
          `DELETE FROM improvements WHERE project_id = ? OR incident_id IN (${incPlaceholders})`,
          { replacements: [projectId, ...incidentIds], transaction: t }
        );
      } else {
        await sequelize.query("DELETE FROM improvements WHERE project_id = :projectId", {
          replacements: { projectId },
          transaction: t
        });
      }

      await sequelize.query("DELETE FROM incidents WHERE project_id = :projectId", {
        replacements: { projectId },
        transaction: t
      });

      const docRows = await sequelize.query(
        "SELECT id FROM documents WHERE project_id = :projectId",
        { type: sequelize.QueryTypes.SELECT, replacements: { projectId }, transaction: t }
      );
      const docIds = docRows.map((r) => r.id);
      if (docIds.length > 0) {
        const docPlaceholders = docIds.map(() => "?").join(",");
        await sequelize.query(
          `DELETE FROM document_versions WHERE document_id IN (${docPlaceholders})`,
          { replacements: docIds, transaction: t }
        );
      }
      await sequelize.query("DELETE FROM documents WHERE project_id = :projectId", {
        replacements: { projectId },
        transaction: t
      });
      await sequelize.query("DELETE FROM projects WHERE id = :projectId", {
        replacements: { projectId },
        transaction: t
      });
    });
  } catch (err) {
    const mysqlMessage = err.original?.message || err.parent?.message || err.message;
    throw new AppError(`Error al eliminar proyecto: ${mysqlMessage}`, {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      details: { originalError: mysqlMessage }
    });
  }

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
      const ph = buildPlaceholders(projectIds);

      const featureRows = await sequelize.query(
        `SELECT id FROM features WHERE project_id IN (${ph})`,
        { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction: t }
      );
      const featureIds = featureRows.map((r) => r.id);

      if (featureIds.length > 0) {
        const fph = buildPlaceholders(featureIds);
        await sequelize.query(
          `UPDATE user_stories SET sprint_id = NULL WHERE feature_id IN (${fph})`,
          { replacements: featureIds, transaction: t }
        );
        await sequelize.query(`DELETE FROM user_stories WHERE feature_id IN (${fph})`, {
          replacements: featureIds,
          transaction: t
        });
      }

      await sequelize.query(`DELETE FROM sprints WHERE project_id IN (${ph})`, {
        replacements: projectIds,
        transaction: t
      });
      await sequelize.query(`UPDATE features SET release_id = NULL WHERE project_id IN (${ph})`, {
        replacements: projectIds,
        transaction: t
      });
      await sequelize.query(`DELETE FROM features WHERE project_id IN (${ph})`, {
        replacements: projectIds,
        transaction: t
      });

      const incidentRows = await sequelize.query(
        `SELECT id FROM incidents WHERE project_id IN (${ph})`,
        { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction: t }
      );
      const incidentIds = incidentRows.map((r) => r.id);
      if (incidentIds.length > 0) {
        const incPh = buildPlaceholders(incidentIds);
        await sequelize.query(
          `DELETE FROM improvements WHERE project_id IN (${ph}) OR incident_id IN (${incPh})`,
          { replacements: [...projectIds, ...incidentIds], transaction: t }
        );
      } else {
        await sequelize.query(`DELETE FROM improvements WHERE project_id IN (${ph})`, {
          replacements: projectIds,
          transaction: t
        });
      }

      await sequelize.query(`DELETE FROM incidents WHERE project_id IN (${ph})`, {
        replacements: projectIds,
        transaction: t
      });

      const docRows = await sequelize.query(
        `SELECT id FROM documents WHERE project_id IN (${ph})`,
        { type: sequelize.QueryTypes.SELECT, replacements: projectIds, transaction: t }
      );
      const docIds = docRows.map((r) => r.id);
      if (docIds.length > 0) {
        const dph = buildPlaceholders(docIds);
        await sequelize.query(`DELETE FROM document_versions WHERE document_id IN (${dph})`, {
          replacements: docIds,
          transaction: t
        });
      }
      await sequelize.query(`DELETE FROM documents WHERE project_id IN (${ph})`, {
        replacements: projectIds,
        transaction: t
      });
      await sequelize.query(`DELETE FROM projects WHERE id IN (${ph})`, {
        replacements: projectIds,
        transaction: t
      });
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

module.exports = {
  createProject,
  getProjectById,
  listProjects,
  archiveProject,
  updateProject,
  deleteProject,
  deleteProjectsBulk
};
