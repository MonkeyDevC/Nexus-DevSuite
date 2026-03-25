/**
 * ----
 * Módulo: Vista Under Construction
 * Descripción: Renderiza una pantalla segura para rutas incompletas durante la fase de estabilización.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */
(function () {
  "use strict";

  function renderUnderConstructionView() {
    var html = "";
    if (typeof window.renderBreadcrumbs === "function") {
      html += window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "En construcción", href: "#/under-construction" }
      ]);
    }
    html += '<section class="nui-card" style="max-width:900px;margin:0 auto;">';
    html += '<div class="nui-card-body p-4 p-md-5 text-center">';
    html += '<h1 class="nui-title-lg mb-3">Módulo en construcción</h1>';
    html += '<p class="text-muted mb-4">Esta sección está temporalmente deshabilitada durante la fase de estabilización del sistema.</p>';
    html += '<a href="#/dashboard" class="btn btn-nexus-primary btn-sm">Volver al panel</a>';
    html += "</div></section>";
    if (typeof window.setContent === "function") window.setContent(html);
  }

  window.registerView("under-construction", renderUnderConstructionView);
})();
