/**
 * Releases — GET /releases (page, limit, status), GET /releases/:id, POST (MASTER). Tabla ordenable, filtros, búsqueda, paginación, badges, carga, empty state.
 */
(function () {
  window.registerView("releases", async function () {
    await window.showNav();
    const segs = window.getHashSegments();
    const releaseId = segs[1];
    const user = await window.getMe();
    const isMaster = user && user.role === "MASTER";

    if (releaseId) {
      window.setContent(window.showLoading());
      const body = await window.fetchApi("/releases/" + releaseId);
      if (body && body.success && body.data) {
        const r = body.data;
        function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }
        var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Releases", href: "#/releases" }, { label: r.version || r.id, href: "" }]);
        html += '<div class="nexus-panel nexus-section-spacing"><h1 class="nexus-page-title">Release ' + esc(r.version || r.id) + "</h1>";
        html += "<p class=\"nexus-text-secondary\">Estado: <span class=\"" + window.nexusBadgeClass(r.status) + "\">" + esc(r.status || "") + "</span></p><p>" + esc(r.description || "") + "</p>";
        var feats = r.features || [];
        if (feats.length) { html += "<h3 class=\"nexus-font-semibold mt-3\">Features</h3><ul class=\"list-unstyled\">"; feats.forEach(function (f) { html += "<li><a href=\"#/features?project=" + (f.project_id || "") + "\">" + esc(f.title || f.id) + "</a></li>"; }); html += "</ul>"; }
        html += '<a href="#/releases" class="btn btn-nexus-secondary btn-sm mt-3">Volver</a></div>';
        window.setContent(html);
      } else {
        window.setContent(window.showError(body && body.error && body.error.message));
      }
      return;
    }

    var state = { page: 1, limit: 10, status: "", search: "", sort: "version", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["version", "description"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Releases", href: "" }]);
      html += '<h1 class="nexus-page-title">Releases</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="releases-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="releases-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="PLANNED">PLANNED</option><option value="RELEASED">RELEASED</option><option value="ARCHIVED">ARCHIVED</option></select></label>';
      if (isMaster) html += '<a href="#" id="releases-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo release</a>';
      html += "</div>";
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay releases") + "</p><p class=\"nexus-text-secondary\">Cree un release o ajuste los filtros.</p></div>";
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Versión", "version", state.sort, state.dir, setSort) + window.sortableTh("Estado", "status", state.sort, state.dir, setSort) + "<th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (r) {
          html += "<tr><td><a href=\"#/releases/" + r.id + "\">" + esc(r.version || r.id) + "</a></td><td><span class=\"" + window.nexusBadgeClass(r.status) + "\">" + esc(r.status || "") + "</span></td><td><a href=\"#/releases/" + r.id + "\" class=\"btn btn-link btn-sm p-0\">Ver</a></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="releases-pagination" class="mt-2"></div>';
      }
      html += "</div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function runList() {
      window.setContent(window.showLoading());
      window.fetchApi("/releases" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var raw = data.items || (Array.isArray(data) ? data : []);
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var total = data.total != null ? data.total : raw.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages = state.search ? 1 : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
          window.setContent(renderList(toShow, currentMeta));
          bind();
        } else {
          window.setContent(window.showError(body && body.error && body.error.message));
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
      var st = document.getElementById("releases-status");
      var search = document.getElementById("releases-search");
      if (st) { st.value = state.status; st.onchange = function () { state.status = st.value; state.page = 1; runList(); }; }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; runList(); }, 300); };
      }
      var pagEl = document.getElementById("releases-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; runList(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; runList(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btnNew = document.getElementById("releases-btn-new");
      if (btnNew) btnNew.onclick = function (e) {
        e.preventDefault();
        var version = prompt("Versión (ej. 1.0.0)");
        var desc = prompt("Descripción");
        if (!version) return;
        window.fetchApi("/releases", { method: "POST", body: JSON.stringify({ version: version.trim(), description: (desc || "").trim() }) }).then(function (r) {
          if (r && r.success) window.location.hash = "#/releases";
          else alert(r && r.error && r.error.message || "Error.");
        });
      };
    }

    runList();
  });
})();
