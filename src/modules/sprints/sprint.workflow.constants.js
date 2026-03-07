/**
 * Módulo Sprints - Constantes de workflow
 * Única fuente de verdad para transiciones permitidas de Sprint.
 */

const TRANSITION_MAP_SPRINT = {
  PLANNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["CLOSED"],
  CLOSED: []
};

module.exports = {
  TRANSITION_MAP_SPRINT
};
