/**
 * Módulo Releases - Índice de modelos
 * Exporta definición de Release para loadModels.
 */

const defineReleaseModel = require("./release.model");

function defineReleaseModels(sequelize) {
  const Release = defineReleaseModel(sequelize);
  return { Release };
}

module.exports = defineReleaseModels;
