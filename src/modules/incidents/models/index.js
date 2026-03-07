/**
 * Módulo Incidents - Índice de modelos
 */

const defineIncidentModel = require("./incident.model");

function defineIncidentModels(sequelize) {
  const Incident = defineIncidentModel(sequelize);
  return { Incident };
}

module.exports = defineIncidentModels;
