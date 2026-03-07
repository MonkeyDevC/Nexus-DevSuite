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

async function create(payload) {
  const UserStory = getUserStoryModel();
  return UserStory.create(payload);
}

async function findById(id, options = {}) {
  const UserStory = getUserStoryModel();
  return UserStory.findByPk(id, options);
}

async function listByFeature(featureId, { page = 1, limit = 10, status } = {}) {
  const UserStory = getUserStoryModel();
  const offset = (page - 1) * limit;
  const where = { feature_id: featureId };
  if (status) where.status = status;

  const { rows, count } = await UserStory.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
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
  listByFeature,
  update
};
