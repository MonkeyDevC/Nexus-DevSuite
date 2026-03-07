/**
 * Módulo Improvements - Constantes de workflow
 */

const TRANSITION_MAP_IMPROVEMENT = {
  DRAFT: ["PROPOSED"],
  PROPOSED: ["APPROVED", "REJECTED"],
  APPROVED: ["IMPLEMENTED"],
  REJECTED: [],
  IMPLEMENTED: []
};

module.exports = {
  TRANSITION_MAP_IMPROVEMENT
};
