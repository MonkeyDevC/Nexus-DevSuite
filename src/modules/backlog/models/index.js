/**
 * Módulo Backlog - Índice de modelos
 * Exporta definiciones de Project, Feature, UserStory para loadModels.
 */

const defineProjectModel = require("./project.model");
const defineFeatureModel = require("./feature.model");
const defineUserStoryModel = require("./userStory.model");

function defineBacklogModels(sequelize) {
  const Project = defineProjectModel(sequelize);
  const Feature = defineFeatureModel(sequelize);
  const UserStory = defineUserStoryModel(sequelize);

  return {
    Project,
    Feature,
    UserStory
  };
}

module.exports = defineBacklogModels;
