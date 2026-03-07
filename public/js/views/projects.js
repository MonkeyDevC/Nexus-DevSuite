/**
 * Projects — ETAPA 14: listado y detalle con design system.
 * GET /projects (page, limit, status), GET /projects/:id, POST (MASTER), PATCH archive.
 */
(function () {
  function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  window.registerView("projects", async function () {
    await window.showNav();
    const segs = window.getHashSegments();
    const projectId = segs[1];
    const user = await window.getMe();
    const isMaster = user && user.role === "MASTER";

    if (projectId) {
      window.setContent(window.showLoading());
      const body = await window.fetchApi("/projects/" + projectId);
      if (body && body.success && body.data) {
        const p = body.data;
        var html = window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Proyectos", href: "#/projects" },
          { label: p.name || "Proyecto" }
        ]);
        html += '<div class="nexus-panel nexus-section-spacing">';
        html += '<h1 class="nexus-page-title">' + esc(p.name || "Proyecto") + "</h1>";
        html += "<p class=\"nexus-text-secondary\">" + esc(p.description || "") + "</p>";
        html += "<p>Estado: <span class=\"" + window.nexusBadgeClass(p.status) + "\">" + esc(p.status || "") + "</span></p>";
        html += '<div class="mt-3"><a href="#/features?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm me-2">Features</a>';
        html += '<a href="#/sprints?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm me-2">Sprints</a>';
        html += '<a href="#/incidents?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm me-2">Incidentes</a>';
        if (isMaster && p.status !== "ARCHIVED") {
          html += '<button class="btn btn-outline-danger btn-sm" id="btn-archive">Archivar</button>';
        }
        html += ' <a href="#/projects" class="btn btn-nexus-secondary btn-sm">Volver</a></div>';
        html += "</div>";
        window.setContent(html);
        var btn = document.getElementById("btn-archive");
        if (btn) btn.onclick = async function () {
          var r = await window.fetchApi("/projects/" + p.id + "/archive", { method: "PATCH" });
          if (r && r.success) window.location.hash = "#/projects";
          else window.setContent(window.showError(r && r.error && r.error.message));
        };
      } else {
        window.setContent(window.showError(body && body.error && body.error.message));
      }
      return;
    }

    var state = { page: 1, limit: 10, status: "", search: "", sort: "name", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }

    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Proyectos", href: "" }]);
      html += '<h1 class="nexus-page-title">Proyectos</h1>';
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      html += '<input type="search" id="projects-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar proyectos">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="projects-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="ACTIVE">ACTIVE</option><option value="ARCHIVED">ARCHIVED</option></select></label>';
      if (isMaster) html += '<a href="#" id="btn-new-project" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo proyecto</a>';
      html += "</div>";

      if (!items || items.length === 0) {
        var msg = meta && state.search ? "No hay resultados para tu búsqueda o filtro." : "Aún no hay proyectos";
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + msg + "</p><p class=\"nexus-text-secondary\">Cree su primer proyecto para comenzar.</p>";
        if (isMaster) html += '<a href="#" id="btn-new-project-2" class="btn btn-nexus-primary">Crear proyecto</a>';
        html += "</div>";
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Nombre", "name", state.sort, state.dir, setSort) + window.sortableTh("Estado", "status", state.sort, state.dir, setSort) + window.sortableTh("Fecha de creación", "created_at", state.sort, state.dir, setSort) + "<th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (p) {
          var created = (p.created_at && p.created_at.slice) ? p.created_at.slice(0, 10) : (p.created_at || "—");
          html += "<tr><td><a href=\"#/projects/" + p.id + "\">" + esc(p.name || p.id) + "</a></td>";
          html += "<td><span class=\"" + window.nexusBadgeClass(p.status) + "\">" + esc(p.status || "") + "</span></td><td>" + esc(created) + "</td><td>";
          html += '<a href="#/projects/' + p.id + '" class="btn btn-link btn-sm p-0">Ver</a>';
          if (isMaster && p.status !== "ARCHIVED") html += ' <a href="#/projects/' + p.id + '" class="btn btn-link btn-sm p-0">Archivar</a>';
          html += "</td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="projects-pagination" class="mt-2"></div>';
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
      window.fetchApi("/projects" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var rawItems = data.items || (Array.isArray(data) ? data : data.data || []);
          currentItems = rawItems;
          var filtered = window.filterBySearch(rawItems, ["name", "description"], state.search);
          var sorted = window.sortArray(filtered, state.sort, state.dir);
          var total = data.total != null ? data.total : rawItems.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages;
          var toShow;
          if (state.search) {
            toShow = window.paginateClient(sorted, state.page, state.limit).items;
            totalPages = sorted.length === 0 ? 0 : Math.ceil(sorted.length / state.limit);
            currentMeta = { page: state.page, limit: state.limit, total: sorted.length, totalPages: totalPages };
          } else {
            toShow = sorted;
            totalPages = data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit));
            currentMeta = { page: state.page, limit: limit, total: total, totalPages: totalPages };
          }
          window.setContent(renderList(toShow, currentMeta));
          bindProjects();
        } else {
          window.setContent(window.showError(body && body.error && body.error.message));
        }
      });
    }

    function refreshFromCurrent() {
      var filtered = window.filterBySearch(currentItems, ["name", "description"], state.search);
      var sorted = window.sortArray(filtered, state.sort, state.dir);
      var toShow = state.search ? window.paginateClient(sorted, state.page, state.limit).items : sorted;
      if (state.search) currentMeta = { page: state.page, limit: state.limit, total: sorted.length, totalPages: Math.ceil(sorted.length / state.limit) || 1 };
      else if (!currentMeta) currentMeta = { page: state.page, limit: state.limit, total: currentItems.length, totalPages: 1 };
      window.setContent(renderList(toShow, currentMeta));
      bindProjects();
    }

    function bindProjects() {
      var st = document.getElementById("projects-status");
      var search = document.getElementById("projects-search");
      if (st) {
        st.value = state.status;
        st.onchange = function () { state.status = st.value; state.page = 1; runList(); };
      }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () {
          clearTimeout(t);
          t = setTimeout(function () { state.search = search.value; state.page = 1; runList(); }, 300);
        };
      }
      var pagEl = document.getElementById("projects-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; runList(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) {
            a.onclick = function (e) {
              e.preventDefault();
              var p = parseInt(a.getAttribute("data-page"), 10);
              if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; runList(); }
            };
          }
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      function doNew() {
        var name = prompt("Nombre del proyecto");
        var desc = prompt("Descripción");
        if (!name) return;
        window.fetchApi("/projects", { method: "POST", body: JSON.stringify({ name: name.trim(), description: (desc || "").trim() }) }).then(function (r) {
          if (r && r.success) window.location.hash = "#/projects";
          else alert(r && r.error && r.error.message || "Error.");
        });
      }
      var btnNew = document.getElementById("btn-new-project");
      if (btnNew) btnNew.onclick = function (e) { e.preventDefault(); doNew(); };
      var btnNew2 = document.getElementById("btn-new-project-2");
      if (btnNew2) btnNew2.onclick = function (e) { e.preventDefault(); doNew(); };
    }

    runList();
  });
})();
