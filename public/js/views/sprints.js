/**
 * Sprints — GET /projects/:id/sprints (page, limit, status), detalle. Tabla ordenable, filtros, búsqueda, paginación, badges, carga, empty state.
 */
(function () {
  window.registerView("sprints", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var sprintId = segs[1];
    if (sprintId) {
      window.setContent(window.showLoading());
      var body = await window.fetchApi("/sprints/" + sprintId);
      if (body && body.success && body.data) {
        var s = body.data;
        var user = await window.getMe();
        var isMaster = user && user.role === "MASTER";
        function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }
        var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Sprints", href: "#/sprints" }, { label: s.name || "Sprint", href: "" }]);
        html += '<div class="nexus-card nexus-section-spacing"><h1 class="nexus-page-title">' + esc(s.name || "Sprint") + "</h1>";
        html += "<p class=\"nexus-text-secondary\">Estado: <span class=\"" + window.nexusBadgeClass(s.status) + "\">" + esc(s.status || "") + "</span></p>";
        html += "<p class=\"nexus-text-sm\">Inicio: " + (s.start_date || "—") + " · Fin: " + (s.end_date || "—") + "</p>";
        if (isMaster && s.status !== "CLOSED") html += '<button class="btn btn-nexus-primary btn-sm me-2" id="sprint-close-btn">Cerrar sprint</button>';
        html += ' <a href="#/sprints" class="btn btn-nexus-secondary btn-sm">Volver</a></div>';
        var stories = (s.user_stories || s.stories || []);
        if (stories.length) {
          html += '<div class="nexus-panel"><h2 class="nexus-font-semibold nexus-text-primary mb-3">Stories asignadas</h2><div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr><th>Título</th><th>Estado</th><th>Asignado</th></tr></thead><tbody>';
          stories.forEach(function (st) { html += "<tr><td>" + esc(st.title || st.id) + "</td><td><span class=\"" + window.nexusBadgeClass(st.status) + "\">" + esc(st.status || "") + "</span></td><td>" + (st.assignee ? esc(st.assignee.email || st.assigned_to) : "—") + "</td></tr>"; });
          html += "</tbody></table></div></div>";
        }
        window.setContent(html);
        var closeBtn = document.getElementById("sprint-close-btn");
        if (closeBtn) closeBtn.onclick = function () {
          window.fetchApi("/sprints/" + s.id + "/close", { method: "PATCH", body: JSON.stringify({}) }).then(function (r) {
            if (r && r.success) window.location.hash = "#/sprints/" + s.id;
            else alert(r && r.error && r.error.message || "Error.");
          });
        };
      } else {
        window.setContent(window.showError(body && body.error && body.error.message));
      }
      return;
    }
    window.setContent(window.showLoading());
    var projectsRes = await window.fetchApi("/projects");
    var projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];
    var user = await window.getMe();
    var isMaster = user && user.role === "MASTER";
    var state = { projectId: "", page: 1, limit: 10, status: "", search: "", sort: "name", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["name", "goal"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Sprints", href: "" }]);
      html += '<h1 class="nexus-page-title">Sprints</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<label class="form-label nexus-text-sm">Proyecto</label><select id="sprints-sel-project" class="form-select form-select-sm mb-3 nexus-input" style="max-width:320px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option>';
      projects.forEach(function (p) { html += "<option value=\"" + p.id + "\">" + esc(p.name || p.id) + "</option>"; });
      html += "</select> ";
      if (isMaster) html += '<a href="#" id="sprints-btn-new" class="btn btn-nexus-primary btn-sm">+ Nuevo sprint</a>';
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver los sprints.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="sprints-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="sprints-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="PLANNED">PLANNED</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="CLOSED">CLOSED</option></select></label></div>';
      html += '<div id="sprints-list">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay sprints") + "</p><p class=\"nexus-text-secondary\">Cree un sprint o ajuste los filtros.</p></div>";
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Nombre", "name", state.sort, state.dir, setSort) + "<th scope=\"col\">Fecha inicio</th><th scope=\"col\">Fecha fin</th>" + window.sortableTh("Estado", "status", state.sort, state.dir, setSort) + "<th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (s) {
          html += "<tr><td><a href=\"#/sprints/" + s.id + "\">" + esc(s.name || s.id) + "</a></td><td>" + (s.start_date || "—") + "</td><td>" + (s.end_date || "—") + "</td><td><span class=\"" + window.nexusBadgeClass(s.status) + "\">" + esc(s.status || "") + "</span></td><td><a href=\"#/sprints/" + s.id + "\" class=\"btn btn-link btn-sm p-0\">Ver</a></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="sprints-pagination" class="mt-2"></div>';
      }
      html += "</div></div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function load() {
      if (!state.projectId) {
        window.setContent(renderList(null, null));
        bind();
        return;
      }
      window.setContent(window.showLoading());
      window.fetchApi("/projects/" + state.projectId + "/sprints" + buildQuery()).then(function (b) {
        if (b && b.success && b.data) {
          var data = b.data;
          var raw = data.items || [];
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var total = data.total != null ? data.total : raw.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages = state.search ? 1 : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
          window.setContent(renderList(toShow, currentMeta));
          bind();
        } else {
          window.setContent(window.showError(b && b.error && b.error.message));
        }
      });
    }

    function refreshFromCurrent() {
      var toShow = getDisplayItems(currentItems);
      if (!currentMeta) currentMeta = { page: 1, limit: state.limit, total: currentItems.length, totalPages: 1 };
      if (state.search) currentMeta = { page: 1, limit: currentMeta.limit, total: toShow.length, totalPages: toShow.length ? 1 : 0 };
      window.setContent(renderList(toShow, currentMeta));
      bind();
    }

    function bind() {
      var sel = document.getElementById("sprints-sel-project");
      if (sel) {
        sel.value = state.projectId;
        sel.onchange = function () { state.projectId = sel.value; state.page = 1; load(); };
      }
      var st = document.getElementById("sprints-status");
      var search = document.getElementById("sprints-search");
      if (st) { st.value = state.status; st.onchange = function () { state.status = st.value; state.page = 1; load(); }; }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; load(); }, 300); };
      }
      var pagEl = document.getElementById("sprints-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btn = document.getElementById("sprints-btn-new");
      if (btn) btn.onclick = function (e) {
        e.preventDefault();
        if (!state.projectId) { alert("Seleccione un proyecto"); return; }
        var name = prompt("Nombre del sprint");
        if (!name) return;
        window.fetchApi("/projects/" + state.projectId + "/sprints", { method: "POST", body: JSON.stringify({ name: name.trim(), goal: "" }) }).then(function (r) {
          if (r && r.success) load(); else alert(r && r.error && r.error.message || "Error.");
        });
      };
    }

    var projectParam = segs[1];
    if (projectParam && projectParam.indexOf("?") !== 0) state.projectId = projectParam;
    load();
  });
})();
