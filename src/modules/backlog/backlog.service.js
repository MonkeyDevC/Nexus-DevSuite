/**
 * Módulo Backlog - Servicio de Product Backlog profesional
 * Agrupa features y stories del proyecto con progreso y orden por prioridad/posición.
 */

const projectsRepository = require("./projects.repository");
const featureRepository = require("./feature.repository");
const userStoryRepository = require("./userStory.repository");
const featureService = require("./feature.service");
const userStoryService = require("./userStory.service");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

/**
 * Reordena features y/o stories del backlog del proyecto.
 * feature_ids: array de UUIDs de features (orden = backlog_position 0, 1, 2, ...)
 * story_ids: array de UUIDs de stories (orden = backlog_position 0, 1, 2, ...)
 */
async function reorderProjectBacklog(projectId, { feature_ids = [], story_ids = [] }, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);

  if (feature_ids.length > 0) {
    for (let i = 0; i < feature_ids.length; i++) {
      const f = await featureRepository.findById(feature_ids[i]);
      if (!f || f.project_id !== projectId) continue;
      await featureRepository.update(feature_ids[i], { backlog_position: i });
    }
  }

  if (story_ids.length > 0) {
    for (let i = 0; i < story_ids.length; i++) {
      const st = await userStoryRepository.findById(story_ids[i]);
      if (!st) continue;
      let inProject = st.project_id === projectId;
      if (!inProject && st.feature_id) {
        const feat = await featureRepository.findById(st.feature_id);
        inProject = Boolean(feat && feat.project_id === projectId);
      }
      if (!inProject) continue;
      await userStoryRepository.update(story_ids[i], { backlog_position: i });
    }
  }

  return { reordered: true, features: feature_ids.length, stories: story_ids.length };
}

/**
 * Devuelve el Product Backlog del proyecto: features con progreso y stories con filtros.
 * Respuesta: { features: [...], stories: [...], meta: { totalFeatures, totalStories } }
 */
async function getProjectBacklog(projectId, options = {}, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    throw new AppError("Proyecto no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.PROJECT_NOT_FOUND
    });
  }
  featureService.ensureProjectInOrg(project, organizationId);

  const {
    page = 1,
    limit = 100,
    status,
    feature_id,
    sprint_id,
    assigned_to,
    labels
  } = options;

  const featurePage = Math.max(1, parseInt(page, 10) || 1);
  const featureLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const storyPage = Math.max(1, parseInt(page, 10) || 1);
  const storyLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const [featureResult, storyResult] = await Promise.all([
    featureRepository.listByProject(projectId, {
      page: featurePage,
      limit: featureLimit
    }),
    userStoryRepository.listByProject(projectId, {
      page: storyPage,
      limit: storyLimit,
      status: status && ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"].includes(status) ? status : undefined,
      feature_id: feature_id || undefined,
      sprint_id: sprint_id !== undefined && sprint_id !== "" ? sprint_id : undefined,
      assigned_to: assigned_to !== undefined && assigned_to !== "" ? assigned_to : undefined
    })
  ]);

  const featureIds = featureResult.items.map((f) => f.id);
  const [totalByFeature, doneByFeature] = await Promise.all([
    userStoryRepository.getStoryCountsByFeatureIds(featureIds),
    userStoryRepository.getStoryDoneCountsByFeatureIds(featureIds)
  ]);

  const features = featureResult.items.map((f) => {
    const total = totalByFeature[f.id] || 0;
    const done = doneByFeature[f.id] || 0;
    const progress_pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const plain = typeof f.toJSON === "function" ? f.toJSON() : f;
    return {
      id: plain.id,
      project_id: plain.project_id,
      title: plain.title,
      description: plain.description,
      status: plain.status,
      priority: plain.priority,
      backlog_position: plain.backlog_position,
      release_id: plain.release_id,
      stories_total: total,
      stories_done: done,
      progress_pct,
      created_at: plain.created_at,
      updated_at: plain.updated_at
    };
  });

  let stories = storyResult.items.map((s) => userStoryService.toPlain(s));
  if (labels && Array.isArray(labels) && labels.length > 0) {
    const set = new Set(labels.map((l) => String(l).toLowerCase()));
    stories = stories.filter((s) => {
      const storyLabels = Array.isArray(s.labels) ? s.labels : (s.labels ? [s.labels] : []);
      return storyLabels.some((l) => set.has(String(l).toLowerCase()));
    });
  }

  return {
    features,
    stories,
    meta: {
      totalFeatures: featureResult.total,
      totalStories: storyResult.total,
      page: storyPage,
      limit: storyLimit,
      totalPages: Math.ceil(storyResult.total / storyLimit)
    }
  };
}

module.exports = {
  getProjectBacklog,
  reorderProjectBacklog
};
