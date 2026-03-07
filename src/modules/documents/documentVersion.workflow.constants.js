/**
 * Módulo Documents - Constantes de workflow DocumentVersion
 */

const TRANSITION_MAP_DOCUMENT_VERSION = {
  DRAFT: ["APPROVED"],
  APPROVED: ["ARCHIVED"],
  ARCHIVED: []
};

module.exports = {
  TRANSITION_MAP_DOCUMENT_VERSION
};
