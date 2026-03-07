/**
 * Módulo Sprints - Índice de modelos
 * Exporta definición de Sprint para loadModels.
 */

const defineSprintModel = require("./sprint.model");

function defineSprintModels(sequelize) {
  const Sprint = defineSprintModel(sequelize);
  return { Sprint };
}

module.exports = defineSprintModels;
