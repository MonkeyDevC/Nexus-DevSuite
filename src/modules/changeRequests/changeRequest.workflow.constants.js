/**
 * Módulo ChangeRequest - Mapa de transiciones permitidas.
 * DRAFT → SUBMITTED; SUBMITTED → APPROVED | REJECTED | DRAFT;
 * APPROVED → IMPLEMENTED | DRAFT; REJECTED → DRAFT.
 * IMPLEMENTED sin salida.
 */

const TRANSITION_MAP_CR = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["IMPLEMENTED", "DRAFT"],
  REJECTED: ["DRAFT"],
  IMPLEMENTED: []
};

module.exports = {
  TRANSITION_MAP_CR
};
