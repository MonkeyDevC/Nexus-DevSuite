/**
 * Módulo Improvements - Índice de modelos
 */

const defineImprovementModel = require("./improvement.model");

function defineImprovementModels(sequelize) {
  const Improvement = defineImprovementModel(sequelize);
  return { Improvement };
}

module.exports = defineImprovementModels;
