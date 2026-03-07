/**
 * Módulo ChangeRequest - Mapa de transiciones permitidas.
 * DRAFT → SUBMITTED; SUBMITTED → APPROVED | REJECTED; APPROVED → IMPLEMENTED.
 * REJECTED e IMPLEMENTED sin salida.
 */

const TRANSITION_MAP_CR = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: ["IMPLEMENTED"],
  REJECTED: [],
  IMPLEMENTED: []
};

module.exports = {
  TRANSITION_MAP_CR
};
