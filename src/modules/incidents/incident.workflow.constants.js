/**
 * Módulo Incidents - Constantes de workflow
 */

const TRANSITION_MAP_INCIDENT = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: []
};

module.exports = {
  TRANSITION_MAP_INCIDENT
};
