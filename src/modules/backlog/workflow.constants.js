/**
 * Módulo Backlog - Constantes de workflow
 * Única fuente de verdad para transiciones permitidas. Sin lógica hardcodeada en services.
 */

const TRANSITION_MAP = {
  FEATURE: {
    DRAFT: ["APPROVED"],
    APPROVED: ["IN_PROGRESS"],
    IN_PROGRESS: ["DONE"],
    DONE: ["ARCHIVED"],
    ARCHIVED: []
  },
  STORY: {
    DRAFT: ["READY"],
    READY: ["IN_PROGRESS"],
    IN_PROGRESS: ["BLOCKED", "IN_REVIEW"],
    BLOCKED: ["IN_PROGRESS"],
    IN_REVIEW: ["DONE"],
    DONE: ["ARCHIVED"],
    ARCHIVED: []
  }
};

module.exports = {
  TRANSITION_MAP
};
