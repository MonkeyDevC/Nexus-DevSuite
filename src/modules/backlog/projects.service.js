/**
 * Módulo Backlog - Service Projects
 * Reglas de negocio: duplicados, archivado, acceso a datos vía repository.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { Op } = require("sequelize");
const projectsRepository = require("./projects.repository");
const featureRepository = require("./feature.repository");
const userStoryRepository = require("./userStory.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const PROJECT_IMPORT_STATUSES = ["ACTIVE", "ARCHIVED"];
const FEATURE_IMPORT_STATUSES = ["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"];
const STORY_IMPORT_STATUSES = ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"];
const IMPORT_ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

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

function isUuid(value) {
  if (value == null) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function throwImportError(message, path, code = ERROR_CODES.IMPORT_VALIDATION_ERROR) {
  throw new AppError(message, {
    statusCode: 400,
    code,
    details: { path }
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
    if (!project.status || !PROJECT_IMPORT_STATUSES.includes(String(project.status).toUpperCase())) {
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
      if (!feature.status || !FEATURE_IMPORT_STATUSES.includes(String(feature.status).toUpperCase())) {
        throwImportError("`status` de feature inválido.", `${featPath}.status`);
      }
      if (!feature.priority || !IMPORT_ALLOWED_PRIORITIES.includes(String(feature.priority).toUpperCase())) {
        throwImportError("`priority` de feature inválido. Permitido: LOW, MEDIUM, HIGH.", `${featPath}.priority`);
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
        if (!story.status || !STORY_IMPORT_STATUSES.includes(String(story.status).toUpperCase())) {
          throwImportError("`status` de story inválido.", `${storyPath}.status`);
        }
        if (!story.priority || !IMPORT_ALLOWED_PRIORITIES.includes(String(story.priority).toUpperCase())) {
          throwImportError("`priority` de story inválido. Permitido: LOW, MEDIUM, HIGH.", `${storyPath}.priority`);
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
      const projectName = String(projectData.name).trim();
      const existing = await projectsRepository.findByNameAndOrganization(projectName, organizationId);
      if (existing) {
        throwImportError(`Ya existe un proyecto con el nombre '${projectName}'.`, `projects[${pIdx}].project.name`);
      }

      maxProjectNumber += 1;
      const createdProject = await Project.create(
        {
          number: maxProjectNumber,
          name: projectName,
          description: projectData.description != null ? String(projectData.description) : "",
          status: String(projectData.status).toUpperCase(),
          organization_id: organizationId,
          created_by: context.user && context.user.id
        },
        { transaction: t }
      );
      summary.projects_created += 1;

      const features = Array.isArray(node.features) ? node.features : [];
      for (let fIdx = 0; fIdx < features.length; fIdx += 1) {
        const feature = features[fIdx];
        maxFeatureNumber += 1;
        const createdFeature = await Feature.create(
          {
            project_id: createdProject.id,
            number: maxFeatureNumber,
            title: String(feature.title).trim(),
            description: feature.description != null ? String(feature.description) : "",
            status: String(feature.status).toUpperCase(),
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
          await UserStory.create(
            {
              feature_id: createdFeature.id,
              number: maxStoryNumber,
              title: String(story.title).trim(),
              description: story.description != null ? String(story.description) : "",
              acceptance_criteria: Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria : null,
              implementation_criteria: Array.isArray(story.implementation_criteria) ? story.implementation_criteria : null,
              status: String(story.status).toUpperCase(),
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
  updateProject,
  deleteProject,
  deleteProjectsBulk,
  importProjects
};
