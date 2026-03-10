/**
 * Módulo Backlog - Repositorio UserStory
 * Único punto de acceso a datos de user stories.
 */

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

async function create(payload) {
  const UserStory = getUserStoryModel();
  return UserStory.create(payload);
}

async function findById(id, options = {}) {
  const UserStory = getUserStoryModel();
  return UserStory.findByPk(id, options);
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

  const { rows, count } = await UserStory.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      { model: User, as: "assignee", attributes: ["id", "email", "name"], required: false },
      { model: Sprint, as: "sprint", attributes: ["id", "name"], required: false }
    ]
  });
  return { items: rows, total: count };
}

async function update(id, payload) {
  const UserStory = getUserStoryModel();
  const [affected] = await UserStory.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  create,
  findById,
  findByIdWithAssignee,
  listByFeature,
  update,
  getMaxStoryNumber,
  getStoryCountsByFeatureIds
};
