/**
 * Módulo Releases - Índice de modelos
 * Exporta Release y ReleaseFeature para loadModels.
 */

const defineReleaseModel = require("./release.model");
const defineReleaseFeatureModel = require("./releaseFeature.model");

function defineReleaseModels(sequelize) {
  const Release = defineReleaseModel(sequelize);
  const ReleaseFeature = defineReleaseFeatureModel(sequelize);
  return { Release, ReleaseFeature };
}

module.exports = defineReleaseModels;
