/**
 * Code Deliveries — Helpers de UI (tabla).
 * Reutiliza WorkOrdersUI.deliveriesTableRows y badgeClassStatus.
 */
(function () {
  "use strict";

  window.DeliveriesUI = window.WorkOrdersUI ? {
    deliveriesTableRows: window.WorkOrdersUI.deliveriesTableRows,
    badgeClassStatus: window.WorkOrdersUI.badgeClassStatus
  } : {};
})();
