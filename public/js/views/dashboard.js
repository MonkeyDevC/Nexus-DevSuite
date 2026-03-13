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
        html += "<td>" + (storyId ? "<button type=\"button\" class=\"btn btn-nexus-secondary btn-sm dashboard-story-view-btn\" data-story-id=\"" + escapeHtml(storyId) + "\" aria-label=\"Ver story " + escapeHtml((a.title || idDisplay).slice(0, 50)) + "\">Ver</button>" : "") + "</td>";
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

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest(".dashboard-story-view-btn");
    if (!btn) return;
    e.preventDefault();
    var storyId = btn.getAttribute("data-story-id");
    if (storyId) openDashboardStoryModal(storyId);
  });

  function openDashboardStoryModal(storyId) {
    if (!storyId) return;
    if (typeof window.openStoryViewModal === "function") {
      window.openStoryViewModal(storyId, { includeStoriesLink: true });
      return;
    }
    if (!storyId || typeof window.openNexusFormModal !== "function") return;
    window.fetchApi("/stories/" + storyId).then(async function (res) {
      if (!res || !res.success || !res.data) {
        if (typeof window.openNexusAlertModal === "function") {
          window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "No se pudo cargar la story." });
        }
        return;
      }
      var s = res.data;
      var projectIdForSprints = null;
      if (s.feature_id) {
        try {
          var featRes = await window.fetchApi("/features/" + s.feature_id);
          if (featRes && featRes.success && featRes.data && featRes.data.project_id) projectIdForSprints = featRes.data.project_id;
        } catch (err) {}
      }
      var did = s.number != null ? "US-" + s.number : (s.id ? String(s.id).slice(0, 8) : "—");
      var assigneeText = s.assignee ? ((s.assignee.name && String(s.assignee.name).trim()) ? String(s.assignee.name).trim() : (s.assignee.email || "")) || "—" : "No asignado";
      if (s.assignee && !assigneeText) assigneeText = s.assignee.email || "No name";
      var criteriaLines = [];
      if (s.acceptance_criteria && typeof s.acceptance_criteria === "object") {
        var items = Array.isArray(s.acceptance_criteria) ? s.acceptance_criteria : (s.acceptance_criteria.items || Object.keys(s.acceptance_criteria).map(function (k) { return s.acceptance_criteria[k]; }));
        if (items && items.length) criteriaLines = items.map(function (c) { return typeof c === "string" ? c : (c && c.text) ? c.text : JSON.stringify(c); });
      }
      var implCriteriaLines = [];
      if (s.implementation_criteria && typeof s.implementation_criteria === "object") {
        var implItems = Array.isArray(s.implementation_criteria) ? s.implementation_criteria : (s.implementation_criteria.items || Object.keys(s.implementation_criteria).map(function (k) { return s.implementation_criteria[k]; }));
        if (implItems && implItems.length) implCriteriaLines = implItems.map(function (c) { return typeof c === "string" ? c : (c && c.text) ? c.text : JSON.stringify(c); });
      }
      var sprintNameView = (s.sprint && s.sprint.name) ? escapeHtml(s.sprint.name) : (s.sprint_id ? "—" : "Ninguno");
      var badgeClass = window.nexusBadgeClass ? window.nexusBadgeClass(s.status) : "nexus-badge-draft";
      var storyStatuses = ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"];
      var usersPromise = window.fetchApi("/users?limit=50").then(function (body) {
        var raw = (body && body.success && body.data) ? body.data : null;
        return Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : (raw && raw.items) ? raw.items : [];
      });
      var sprintsPromise = projectIdForSprints ? window.fetchApi("/projects/" + projectIdForSprints + "/sprints?limit=50") : Promise.resolve(null);
      Promise.all([usersPromise, sprintsPromise]).then(function (results) {
        var usersForEdit = results[0];
        var assigneeSelectHtml = '<span class="nexus-text-sm text-muted">Asignado a</span><select id="dash-story-edit-assigned" class="form-select form-select-sm mt-1" style="max-width:100%"><option value="">Nadie (sin asignar)</option>';
        usersForEdit.forEach(function (u) {
          var uid = (u.id || "").replace(/"/g, "&quot;");
          var label = (u.name && String(u.name).trim()) ? escapeHtml(u.name) : (u.email ? escapeHtml(u.email) : "Sin nombre");
          var sel = (s.assigned_to && u.id === s.assigned_to) ? " selected" : "";
          assigneeSelectHtml += "<option value=\"" + uid + "\"" + sel + ">" + label + "</option>";
        });
        assigneeSelectHtml += "</select>";
        var priorityOpts = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        var prioritySelectHtml = '<span class="nexus-text-sm text-muted">Prioridad</span><select id="dash-story-edit-priority" class="form-select form-select-sm mt-1" style="max-width:100%">';
        priorityOpts.forEach(function (pr) {
          var sel = (s.priority || "MEDIUM") === pr ? " selected" : "";
          prioritySelectHtml += "<option value=\"" + escapeHtml(pr) + "\"" + sel + ">" + escapeHtml(pr) + "</option>";
        });
        prioritySelectHtml += "</select>";
        var statusVistaHtml = '<span class="nexus-text-sm text-muted">Estado</span><p class="mb-0" id="dash-story-status-vista">' + escapeHtml(s.status || "—") + '</p>';
        var statusSelectEditHtml = '<span class="nexus-text-sm text-muted">Estado</span><select id="dash-story-status-edicion" class="form-select form-select-sm mt-1" style="max-width:100%" aria-label="Estado"><option value="">—</option>';
        storyStatuses.forEach(function (st) {
          statusSelectEditHtml += '<option value="' + escapeHtml(st) + '"' + (s.status === st ? ' selected' : '') + '>' + escapeHtml(st) + '</option>';
        });
        statusSelectEditHtml += '</select>';
        var sprintSelectHtml = '<span class="nexus-text-sm text-muted">Sprint</span><div class="d-flex align-items-center gap-2 mt-1"><select id="dash-story-sprint" class="form-select form-select-sm" style="max-width:100%"><option value="">Ninguno</option></select><span id="dash-story-sprint-msg" class="nexus-text-sm text-muted"></span></div>';
        var bodyHtml = '<div class="nexus-card p-4" style="max-width:100%">';
        bodyHtml += '<ul class="nav nav-tabs mb-3" role="tablist"><li class="nav-item"><button type="button" class="nav-link active" id="dash-story-tab-vista" data-bs-toggle="tab" data-bs-target="#dash-story-panel-vista" aria-selected="true">Vista</button></li><li class="nav-item"><button type="button" class="nav-link" id="dash-story-tab-edicion" data-bs-toggle="tab" data-bs-target="#dash-story-panel-edicion" aria-selected="false">Edición</button></li></ul>';
        bodyHtml += '<div class="tab-content">';
        bodyHtml += '<div class="tab-pane fade show active" id="dash-story-panel-vista" role="tabpanel">';
        bodyHtml += '<div class="row g-3">';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + escapeHtml(did) + '</p></div>';
        bodyHtml += '<div class="col-md-4">' + statusVistaHtml + '</div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + escapeHtml(s.created_at || "—") + '</p></div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Título</span><p class="mb-0">' + escapeHtml(s.title || "—") + '</p></div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Prioridad</span><p class="mb-0">' + escapeHtml(s.priority || "—") + '</p></div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Actualizado</span><p class="mb-0 nexus-text-sm">' + escapeHtml(s.updated_at || "—") + '</p></div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Asignado a</span><p class="mb-0">' + escapeHtml(assigneeText) + '</p></div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Sprint</span><p class="mb-0" id="dash-story-sprint-view">' + escapeHtml(sprintNameView) + '</p></div>';
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Descripción</span>';
        bodyHtml += (s.description && String(s.description).trim()) ? '<p class="mb-0" style="white-space:pre-wrap">' + escapeHtml(s.description) + '</p>' : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
        bodyHtml += '</div>';
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de aceptación</span>';
        if (criteriaLines.length === 0) {
          bodyHtml += '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
        } else {
          bodyHtml += '<ul class="list-unstyled mb-0">';
          criteriaLines.forEach(function (line, idx) { bodyHtml += '<li class="py-1">' + (idx + 1) + '. ' + escapeHtml(line || "—") + '</li>'; });
          bodyHtml += '</ul>';
        }
        bodyHtml += '</div>';
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de implementación</span>';
        if (implCriteriaLines.length === 0) {
          bodyHtml += '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
        } else {
          bodyHtml += '<ul class="list-unstyled mb-0">';
          implCriteriaLines.forEach(function (line, idx) { bodyHtml += '<li class="py-1">' + (idx + 1) + '. ' + escapeHtml(line || "—") + '</li>'; });
          bodyHtml += '</ul>';
        }
        bodyHtml += '</div></div></div>';
        bodyHtml += '<div class="tab-pane fade" id="dash-story-panel-edicion" role="tabpanel">';
        bodyHtml += '<div class="row g-3">';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + escapeHtml(did) + '</p></div>';
        bodyHtml += '<div class="col-md-4">' + statusSelectEditHtml + '</div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + escapeHtml(s.created_at || "—") + '</p></div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Título</span><input type="text" id="dash-story-edit-title" class="form-control form-control-sm mt-1" value="' + escapeHtml(s.title || "") + '" placeholder="Título" aria-label="Título"></div>';
        bodyHtml += '<div class="col-md-4">' + prioritySelectHtml + '</div>';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Actualizado</span><p class="mb-0 nexus-text-sm">' + escapeHtml(s.updated_at || "—") + '</p></div>';
        bodyHtml += '<div class="col-md-4">' + assigneeSelectHtml + '</div>';
        bodyHtml += '<div class="col-md-4">' + sprintSelectHtml + '</div>';
        bodyHtml += '<div class="col-12"><span class="nexus-text-sm text-muted">Descripción</span><textarea id="dash-story-edit-desc" class="form-control form-control-sm mt-1" rows="3" placeholder="Descripción" aria-label="Descripción">' + escapeHtml(s.description || "") + '</textarea></div>';
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de aceptación</span>';
        bodyHtml += '<div id="dash-story-criteria-list">';
        var numCriteria = criteriaLines.length || 1;
        for (var i = 0; i < numCriteria; i++) {
          bodyHtml += '<div class="story-criterion-row d-flex gap-2 align-items-center mb-2"><input type="text" class="form-control form-control-sm story-detail-criteria-input" placeholder="Criterio ' + (i + 1) + '" value="' + escapeHtml(criteriaLines[i] || "") + '" aria-label="Criterio ' + (i + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove" aria-label="Quitar criterio">&times;</button></div>';
        }
        bodyHtml += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="dash-story-criteria-add" class="btn btn-outline-secondary btn-sm">+ Añadir criterio</button><button type="button" id="dash-story-criteria-save" class="btn btn-nexus-primary btn-sm">Guardar criterios</button><span id="dash-story-criteria-msg" class="nexus-text-sm text-muted"></span></div></div>';
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de implementación</span>';
        bodyHtml += '<div id="dash-story-impl-criteria-list">';
        var numImplCriteria = implCriteriaLines.length || 1;
        for (var j = 0; j < numImplCriteria; j++) {
          bodyHtml += '<div class="story-impl-criterion-row d-flex gap-2 align-items-center mb-2"><input type="text" class="form-control form-control-sm story-detail-impl-criteria-input" placeholder="Criterio ' + (j + 1) + '" value="' + escapeHtml(implCriteriaLines[j] || "") + '" aria-label="Criterio ' + (j + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove" aria-label="Quitar criterio">&times;</button></div>';
        }
        bodyHtml += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="dash-story-impl-criteria-add" class="btn btn-outline-secondary btn-sm">+ Añadir criterio</button><button type="button" id="dash-story-impl-criteria-save" class="btn btn-nexus-primary btn-sm">Guardar criterios</button><span id="dash-story-impl-criteria-msg" class="nexus-text-sm text-muted"></span></div></div>';
        bodyHtml += '</div></div></div></div>';
        var initialTitle = (s.title || "").trim();
        var initialDesc = (s.description || "").trim();
        var initialPriority = s.priority || "MEDIUM";
        var initialAssigned = s.assigned_to || "";
        function getCriteriaLines() {
          var inputs = document.querySelectorAll("#dashboardStoryDetailModal .story-detail-criteria-input");
          var lines = [];
          if (inputs) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          return lines;
        }
        function getImplementationCriteriaLines() {
          var inputs = document.querySelectorAll("#dashboardStoryDetailModal .story-detail-impl-criteria-input");
          var lines = [];
          if (inputs) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          return lines;
        }
        function doSaveMain() {
          var titleEl = document.getElementById("dash-story-edit-title");
          var descEl = document.getElementById("dash-story-edit-desc");
          var prioritySel = document.getElementById("dash-story-edit-priority");
          var assignedSel = document.getElementById("dash-story-edit-assigned");
          var title = (titleEl && titleEl.value || "").trim();
          var desc = (descEl && descEl.value || "").trim();
          var priority = prioritySel ? prioritySel.value : "MEDIUM";
          var assignedTo = assignedSel && assignedSel.value ? assignedSel.value : null;
          var mainMsgEl = document.getElementById("dash-story-main-msg");
          if (!title) { if (mainMsgEl) mainMsgEl.textContent = "El título es obligatorio."; return Promise.resolve(false); }
          if (mainMsgEl) mainMsgEl.textContent = "Guardando…";
          return window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ title: title, description: desc, priority: priority, assigned_to: assignedTo }) }).then(function (r) {
            if (mainMsgEl) mainMsgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Cambios guardados correctamente.");
            return !!(r && r.success);
          });
        }
        function doSaveCriteria() {
          var lines = getCriteriaLines();
          return window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ acceptance_criteria: lines }) }).then(function (r) {
            var msgEl = document.getElementById("dash-story-criteria-msg");
            if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            return !!(r && r.success);
          });
        }
        function doSaveImplementationCriteria() {
          var lines = getImplementationCriteriaLines();
          return window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ implementation_criteria: lines }) }).then(function (r) {
            var msgEl = document.getElementById("dash-story-impl-criteria-msg");
            if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            return !!(r && r.success);
          });
        }
        function doSaveAll() {
          var mainPromise = doSaveMain();
          var critChanged = false;
          var currCrit = getCriteriaLines();
          for (var i = 0; i < criteriaLines.length; i++) if (currCrit[i] !== (criteriaLines[i] || "").trim()) { critChanged = true; break; }
          if (currCrit.length !== criteriaLines.length) critChanged = true;
          var critPromise = critChanged ? doSaveCriteria() : Promise.resolve(true);
          var implCritChanged = false;
          var currImpl = getImplementationCriteriaLines();
          for (var k = 0; k < implCriteriaLines.length; k++) if (currImpl[k] !== (implCriteriaLines[k] || "").trim()) { implCritChanged = true; break; }
          if (currImpl.length !== implCriteriaLines.length) implCritChanged = true;
          var implPromise = implCritChanged ? doSaveImplementationCriteria() : Promise.resolve(true);
          return Promise.all([mainPromise, critPromise, implPromise]).then(function (r) { return r[0] && r[1] && r[2]; });
        }
        function getDirtyState() {
          var titleEl = document.getElementById("dash-story-edit-title");
          var descEl = document.getElementById("dash-story-edit-desc");
          var prioritySel = document.getElementById("dash-story-edit-priority");
          var assignedSel = document.getElementById("dash-story-edit-assigned");
          if (!titleEl) return false;
          var t = (titleEl.value || "").trim();
          var d = (descEl && descEl.value || "").trim();
          var p = prioritySel ? prioritySel.value : "MEDIUM";
          var a = assignedSel && assignedSel.value ? assignedSel.value : "";
          if (t !== initialTitle || d !== initialDesc || p !== initialPriority || a !== initialAssigned) return true;
          var curr = getCriteriaLines();
          if (curr.length !== criteriaLines.length) return true;
          for (var i = 0; i < criteriaLines.length; i++) if (curr[i] !== (criteriaLines[i] || "").trim()) return true;
          var currImpl = getImplementationCriteriaLines();
          if (currImpl.length !== implCriteriaLines.length) return true;
          for (var k = 0; k < implCriteriaLines.length; k++) if (currImpl[k] !== (implCriteriaLines[k] || "").trim()) return true;
          return false;
        }
        window.openNexusFormModal({
          id: "dashboardStoryDetailModal", title: "Detalle de la story", bodyHtml: bodyHtml, mode: "edit",
          primaryButtonId: "dashboard-story-modal-close", primaryLabel: "Guardar", cancelButtonId: "dashboard-story-modal-cancel",
          modalDialogClass: "nexus-modal-story-detail",
          getDirtyState: getDirtyState,
          onSaveBeforeClose: doSaveAll
        }, function (bsModal) { doSaveAll(); });
        var modal = document.getElementById("dashboardStoryDetailModal");
        var cancelBtn = document.getElementById("dashboard-story-modal-cancel");
        var primaryBtn = document.getElementById("dashboard-story-modal-close");
        var closeXBtn = modal ? modal.querySelector(".nexus-form-modal-close-btn") : null;
        var footer = modal ? modal.querySelector(".modal-footer") : null;
        var exportImportGroup = null;
        if (footer) {
          footer.querySelectorAll(".nexus-story-export-import-group").forEach(function (el) { el.remove(); });
          var exportBtn = document.createElement("button");
          exportBtn.type = "button";
          exportBtn.className = "btn btn-outline-secondary btn-sm me-2";
          exportBtn.textContent = "Exportar";
          exportBtn.title = "Exportar configuración de la story como JSON";
          exportBtn.onclick = function () {
            function getAllCriteriaLines(selector) {
              var inputs = document.querySelectorAll("#dashboardStoryDetailModal " + selector);
              var lines = [];
              if (inputs) for (var i = 0; i < inputs.length; i++) lines.push((inputs[i].value || "").trim());
              return lines.length ? lines : [""];
            }
            var data = {
              title: (document.getElementById("dash-story-edit-title") && document.getElementById("dash-story-edit-title").value) || "",
              description: (document.getElementById("dash-story-edit-desc") && document.getElementById("dash-story-edit-desc").value) || "",
              status: (document.getElementById("dash-story-status-edicion") && document.getElementById("dash-story-status-edicion").value) || "DRAFT",
              priority: (document.getElementById("dash-story-edit-priority") && document.getElementById("dash-story-edit-priority").value) || "MEDIUM",
              assigned_to: (document.getElementById("dash-story-edit-assigned") && document.getElementById("dash-story-edit-assigned").value) || null,
              sprint_id: (document.getElementById("dash-story-sprint") && document.getElementById("dash-story-sprint").value) || null,
              acceptance_criteria: getAllCriteriaLines(".story-detail-criteria-input"),
              implementation_criteria: getAllCriteriaLines(".story-detail-impl-criteria-input")
            };
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "story-us-" + (did || storyId) + "-config.json";
            a.click();
            URL.revokeObjectURL(a.href);
          };
          var importInput = document.createElement("input");
          importInput.type = "file";
          importInput.accept = ".json,application/json";
          importInput.className = "d-none";
          importInput.id = "dash-story-import-input";
          var importBtn = document.createElement("button");
          importBtn.type = "button";
          importBtn.className = "btn btn-outline-secondary btn-sm me-2";
          importBtn.textContent = "Importar";
          importBtn.title = "Importar configuración desde archivo JSON";
          importBtn.onclick = function () { importInput.click(); };
          importInput.onchange = function () {
            var file = importInput.files && importInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
              try {
                var data = JSON.parse(reader.result);
                var titleEl = document.getElementById("dash-story-edit-title");
                var descEl = document.getElementById("dash-story-edit-desc");
                var statusSel = document.getElementById("dash-story-status-edicion");
                var prioritySel = document.getElementById("dash-story-edit-priority");
                var assignedSel = document.getElementById("dash-story-edit-assigned");
                var sprintSel = document.getElementById("dash-story-sprint");
                if (titleEl && data.title !== undefined) titleEl.value = data.title || "";
                if (descEl && data.description !== undefined) descEl.value = data.description || "";
                if (statusSel && data.status) statusSel.value = data.status;
                if (prioritySel && data.priority) prioritySel.value = data.priority;
                if (assignedSel && data.assigned_to !== undefined) assignedSel.value = data.assigned_to || "";
                if (sprintSel && data.sprint_id !== undefined) sprintSel.value = data.sprint_id || "";
                if (data.acceptance_criteria && Array.isArray(data.acceptance_criteria)) {
                  var list = document.getElementById("dash-story-criteria-list");
                  if (list) {
                    list.innerHTML = "";
                    var items = data.acceptance_criteria.length ? data.acceptance_criteria : [""];
                    items.forEach(function (val, idx) {
                      var row = document.createElement("div");
                      row.className = "story-criterion-row d-flex gap-2 align-items-center mb-2";
                      row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + escapeHtml(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove" aria-label="Quitar criterio">&times;</button>';
                      list.appendChild(row);
                    });
                    list.querySelectorAll(".story-criterion-remove").forEach(function (btn) {
                      btn.onclick = function () {
                        var row = btn.closest(".story-criterion-row");
                        if (row && list.querySelectorAll(".story-criterion-row").length > 1) row.remove();
                      };
                    });
                  }
                }
                if (data.implementation_criteria && Array.isArray(data.implementation_criteria)) {
                  var implList = document.getElementById("dash-story-impl-criteria-list");
                  if (implList) {
                    implList.innerHTML = "";
                    var implItems = data.implementation_criteria.length ? data.implementation_criteria : [""];
                    implItems.forEach(function (val, idx) {
                      var row = document.createElement("div");
                      row.className = "story-impl-criterion-row d-flex gap-2 align-items-center mb-2";
                      row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-impl-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + escapeHtml(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove" aria-label="Quitar criterio">&times;</button>';
                      implList.appendChild(row);
                    });
                    implList.querySelectorAll(".story-impl-criterion-remove").forEach(function (btn) {
                      btn.onclick = function () {
                        var row = btn.closest(".story-impl-criterion-row");
                        if (row && implList.querySelectorAll(".story-impl-criterion-row").length > 1) row.remove();
                      };
                    });
                  }
                }
                if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Configuración importada correctamente.");
                if (statusVistaEl && data.status) statusVistaEl.textContent = data.status;
                if (typeof updateViewSprintText === "function") updateViewSprintText();
                document.getElementById("dash-story-tab-edicion").click();
              } catch (e) {
                if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "El archivo no es un JSON válido." });
              }
              importInput.value = "";
            };
            reader.readAsText(file);
          };
          exportImportGroup = document.createElement("div");
          exportImportGroup.id = "dash-story-export-import-group";
          exportImportGroup.className = "d-flex gap-2 me-auto nexus-story-export-import-group";
          exportImportGroup.style.display = "none";
          exportImportGroup.classList.add("d-none");
          exportImportGroup.appendChild(exportBtn);
          exportImportGroup.appendChild(importBtn);
          exportImportGroup.appendChild(importInput);
          footer.insertBefore(exportImportGroup, footer.firstChild);
          footer.querySelectorAll(".nexus-story-modal-stories-link").forEach(function (el) { el.remove(); });
          var storiesLinkEl = document.createElement("a");
          storiesLinkEl.href = "#/stories?feature=" + encodeURIComponent(s.feature_id || "");
          storiesLinkEl.className = "btn btn-nexus-secondary btn-sm me-2 nexus-story-modal-stories-link";
          storiesLinkEl.textContent = "Ir al módulo Stories";
          var cancelBtnRef = document.getElementById("dashboard-story-modal-cancel");
          footer.insertBefore(storiesLinkEl, cancelBtnRef || footer.firstChild);
        }
        var bsModalInst = modal && typeof bootstrap !== "undefined" ? bootstrap.Modal.getInstance(modal) : null;
        function doClose() { if (bsModalInst) bsModalInst.hide(); }
        var ctx = { modalEl: modal, getDirtyState: getDirtyState, onSaveBeforeClose: doSaveAll };
        function switchToViewMode() {
          if (cancelBtn) cancelBtn.style.display = "none";
          if (exportImportGroup) { exportImportGroup.style.display = "none"; exportImportGroup.classList.add("d-none"); }
          if (primaryBtn) { primaryBtn.textContent = "Cerrar"; primaryBtn.onclick = function () { doClose(); }; }
          if (closeXBtn) closeXBtn.onclick = function () { doClose(); };
        }
        function switchToEditMode() {
          if (cancelBtn) cancelBtn.style.display = "";
          if (exportImportGroup) { exportImportGroup.style.display = "flex"; exportImportGroup.classList.remove("d-none"); }
          if (primaryBtn) { primaryBtn.textContent = "Guardar"; primaryBtn.onclick = function () { doSaveAll(); }; }
          if (cancelBtn) cancelBtn.onclick = function () { window.nexusFormModalCloseAttempt(ctx, doClose); };
          if (closeXBtn) closeXBtn.onclick = function () { window.nexusFormModalCloseAttempt(ctx, doClose); };
        }
        if (modal) {
          modal.addEventListener("shown.bs.modal", function () { switchToViewMode(); });
          var tabVista = document.getElementById("dash-story-tab-vista");
          var tabEdicion = document.getElementById("dash-story-tab-edicion");
          if (tabVista) tabVista.addEventListener("shown.bs.tab", switchToViewMode);
          if (tabEdicion) tabEdicion.addEventListener("shown.bs.tab", switchToEditMode);
          setTimeout(function () { switchToViewMode(); }, 0);
        }
        var criteriaList = document.getElementById("dash-story-criteria-list");
        var addCriteriaBtn = document.getElementById("dash-story-criteria-add");
        if (addCriteriaBtn && criteriaList) {
          addCriteriaBtn.onclick = function () {
            var rows = criteriaList.querySelectorAll(".story-criterion-row");
            var n = rows.length + 1;
            var row = document.createElement("div");
            row.className = "story-criterion-row d-flex gap-2 align-items-center mb-2";
            row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove" aria-label="Quitar criterio">&times;</button>';
            criteriaList.appendChild(row);
            row.querySelector(".story-criterion-remove").onclick = function () { if (criteriaList.querySelectorAll(".story-criterion-row").length > 1) row.remove(); };
          };
        }
        modal.querySelectorAll(".story-criterion-remove").forEach(function (btn) {
          btn.onclick = function () {
            var row = btn.closest(".story-criterion-row");
            if (row && criteriaList && criteriaList.querySelectorAll(".story-criterion-row").length > 1) row.remove();
          };
        });
        var criteriaSaveBtn = document.getElementById("dash-story-criteria-save");
        if (criteriaSaveBtn) criteriaSaveBtn.onclick = function () {
          var inputs = modal.querySelectorAll(".story-detail-criteria-input");
          var msgEl = document.getElementById("dash-story-criteria-msg");
          var lines = [];
          if (inputs && inputs.length) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          if (msgEl) msgEl.textContent = "Guardando…";
          window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ acceptance_criteria: lines }) }).then(function (r) {
            if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Criterios guardados correctamente.");
          });
        };
        var implCriteriaList = document.getElementById("dash-story-impl-criteria-list");
        var addImplCriteriaBtn = document.getElementById("dash-story-impl-criteria-add");
        if (addImplCriteriaBtn && implCriteriaList) {
          addImplCriteriaBtn.onclick = function () {
            var rows = implCriteriaList.querySelectorAll(".story-impl-criterion-row");
            var n = rows.length + 1;
            var row = document.createElement("div");
            row.className = "story-impl-criterion-row d-flex gap-2 align-items-center mb-2";
            row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-impl-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove" aria-label="Quitar criterio">&times;</button>';
            implCriteriaList.appendChild(row);
            row.querySelector(".story-impl-criterion-remove").onclick = function () { if (implCriteriaList.querySelectorAll(".story-impl-criterion-row").length > 1) row.remove(); };
          };
        }
        modal.querySelectorAll(".story-impl-criterion-remove").forEach(function (btn) {
          btn.onclick = function () {
            var row = btn.closest(".story-impl-criterion-row");
            if (row && implCriteriaList && implCriteriaList.querySelectorAll(".story-impl-criterion-row").length > 1) row.remove();
          };
        });
        var implCriteriaSaveBtn = document.getElementById("dash-story-impl-criteria-save");
        if (implCriteriaSaveBtn) implCriteriaSaveBtn.onclick = function () {
          var inputs = modal.querySelectorAll(".story-detail-impl-criteria-input");
          var msgEl = document.getElementById("dash-story-impl-criteria-msg");
          var lines = [];
          if (inputs && inputs.length) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          if (msgEl) msgEl.textContent = "Guardando…";
          window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ implementation_criteria: lines }) }).then(function (r) {
            if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Criterios de implementación guardados correctamente.");
          });
        };
        var sprintsRes = results[1];
        var rawSprints = (sprintsRes && sprintsRes.success && sprintsRes.data) ? sprintsRes.data : null;
        var sprintsList = Array.isArray(rawSprints) ? rawSprints : (rawSprints && rawSprints.items) ? rawSprints.items : (rawSprints && rawSprints.data) ? rawSprints.data : [];
        var seenSp = {};
        sprintsList = (Array.isArray(sprintsList) ? sprintsList : []).filter(function (sp) {
          var id = (sp.id != null ? String(sp.id) : "");
          if (seenSp[id]) return false;
          seenSp[id] = true;
          return true;
        });
        var sel = document.getElementById("dash-story-sprint");
        var sprintMsgEl = document.getElementById("dash-story-sprint-msg");
        if (sel) {
          sel.innerHTML = '<option value="">Ninguno</option>';
          sprintsList.forEach(function (sp) {
            var opt = document.createElement("option");
            opt.value = sp.id || "";
            opt.textContent = sp.name || sp.id || "";
            if ((s.sprint_id && sp.id === s.sprint_id) || (s.sprint && sp.id === s.sprint.id)) opt.selected = true;
            sel.appendChild(opt);
          });
        }
        var viewSprintEl = document.getElementById("dash-story-sprint-view");
        function updateViewSprintText() {
          if (viewSprintEl && sel) {
            var opt = sel.options[sel.selectedIndex];
            viewSprintEl.textContent = opt ? opt.textContent : "Ninguno";
          }
        }
        if (sel) {
          updateViewSprintText();
          sel.onchange = function () {
            var val = sel.value || null;
            updateViewSprintText();
            if (sprintMsgEl) sprintMsgEl.textContent = "Guardando…";
            window.fetchApi("/stories/" + storyId + "/sprint", { method: "PATCH", body: JSON.stringify({ sprint_id: val }) }).then(function (r) {
              if (sprintMsgEl) sprintMsgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
              if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Sprint actualizado correctamente.");
            });
          };
        }
        var statusVistaEl = document.getElementById("dash-story-status-vista");
        var statusEdicion = document.getElementById("dash-story-status-edicion");
        function syncStatusSelects(newStatus) {
          if (statusVistaEl && newStatus) statusVistaEl.textContent = newStatus;
          if (statusEdicion && newStatus) statusEdicion.value = newStatus;
        }
        function bindStatusSelect(selectEl) {
          if (!selectEl) return;
          selectEl.onchange = function () {
            var val = (selectEl.value || "").trim();
            if (!val) return;
            window.fetchApi("/stories/" + storyId + "/status", { method: "PATCH", body: JSON.stringify({ status: val }) }).then(function (r) {
              if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado correctamente."); syncStatusSelects(val); }
              else if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al cambiar estado." });
            });
          };
        }
        bindStatusSelect(statusEdicion);
        var assignedSel = document.getElementById("dash-story-edit-assigned");
        if (assignedSel) {
          assignedSel.onchange = function () {
            var userId = assignedSel.value || null;
            window.fetchApi("/stories/" + storyId + "/assign", { method: "PATCH", body: JSON.stringify({ assigned_to: userId }) }).then(function (r) {
              if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Asignación actualizada correctamente.");
              else if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al asignar." });
            });
          };
        }
      });
    });
  }
})();
