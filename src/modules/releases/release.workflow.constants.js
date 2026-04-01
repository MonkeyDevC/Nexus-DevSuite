/**
 * Mapa de transiciones permitidas de estado Release.
 * WAVE 4: RELEASED terminal (sin salidas). Se mantiene QA / ROLLED_BACK para datos históricos.
 */

const TRANSITION_MAP_RELEASE = {
  PLANNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["QA", "RELEASED"],
  QA: ["RELEASED", "ROLLED_BACK"],
  RELEASED: [],
  ROLLED_BACK: ["IN_PROGRESS"],
  ARCHIVED: []
};

module.exports = {
  TRANSITION_MAP_RELEASE
};
