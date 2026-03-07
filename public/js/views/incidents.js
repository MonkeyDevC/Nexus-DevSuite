/**
 * Incidentes — GET /projects/:id/incidents (page, limit, status). Tabla ordenable, filtros, búsqueda, paginación, badges, carga, empty state.
 */
(function () {
  window.registerView("incidents", async function () {
    await window.showNav();
    window.setContent(window.showLoading());
    var r = await window.fetchApi("/projects");
    var projects = r && r.success && r.data && r.data.items ? r.data.items : [];
    var state = { projectId: "", page: 1, limit: 10, status: "", search: "", sort: "title", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["title", "description"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Incidentes", href: "" }]);
      html += '<h1 class="nexus-page-title">Incidentes</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<label class="form-label nexus-text-sm">Proyecto</label><select id="incsel" class="form-select form-select-sm mb-3 nexus-input" style="max-width:320px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option>';
      projects.forEach(function (p) { html += "<option value=\"" + p.id + "\">" + esc(p.name || p.id) + "</option>"; });
      html += "</select>";
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver los incidentes.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="inc-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="inc-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="RESOLVED">RESOLVED</option><option value="CLOSED">CLOSED</option></select></label>';
      html += '<a href="#" id="incbtn" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo incidente</a></div>';
      html += '<div id="inclist">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay incidentes") + "</p><p class=\"nexus-text-secondary\">Cree un incidente o ajuste los filtros.</p></div>";
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Título", "title", state.sort, state.dir, setSort) + "<th scope=\"col\">Severidad</th>" + window.sortableTh("Estado", "status", state.sort, state.dir, setSort) + "<th scope=\"col\">Fecha de creación</th><th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (x) {
          var created = (x.created_at && x.created_at.slice) ? x.created_at.slice(0, 10) : (x.created_at || "—");
          html += "<tr><td>" + esc(x.title || x.id) + "</td><td><span class=\"" + window.nexusBadgeClass(x.severity) + "\">" + esc(x.severity || "") + "</span></td><td><span class=\"" + window.nexusBadgeClass(x.status) + "\">" + esc(x.status || "") + "</span></td><td>" + created + "</td><td><a href=\"#/incidents\" class=\"btn btn-link btn-sm p-0\">Ver</a></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="inc-pagination" class="mt-2"></div>';
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
      window.fetchApi("/projects/" + state.projectId + "/incidents" + buildQuery()).then(function (b) {
        if (b && b.success && b.data) {
          var data = b.data;
          var raw = data.items || data.data || [];
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
      var sel = document.getElementById("incsel");
      if (sel) {
        sel.value = state.projectId;
        sel.onchange = function () { state.projectId = sel.value; state.page = 1; load(); };
      }
      var st = document.getElementById("inc-status");
      var search = document.getElementById("inc-search");
      if (st) { st.value = state.status; st.onchange = function () { state.status = st.value; state.page = 1; load(); }; }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; load(); }, 300); };
      }
      var pagEl = document.getElementById("inc-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btn = document.getElementById("incbtn");
      if (btn) btn.onclick = function (e) {
        e.preventDefault();
        if (!state.projectId) { alert("Seleccione un proyecto"); return; }
        var t = prompt("Título");
        if (!t) return;
        window.fetchApi("/projects/" + state.projectId + "/incidents", { method: "POST", body: JSON.stringify({ title: t, description: "", severity: "MEDIUM" }) }).then(function (b) {
          if (b && b.success) load(); else alert(b && b.error ? b.error.message : "Error.");
        });
      };
    }

    load();
  });
})();
