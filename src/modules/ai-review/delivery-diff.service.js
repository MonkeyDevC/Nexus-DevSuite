/**
 * ----
 * Módulo: AI Review Delivery Diff Stub
 * Descripción: Stub seguro para evitar MODULE_NOT_FOUND en flujos de AI Review no críticos durante estabilización.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { buildFeatureDisabledResponse } = require("../../config/optionalModules");

async function getDeliveryDiff() {
  return buildFeatureDisabledResponse("ai-review", {
    diff: "",
    files: [],
    meta: {
      source: "stabilization_stub"
    }
  });
}

module.exports = {
  getDeliveryDiff
};
