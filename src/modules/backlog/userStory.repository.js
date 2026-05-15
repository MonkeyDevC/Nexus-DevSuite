/**
 * Módulo Backlog - Repositorio UserStory
 * Único punto de acceso a datos de user stories.
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");

function getUserStoryModel() {
  const { UserStory } = getModels();
  if (!UserStory) throw new Error("Modelo UserStory no registrado en loadModels");
  return UserStory;
}

async function getMaxStoryNumber(featureId) {
  const UserStory = getUserStoryModel();
  const r = await UserStory.max("number", { where: { feature_id: featureId } });
  return r == null ? 0 : Number(r);
}

/** Máximo número de story en toda la aplicación (para IDs únicos globales US-1, US-2, ...). */
async function getMaxStoryNumberGlobal(transaction) {
  const UserStory = getUserStoryModel();
  const r = await UserStory.max("number", { transaction: transaction || undefined });
  return r == null ? 0 : Number(r);
}

/**
 * Devuelve { [featureId]: count } con el número de stories por feature.
 */
async function getStoryCountsByFeatureIds(featureIds) {
  if (!featureIds || featureIds.length === 0) return {};
  const { UserStory } = getModels();
  const { sequelize } = UserStory;
  const results = await UserStory.findAll({
    attributes: ["feature_id", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    where: { feature_id: featureIds },
    group: ["feature_id"],
    raw: true
  });
  const out = {};
  results.forEach(function (row) {
    out[row.feature_id] = Number(row.count) || 0;
  });
  return out;
}

/**
 * Devuelve { [featureId]: count } con el número de stories DONE por feature.
 */
async function getStoryDoneCountsByFeatureIds(featureIds) {
  if (!featureIds || featureIds.length === 0) return {};
  const { UserStory } = getModels();
  const { sequelize } = UserStory;
  const results = await UserStory.findAll({
    attributes: ["feature_id", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    where: { feature_id: featureIds, status: "DONE" },
    group: ["feature_id"],
    raw: true
  });
  const out = {};
  featureIds.forEach(function (fid) {
    out[fid] = 0;
  });
  results.forEach(function (row) {
    out[row.feature_id] = Number(row.count) || 0;
  });
  return out;
}

async function create(payload) {
  const UserStory = getUserStoryModel();
  return UserStory.create(payload);
}

async function findById(id, options = {}) {
  const UserStory = getUserStoryModel();
  return UserStory.findByPk(id, options);
}

async function findByNumber(number) {
  const UserStory = getUserStoryModel();
  const n = Number(number);
  if (!Number.isFinite(n) || n < 1) return null;
  return UserStory.findOne({ where: { number: n } });
}

async function findByIdWithAssignee(id) {
  const { UserStory, User, Sprint } = getModels();
  return UserStory.findByPk(id, {
    include: [
      { model: User, as: "assignee", attributes: ["id", "email", "name"], required: false },
      { model: Sprint, as: "sprint", attributes: ["id", "name"], required: false }
    ]
  });
}

async function listByFeature(featureId, { page = 1, limit = 10, status } = {}) {
  const { UserStory, User, Sprint } = getModels();
  const offset = (page - 1) * limit;
  const where = { feature_id: featureId };
  if (status) where.status = status;

  const sequelize = UserStory.sequelize;
  const { rows, count } = await UserStory.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      [sequelize.literal("(backlog_position IS NULL)"), "ASC"],
      ["backlog_position", "ASC"],
      [sequelize.literal("FIELD(priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW')"), "DESC"],
      ["created_at", "DESC"]
    ],
    include: [
      { model: User, as: "assignee", attributes: ["id", "email", "name"], required: false },
      { model: Sprint, as: "sprint", attributes: ["id", "name"], required: false }
    ]
  });
  return { items: rows, total: count };
}

/**
 * Product Backlog: lista stories del proyecto (vía feature.project_id).
 * Filtros opcionales: status, feature_id, sprint_id (null = sin asignar a sprint).
 */
async function listByProject(projectId, { page = 1, limit = 10, status, feature_id, sprint_id, assigned_to } = {}) {
  const { UserStory, User, Sprint, Feature } = getModels();
  const offset = (page - 1) * limit;
  const sequelize = UserStory.sequelize;
  const where = {
    [Op.or]: [
      { project_id: projectId, feature_id: null },
      sequelize.where(sequelize.col("feature.project_id"), projectId)
    ]
  };
  if (status) where.status = status;
  if (feature_id) where.feature_id = feature_id;
  if (sprint_id !== undefined && sprint_id !== "") {
    where.sprint_id = sprint_id === "null" || sprint_id === "unassigned" ? null : sprint_id;
  }
  if (assigned_to !== undefined && assigned_to !== "") {
    where.assigned_to = assigned_to === "null" || assigned_to === "unassigned" ? null : assigned_to;
  }
  const { rows, count } = await UserStory.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      [sequelize.literal("(UserStory.backlog_position IS NULL)"), "ASC"],
      ["backlog_position", "ASC"],
      [sequelize.literal("FIELD(UserStory.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW')"), "DESC"],
      ["created_at", "DESC"]
    ],
    include: [
      { model: Feature, as: "feature", attributes: ["id", "title"], required: false },
      { model: User, as: "assignee", attributes: ["id", "email", "name"], required: false },
      { model: Sprint, as: "sprint", attributes: ["id", "name"], required: false }
    ]
  });
  return { items: rows, total: count };
}

/**
 * Desasocia historias de una feature (mantiene project_id). Usado al eliminar feature.
 * @param {string} featureId
 */
async function unlinkStoriesFromFeature(featureId) {
  const UserStory = getUserStoryModel();
  await UserStory.update({ feature_id: null }, { where: { feature_id: featureId } });
}

async function update(id, payload) {
  const UserStory = getUserStoryModel();
  const [affected] = await UserStory.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

async function removeById(id) {
  const UserStory = getUserStoryModel();
  const deleted = await UserStory.destroy({ where: { id } });
  return deleted > 0;
}

module.exports = {
  create,
  findById,
  findByNumber,
  findByIdWithAssignee,
  listByFeature,
  listByProject,
  update,
  removeById,
  getMaxStoryNumber,
  getMaxStoryNumberGlobal,
  getStoryCountsByFeatureIds,
  getStoryDoneCountsByFeatureIds,
  unlinkStoriesFromFeature
};
