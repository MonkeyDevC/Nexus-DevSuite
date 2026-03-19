/**
 * Implementation Steps — Helpers de UI (lista de pasos, acciones).
 * Reutiliza WorkOrdersUI.badgeClassStatus para estados.
 */
(function () {
  "use strict";

  var WorkOrdersUI = window.WorkOrdersUI;
  function esc(s) {
    return WorkOrdersUI && WorkOrdersUI.esc ? WorkOrdersUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  }

  window.StepsUI = {
    esc: esc
  };
})();
