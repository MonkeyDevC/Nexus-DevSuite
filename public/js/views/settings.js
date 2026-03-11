/**
 * Ajustes del sistema — Solo MASTER. #/settings
 * Parámetros básicos: roles, estados de sprint, proyecto, release, feature, story, incidente.
 */
(function () {
  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderSection(title, tableHeaders, rows) {
    var html = '<div class="nexus-panel nexus-section-spacing mb-4">';
    html += '<h2 class="nexus-font-semibold mb-3">' + esc(title) + "</h2>";
    html += '<div class="table-responsive"><table class="table table-sm table-hover nexus-table">';
    html += "<thead><tr>";
    tableHeaders.forEach(function (h) {
      html += "<th scope=\"col\">" + esc(h) + "</th>";
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function (row) {
      html += "<tr>";
      row.forEach(function (cell) {
        html += "<td>" + (typeof cell === "string" ? esc(cell) : cell) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div></div>";
    return html;
  }

  window.registerView("settings", async function () {
    await window.showNav();
    var user = await window.getMe();
    if (!user || user.role !== "MASTER") {
      window.location.hash = "#/dashboard";
      return;
    }

    window.setContent(window.showLoading());

    var roles = [];
    try {
      var rolesRes = await window.fetchApi("/auth/roles");
      if (rolesRes && rolesRes.success && rolesRes.data && Array.isArray(rolesRes.data)) {
        roles = rolesRes.data;
      }
    } catch (e) {}

    var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Ajustes del sistema", href: "" }]);
    html += '<h1 class="nexus-page-title">Ajustes del sistema</h1>';
    html += '<p class="nexus-text-secondary mb-4">Parámetros básicos del sistema: roles y estados permitidos en cada módulo.</p>';

    // Accesos rápidos a administración (solo MASTER)
    html += '<div class="nexus-panel nexus-section-spacing mb-4">';
    html += '<h2 class="nexus-font-semibold mb-3">Administración</h2>';
    html += '<ul class="list-unstyled mb-0">';
    html += '<li class="mb-2"><a href="#/admin/organization" class="btn btn-nexus-secondary btn-sm">Gestionar organización</a></li>';
    html += '<li><a href="#/admin/users" class="btn btn-nexus-secondary btn-sm">Gestionar usuarios</a></li>';
    html += '</ul></div>';

    // Roles del sistema (desde API)
    var roleRows = roles.length
      ? roles.map(function (r) {
          return [esc(r.name), esc(r.description || "—")];
        })
      : [["—", "No hay roles o no se pudieron cargar."]];
    html += renderSection("Roles del sistema", ["Nombre", "Descripción"], roleRows);

    // Estados de sprint
    var sprintStatuses = [
      ["PLANNED", "Planificado"],
      ["IN_PROGRESS", "En progreso"],
      ["CLOSED", "Cerrado"]
    ];
    html += renderSection(
      "Estados de sprint",
      ["Código", "Descripción"],
      sprintStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    // Estados de proyecto
    var projectStatuses = [
      ["ACTIVE", "Activo"],
      ["ARCHIVED", "Archivado"]
    ];
    html += renderSection(
      "Estados de proyecto",
      ["Código", "Descripción"],
      projectStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    // Estados de release
    var releaseStatuses = [
      ["PLANNED", "Planificado"],
      ["IN_PROGRESS", "En progreso"],
      ["QA", "En pruebas"],
      ["RELEASED", "Publicado"],
      ["ROLLED_BACK", "Revocado"],
      ["ARCHIVED", "Archivado"]
    ];
    html += renderSection(
      "Estados de release",
      ["Código", "Descripción"],
      releaseStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    // Estados de feature
    var featureStatuses = [
      ["DRAFT", "Borrador"],
      ["APPROVED", "Aprobado"],
      ["IN_PROGRESS", "En progreso"],
      ["DONE", "Hecho"],
      ["ARCHIVED", "Archivado"]
    ];
    html += renderSection(
      "Estados de feature",
      ["Código", "Descripción"],
      featureStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    // Estados de user story
    var storyStatuses = [
      ["DRAFT", "Borrador"],
      ["READY", "Lista"],
      ["IN_PROGRESS", "En progreso"],
      ["BLOCKED", "Bloqueada"],
      ["IN_REVIEW", "En revisión"],
      ["DONE", "Hecha"],
      ["ARCHIVED", "Archivada"]
    ];
    html += renderSection(
      "Estados de user story",
      ["Código", "Descripción"],
      storyStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    // Estados de incidente
    var incidentStatuses = [
      ["OPEN", "Abierto"],
      ["IN_PROGRESS", "En progreso"],
      ["RESOLVED", "Resuelto"],
      ["CLOSED", "Cerrado"]
    ];
    html += renderSection(
      "Estados de incidente",
      ["Código", "Descripción"],
      incidentStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    // Estados de documento / versión
    var docStatuses = [
      ["DRAFT", "Borrador"],
      ["APPROVED", "Aprobado"],
      ["ARCHIVED", "Archivado"]
    ];
    html += renderSection(
      "Estados de documento / versión",
      ["Código", "Descripción"],
      docStatuses.map(function (s) { return [s[0], s[1]]; })
    );

    window.setContent(html);
  });
})();
