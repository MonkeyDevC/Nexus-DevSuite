/**
 * Dashboard — ETAPA 13: Rediseño según wireframe.
 * Breadcrumb, Welcome [User], 4 tarjetas de métricas, My Assignments, Project Health, Recent Activity, Recent Projects.
 * Design system Etapa 12. Solo GET /projects y GET /auth/me.
 */
(function () {
  window.registerView("dashboard", async function () {
    await window.showNav();
    window.setContent(window.showLoading());

    const user = await window.getMe();
    const userName = user ? (user.name || user.email || "Usuario") : "Usuario";

    const breadcrumb = window.renderBreadcrumbs
      ? window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Panel", href: "" }])
      : '<nav aria-label="breadcrumb"><ol class="breadcrumb mb-2"><li class="breadcrumb-item"><a href="#/dashboard">Panel</a></li><li class="breadcrumb-item text-muted">Panel</li></ol></nav>';

    let titleHtml = '<h1 class="nexus-page-title">Bienvenido, ' + escapeHtml(userName) + " | Panel</h1>";

    const body = await window.fetchApi("/projects");
    const projects = body && body.success && body.data
      ? (body.data.items || (Array.isArray(body.data) ? body.data : body.data.data || []) || [])
      : [];
    const activeProjects = projects.filter(function (p) { return (p.status || "").toUpperCase() === "ACTIVE"; });
    const activeCount = activeProjects.length;
    const totalCount = projects.length;

    const metricCards = [
      {
        title: "Proyectos activos",
        value: String(activeCount),
        link: "#/projects",
        linkText: "Ver proyectos",
        optional: totalCount > 0 ? "(" + totalCount + " en total)" : ""
      },
      {
        title: "Stories abiertas",
        value: "—",
        link: "#/stories",
        linkText: "Ver stories",
        optional: "placeholder"
      },
      {
        title: "Progreso del sprint",
        value: "75%",
        link: "#/sprints",
        linkText: "Ver sprints",
        progress: 75,
        optional: "placeholder"
      },
      {
        title: "Incidentes críticos",
        value: "—",
        link: "#/incidents",
        linkText: "Ver incidentes",
        icon: "&#9888;",
        optional: "placeholder"
      }
    ];

    let cardsHtml = '<div class="row g-4 mb-4">';
    metricCards.forEach(function (m) {
      cardsHtml += '<div class="col-sm-6 col-lg-3">';
      cardsHtml += '<div class="nexus-card h-100 d-flex flex-column">';
      cardsHtml += '<div class="nexus-text-secondary nexus-text-sm">' + escapeHtml(m.title) + "</div>";
      cardsHtml += '<div class="nexus-font-semibold nexus-text-lg mt-1">' + (m.icon || "") + " " + escapeHtml(m.value) + "</div>";
      if (m.progress !== undefined) {
        cardsHtml += '<div class="progress mt-2" style="height:6px"><div class="progress-bar" role="progressbar" style="width:' + m.progress + '%" aria-valuenow="' + m.progress + '" aria-valuemin="0" aria-valuemax="100"></div></div>';
      }
      cardsHtml += '<a href="' + m.link + '" class="nexus-text-sm mt-2">' + escapeHtml(m.linkText) + "</a>";
      cardsHtml += "</div></div>";
    });
    cardsHtml += "</div>";

    const myAssignmentsHtml = buildMyAssignmentsSection();
    const activeSprintHtml = buildActiveSprintSection();
    const projectHealthHtml = buildProjectHealthSection(projects);
    const recentActivityHtml = buildRecentActivitySection();
    const recentProjectsHtml = buildRecentProjectsSection(projects);

    const html =
      breadcrumb +
      titleHtml +
      cardsHtml +
      '<div class="nexus-section-spacing">' + myAssignmentsHtml + "</div>" +
      '<div class="nexus-section-spacing">' + activeSprintHtml + "</div>" +
      '<div class="nexus-section-spacing">' + projectHealthHtml + "</div>" +
      '<div class="nexus-section-spacing">' + recentActivityHtml + "</div>" +
      '<div class="nexus-section-spacing">' + recentProjectsHtml + "</div>";

    window.setContent(html);
    bindPagination();
  });

  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function buildMyAssignmentsSection() {
    const tabs = [
      { id: "all", label: "Todos", active: true },
      { id: "stories", label: "Mis stories", active: false },
      { id: "bugs", label: "Bugs", active: false }
    ];
    let html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Mis asignaciones</h2>';
    html += '<ul class="nav nav-tabs mb-3">';
    tabs.forEach(function (t) {
      html += '<li class="nav-item"><a class="nav-link' + (t.active ? " active" : "") + '" href="#" data-tab="' + t.id + '">' + escapeHtml(t.label) + "</a></li>";
    });
    html += "</ul>";
    html += '<input type="search" class="form-control form-control-sm mb-3 nexus-input" placeholder="Buscar..." style="max-width:240px">';
    html += '<div class="table-responsive"><table class="table table-sm nexus-table">';
    html += "<thead><tr><th>ID</th><th>Tipo</th><th>Título</th><th>Prioridad</th><th>Estado</th><th>Fecha límite</th></tr></thead><tbody>";
    html += "<tr><td colspan=\"6\" class=\"text-muted text-center py-4\">No hay asignaciones (placeholder).</td></tr>";
    html += "</tbody></table></div>";
    html += '<nav class="mt-2"><ul class="pagination pagination-sm"><li class="page-item disabled"><span class="page-link">&lt;</span></li><li class="page-item active"><span class="page-link">1</span></li><li class="page-item disabled"><span class="page-link">&gt;</span></li></ul></nav>';
    html += "</div>";
    return html;
  }

  function buildActiveSprintSection() {
    let html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Estado del sprint activo</h2>';
    html += '<div class="border rounded p-4 text-center nexus-text-muted" style="min-height:120px">';
    html += "<p>Gráfico de área (placeholder)</p>";
    html += '<div class="progress mb-2"><div class="progress-bar" style="width:60%">Horas restantes</div></div>';
    html += '<div class="progress"><div class="progress-bar bg-secondary" style="width:40%">Miembro del equipo</div></div>';
    html += "</div></div>";
    return html;
  }

  function buildProjectHealthSection(projects) {
    let html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Estado de los proyectos</h2>';
    html += '<div class="table-responsive"><table class="table table-sm nexus-table">';
    html += "<thead><tr><th>Proyecto</th><th>Estado</th><th>Progreso</th></tr></thead><tbody>";
    if (projects.length === 0) {
      html += "<tr><td colspan=\"3\" class=\"text-muted text-center py-4\">No hay proyectos.</td></tr>";
    } else {
      projects.slice(0, 10).forEach(function (p) {
        const name = p.name || p.key || p.id || "—";
        const status = (p.status || "").toUpperCase();
        const statusLabel = status === "ACTIVE" ? "Saludable" : status === "ARCHIVED" ? "Archivado" : "En riesgo";
        const progress = p.progress != null ? p.progress : (status === "ACTIVE" ? 50 : 0);
        html += "<tr>";
        html += "<td><a href=\"#/projects/" + (p.id || "") + "\">" + escapeHtml(name) + "</a></td>";
        html += "<td><span class=\"nexus-badge nexus-badge-" + (status ? status.toLowerCase().replace("_", "-") : "archived") + "\">" + escapeHtml(statusLabel) + "</span></td>";
        html += "<td><div class=\"progress\" style=\"height:8px;width:80px\"><div class=\"progress-bar\" style=\"width:" + progress + "%\"></div></div></td>";
        html += "</tr>";
      });
    }
    html += "</tbody></table></div></div>";
    return html;
  }

  function buildRecentActivitySection() {
    let html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Actividad reciente</h2>';
    html += '<ul class="list-unstyled mb-0">';
    html += '<li class="d-flex gap-2 py-2 border-bottom"><span class="nexus-text-muted">&#128100;</span><div><span>Implementar nuevo flujo de login</span><br><span class="nexus-text-sm nexus-text-muted">hace 1 mes</span></div></li>';
    html += '<li class="d-flex gap-2 py-2 border-bottom"><span class="nexus-text-muted">&#128100;</span><div><span>Configuración del proyecto</span><br><span class="nexus-text-sm nexus-text-muted">hace 2 meses</span></div></li>';
    html += '<li class="d-flex gap-2 py-2"><span class="nexus-text-muted">&#128100;</span><div><span>Actividad de ejemplo</span><br><span class="nexus-text-sm nexus-text-muted">—</span></div></li>';
    html += "</ul></div>";
    return html;
  }

  function buildRecentProjectsSection(projects) {
    let html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Proyectos recientes</h2>';
    if (projects.length === 0) {
      html += '<div class="nexus-empty-state">';
      html += '<p class="nexus-empty-state-title">Aún no hay proyectos</p>';
      html += '<p class="nexus-text-secondary">Cree su primer proyecto para comenzar.</p>';
      html += '<a href="#/projects" class="btn btn-nexus-primary">Crear proyecto</a>';
      html += "</div>";
    } else {
      html += '<ul class="list-group list-group-flush">';
      projects.slice(0, 8).forEach(function (p) {
        const status = (p.status || "").toUpperCase();
        const badgeClass = status === "ACTIVE" ? "nexus-badge-active" : "nexus-badge-archived";
        html += '<li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">';
        html += '<a href="#/projects/' + (p.id || "") + '">' + escapeHtml(p.name || p.key || p.id) + "</a>";
        html += '<span class="nexus-badge ' + badgeClass + '">' + (status || "—") + "</span>";
        html += "</li>";
      });
      html += "</ul>";
      html += '<a href="#/projects" class="btn btn-nexus-secondary btn-sm mt-2">Ver todos los proyectos</a>';
    }
    html += "</div>";
    return html;
  }

  function bindPagination() {
    document.querySelectorAll("[data-page]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var page = parseInt(el.getAttribute("data-page"), 10);
        if (page >= 1) window.location.hash = "#/dashboard";
      });
    });
  }
})();
