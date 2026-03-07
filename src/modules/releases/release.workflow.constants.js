/**
 * Módulo Releases - Mapa de transiciones permitidas de estado.
 * ARCHIVED no tiene transiciones salientes (bloqueo total).
 */

const TRANSITION_MAP_RELEASE = {
  PLANNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["QA"],
  QA: ["RELEASED", "ROLLED_BACK"],
  RELEASED: ["ARCHIVED"],
  ROLLED_BACK: ["IN_PROGRESS"],
  ARCHIVED: []
};

module.exports = {
  TRANSITION_MAP_RELEASE
};
