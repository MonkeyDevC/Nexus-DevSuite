/**
 * Dashboard — Conectado a datos reales.
 * GET /dashboard/summary, GET /projects, GET /reports/users/:userId/activity.
 */
(function () {
  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return "—";
    var d = new Date(dateStr);
    var now = new Date();
    var diffMs = now - d;
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMs / 3600000);
    var diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "hace un momento";
    if (diffMins < 60) return "hace " + diffMins + " min";
    if (diffHours < 24) return "hace " + diffHours + " h";
    if (diffDays === 1) return "ayer";
    if (diffDays < 30) return "hace " + diffDays + " días";
    return d.toLocaleDateString();
  }

  window.registerView("dashboard", async function () {
    await window.showNav();
    window.setContent(window.showLoading());

    var user = await window.getMe();
    var userId = user ? user.id : null;
    var userName = user ? (user.name || user.email || "Usuario") : "Usuario";

    var breadcrumb = window.renderBreadcrumbs
      ? window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Panel", href: "" }])
      : '<nav aria-label="breadcrumb"><ol class="breadcrumb mb-2"><li class="breadcrumb-item"><a href="#/dashboard">Panel</a></li><li class="breadcrumb-item text-muted">Panel</li></ol></nav>';
    var titleHtml = '<h1 class="nexus-page-title">Bienvenido, ' + escapeHtml(userName) + " | Panel</h1>";

    var summary = { projectsActive: 0, projectsTotal: 0, storiesTotal: 0, activeSprint: null, criticalIncidentsCount: 0, myAssignments: [] };
    var projects = [];
    var recentActivity = [];

    var projectsPromise = window.fetchApi("/projects").then(function (body) {
      if (body && body.success && body.data) {
        var data = body.data;
        projects = data.items || (Array.isArray(data) ? data : data.data || []) || [];
      }
      return projects;
    });

    var summaryPromise = window.fetchApi("/dashboard/summary").then(function (body) {
      if (body && body.success && body.data) summary = body.data;
      return summary;
    });

    var activityPromise = userId
      ? window.fetchApi("/reports/users/" + userId + "/activity?limit=5").then(function (body) {
          if (body && body.success && body.data && body.data.auditLogs) recentActivity = body.data.auditLogs;
          return recentActivity;
        })
      : Promise.resolve([]);

    await Promise.all([projectsPromise, summaryPromise, activityPromise]);

    var metricCards = [
      {
        title: "Proyectos activos",
        value: String(summary.projectsActive || 0),
        link: "#/projects",
        linkText: "Ver proyectos",
        optional: (summary.projectsTotal || 0) > 0 ? "(" + summary.projectsTotal + " en total)" : ""
      },
      {
        title: "Stories",
        value: String(summary.storiesTotal != null ? summary.storiesTotal : "—"),
        link: "#/stories",
        linkText: "Ver stories"
      },
      {
        title: "Progreso del sprint",
        value: summary.activeSprint && summary.activeSprint.progressPercent != null ? summary.activeSprint.progressPercent + "%" : "—",
        link: "#/sprints",
        linkText: "Ver sprints",
        progress: summary.activeSprint && summary.activeSprint.progressPercent != null ? summary.activeSprint.progressPercent : 0
      },
      {
        title: "Incidentes críticos",
        value: String(summary.criticalIncidentsCount != null ? summary.criticalIncidentsCount : "—"),
        link: "#/incidents",
        linkText: "Ver incidentes",
        icon: "&#9888;"
      }
    ];

    var cardsHtml = '<div class="row g-4 mb-4">';
    metricCards.forEach(function (m) {
      cardsHtml += '<div class="col-sm-6 col-lg-3">';
      cardsHtml += '<div class="nexus-card h-100 d-flex flex-column">';
      cardsHtml += '<div class="nexus-text-secondary nexus-text-sm">' + escapeHtml(m.title) + "</div>";
      cardsHtml += '<div class="nexus-font-semibold nexus-text-lg mt-1">' + (m.icon || "") + " " + escapeHtml(String(m.value)) + "</div>";
      if (m.progress !== undefined && m.progress > 0) {
        cardsHtml += '<div class="progress mt-2" style="height:6px"><div class="progress-bar" role="progressbar" style="width:' + Number(m.progress) + '%" aria-valuenow="' + m.progress + '" aria-valuemin="0" aria-valuemax="100"></div></div>';
      }
      cardsHtml += '<a href="' + m.link + '" class="nexus-text-sm mt-2">' + escapeHtml(m.linkText) + "</a>";
      cardsHtml += "</div></div>";
    });
    cardsHtml += "</div>";

    var myAssignmentsHtml = buildMyAssignmentsSection(summary.myAssignments || []);
    var activeSprintHtml = buildActiveSprintSection(summary.activeSprint);
    var projectHealthHtml = buildProjectHealthSection(projects);
    var recentActivityHtml = buildRecentActivitySection(recentActivity);
    var recentProjectsHtml = buildRecentProjectsSection(projects);

    var html =
      breadcrumb +
      titleHtml +
      cardsHtml +
      '<div class="nexus-section-spacing">' + myAssignmentsHtml + "</div>" +
      '<div class="nexus-section-spacing">' + activeSprintHtml + "</div>" +
      '<div class="nexus-section-spacing">' + projectHealthHtml + "</div>" +
      '<div class="nexus-section-spacing">' + recentActivityHtml + "</div>" +
      '<div class="nexus-section-spacing">' + recentProjectsHtml + "</div>";

    window.setContent(html);
    bindMyAssignmentsSearch();
  });

  function buildMyAssignmentsSection(assignments) {
    var html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Mis asignaciones</h2>';
    html += '<input type="search" class="form-control form-control-sm mb-3 nexus-input dashboard-assignments-search" placeholder="Buscar por título o ID..." style="max-width:280px" aria-label="Buscar asignaciones">';
    html += '<div class="table-responsive"><table class="table table-sm nexus-table">';
    html += "<thead><tr><th>ID</th><th>Tipo</th><th>Título</th><th>Prioridad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>";
    if (!assignments || assignments.length === 0) {
      html += "<tr><td colspan=\"6\" class=\"text-muted text-center py-4\">No hay asignaciones.</td></tr>";
    } else {
      assignments.forEach(function (a) {
        var idDisplay = a.number != null ? "US-" + a.number : (a.id ? String(a.id).slice(0, 8) : "—");
        var badgeClass = window.nexusBadgeClass ? window.nexusBadgeClass(a.status) : "nexus-badge-draft";
        var storyId = a.id || a.story_id || "";
        html += "<tr class=\"dashboard-assignment-row\" data-title=\"" + escapeHtml((a.title || "").toLowerCase()) + "\" data-id=\"" + escapeHtml(String(idDisplay).toLowerCase()) + "\">";
        html += "<td><a href=\"#/stories?feature=" + (a.feature_id || "") + "\">" + escapeHtml(idDisplay) + "</a></td>";
        html += "<td>Story</td>";
        html += "<td>" + escapeHtml(a.title || "—") + "</td>";
        html += "<td>" + escapeHtml(a.priority || "—") + "</td>";
        html += "<td><span class=\"" + badgeClass + "\">" + escapeHtml(a.status || "") + "</span></td>";
        html += "<td>" + (storyId ? "<a href=\"#/stories?story=" + escapeHtml(storyId) + "\" class=\"btn btn-nexus-secondary btn-sm\" aria-label=\"Ver story " + escapeHtml((a.title || idDisplay).slice(0, 50)) + "\">Ver</a>" : "") + "</td>";
        html += "</tr>";
      });
    }
    html += "</tbody></table></div></div>";
    return html;
  }

  function buildActiveSprintSection(activeSprint) {
    var html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Estado del sprint activo</h2>';
    if (!activeSprint || !activeSprint.id) {
      html += '<div class="border rounded p-4 text-center nexus-text-muted" style="min-height:100px"><p class="mb-0">No hay sprint activo.</p><a href="#/sprints" class="btn btn-nexus-secondary btn-sm mt-2" aria-label="Ver listado de sprints">Ver sprints</a></div>';
    } else {
      var pct = activeSprint.progressPercent != null ? activeSprint.progressPercent : 0;
      html += '<div class="border rounded p-4" style="min-height:100px">';
      html += '<p class="mb-2"><strong>' + escapeHtml(activeSprint.name || "Sprint activo") + "</strong></p>";
      html += '<div class="progress" style="height:10px"><div class="progress-bar" role="progressbar" style="width:' + pct + '%" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' + pct + "%</div></div>";
      html += '<a href="#/sprints/' + escapeHtml(activeSprint.id) + '" class="btn btn-nexus-secondary btn-sm mt-2" aria-label="Ver detalle del sprint ' + escapeHtml(activeSprint.name || "") + '">Ver detalle del sprint</a>';
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function buildProjectHealthSection(projects) {
    var html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Estado de los proyectos</h2>';
    html += '<div class="table-responsive"><table class="table table-sm nexus-table">';
    html += "<thead><tr><th>Proyecto</th><th>Estado</th><th>Progreso</th></tr></thead><tbody>";
    if (!projects || projects.length === 0) {
      html += "<tr><td colspan=\"3\" class=\"text-muted text-center py-4\">No hay proyectos.</td></tr>";
    } else {
      projects.slice(0, 10).forEach(function (p) {
        var name = p.name || p.key || p.id || "—";
        var status = (p.status || "").toUpperCase();
        var statusLabel = status === "ACTIVE" ? "Saludable" : status === "ARCHIVED" ? "Archivado" : "En riesgo";
        var progress = p.progress != null ? p.progress : 0;
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

  function buildRecentActivitySection(auditLogs) {
    var html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Actividad reciente</h2>';
    html += '<ul class="list-unstyled mb-0">';
    if (!auditLogs || auditLogs.length === 0) {
      html += '<li class="py-2 text-muted">No hay actividad reciente.</li>';
    } else {
      auditLogs.forEach(function (log) {
        var action = (log.action || "").replace(/_/g, " ");
        var time = formatRelativeTime(log.created_at);
        html += '<li class="d-flex gap-2 py-2 border-bottom"><span class="nexus-text-muted">&#128100;</span><div><span>' + escapeHtml(action) + "</span><br><span class=\"nexus-text-sm nexus-text-muted\">" + escapeHtml(time) + "</span></div></li>";
      });
    }
    html += "</ul></div>";
    return html;
  }

  function buildRecentProjectsSection(projects) {
    var html = '<div class="nexus-panel">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Proyectos recientes</h2>';
    if (!projects || projects.length === 0) {
      html += '<div class="nexus-empty-state">';
      html += '<p class="nexus-empty-state-title">Aún no hay proyectos</p>';
      html += '<p class="nexus-text-secondary">Cree su primer proyecto para comenzar.</p>';
      html += '<a href="#/projects" class="btn btn-nexus-primary">Crear proyecto</a>';
      html += "</div>";
    } else {
      html += '<ul class="list-group list-group-flush">';
      projects.slice(0, 8).forEach(function (p) {
        var status = (p.status || "").toUpperCase();
        var badgeClass = status === "ACTIVE" ? "nexus-badge-active" : "nexus-badge-archived";
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

  function bindMyAssignmentsSearch() {
    var searchEl = document.querySelector(".dashboard-assignments-search");
    if (!searchEl) return;
    searchEl.oninput = function () {
      var term = (this.value || "").trim().toLowerCase();
      document.querySelectorAll(".dashboard-assignment-row").forEach(function (row) {
        var title = row.getAttribute("data-title") || "";
        var id = row.getAttribute("data-id") || "";
        var show = !term || title.indexOf(term) !== -1 || id.indexOf(term) !== -1;
        row.style.display = show ? "" : "none";
      });
    };
  }
})();
