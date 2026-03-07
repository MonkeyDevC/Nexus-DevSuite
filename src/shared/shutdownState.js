/**
 * -------------------------------------------------------------
 * Módulo: Estado de shutdown
 * Descripción: Flag compartido para cierre ordenado. Evita doble ejecución y permite middleware 503.
 * -------------------------------------------------------------
 */

let isShuttingDown = false;

function getIsShuttingDown() {
  return isShuttingDown;
}

function setIsShuttingDown(value) {
  isShuttingDown = !!value;
}

module.exports = {
  getIsShuttingDown,
  setIsShuttingDown
};
