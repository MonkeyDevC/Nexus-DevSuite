/**
 * Documentos — GET /documents (page, limit), GET /documents/:id. Tabla ordenable, búsqueda, paginación, carga, empty state.
 * Listado devuelve data.data y data.meta (total, page, limit, totalPages).
 */
(function () {
  window.registerView("documents", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var docId = segs[1];
    if (docId) {
      window.setContent(window.showLoading());
      var body = await window.fetchApi("/documents/" + docId);
      if (body && body.success && body.data) {
        var d = body.data;
        var user = await window.getMe();
        var isMaster = user && user.role === "MASTER";
        function esc(x) { if (x == null) return ""; var el = document.createElement("div"); el.textContent = x; return el.innerHTML; }
        var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Documentos", href: "#/documents" }, { label: d.title || d.code, href: "" }]);
        html += '<div class="nexus-panel nexus-section-spacing"><h1 class="nexus-page-title">' + esc(d.title || d.code) + "</h1><p class=\"nexus-text-secondary\">Código: " + esc(d.code) + "</p><p>" + esc(d.description || "") + "</p>";
        var vers = d.versions || d.document_versions || [];
        if (vers.length) {
          html += "<h3 class=\"nexus-font-semibold mt-3\">Versiones</h3><div class=\"table-responsive\"><table class=\"table table-sm nexus-table\"><thead><tr><th>Versión</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>";
          vers.forEach(function (v) {
            html += "<tr><td>" + (v.version_number != null ? v.version_number : v.id) + "</td><td><span class=\"" + window.nexusBadgeClass(v.status) + "\">" + esc(v.status || "") + "</span></td><td>";
            if (isMaster && v.status === "DRAFT") html += '<button type="button" class="btn btn-link btn-sm p-0 doc-approve" data-version-id="' + v.id + '">Aprobar</button> ';
            if (isMaster) html += '<button type="button" class="btn btn-link btn-sm p-0 doc-archive" data-version-id="' + v.id + '">Archivar</button>';
            html += "</td></tr>";
          });
          html += "</tbody></table></div>";
        }
        html += '<a href="#/documents" class="btn btn-nexus-secondary btn-sm mt-3">Volver</a></div>';
        window.setContent(html);
      } else {
        window.setContent(window.showError(body && body.error && body.error.message));
      }
      return;
    }

    var state = { page: 1, limit: 10, search: "", sort: "title", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      return "?page=" + state.page + "&limit=" + state.limit;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["title", "code", "description"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Documentos", href: "" }]);
      html += '<h1 class="nexus-page-title">Documentos</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="doc-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<a href="#" id="doc-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo documento</a></div>';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay documentos") + "</p><p class=\"nexus-text-secondary\">Cree un documento o ajuste la búsqueda.</p></div>";
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Código", "code", state.sort, state.dir, setSort) + window.sortableTh("Título", "title", state.sort, state.dir, setSort) + "<th scope=\"col\">Última versión</th><th scope=\"col\">Estado</th><th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (d) {
          var lat = d.latest_version || d.versions ? (d.versions[0] ? d.versions[0].status : "—") : "—";
          var st = d.status || lat;
          html += "<tr><td>" + esc(d.code || "") + "</td><td><a href=\"#/documents/" + d.id + "\">" + esc(d.title || d.id) + "</a></td><td>" + (typeof lat === "object" ? (lat.status || "—") : lat) + "</td><td><span class=\"" + window.nexusBadgeClass(st) + "\">" + (typeof st === "string" ? st : "—") + "</span></td><td><a href=\"#/documents/" + d.id + "\" class=\"btn btn-link btn-sm p-0\">Ver</a></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="doc-pagination" class="mt-2"></div>';
      }
      html += "</div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function load() {
      window.setContent(window.showLoading());
      window.fetchApi("/documents" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var raw = data.data || data.items || (Array.isArray(data) ? data : []);
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var meta = data.meta || {};
          var total = meta.total != null ? meta.total : raw.length;
          var limit = meta.limit != null ? meta.limit : state.limit;
          var totalPages = state.search ? 1 : (meta.totalPages != null ? meta.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
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
      var search = document.getElementById("doc-search");
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; load(); }, 300); };
      }
      var pagEl = document.getElementById("doc-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btn = document.getElementById("doc-new");
      if (btn) btn.onclick = function (e) { e.preventDefault(); var code = prompt("Código"); var title = prompt("Título"); if (!code || !title) return; window.fetchApi("/documents", { method: "POST", body: JSON.stringify({ code: code.trim(), title: title.trim() }) }).then(function (r) { if (r && r.success) window.location.hash = "#/documents"; else alert(r && r.error && r.error.message || "Error."); }); };
    }

    load();
  });
})();
