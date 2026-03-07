/**
 * Módulo ChangeRequest - Índice de modelos
 * Exporta definición para loadModels.
 */

const defineChangeRequestModel = require("./changeRequest.model");

function defineChangeRequestModels(sequelize) {
  const ChangeRequest = defineChangeRequestModel(sequelize);
  return { ChangeRequest };
}

module.exports = defineChangeRequestModels;
