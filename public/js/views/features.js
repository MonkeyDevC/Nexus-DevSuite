/**
 * Features — ETAPA 14: GET /projects/:id/features. Breadcrumb Dashboard/Projects/[Project]/Features, design system.
 */
(function () {
  function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  window.registerView("features", async function () {
    await window.showNav();
    window.setContent(window.showLoading());
    const projectsRes = await window.fetchApi("/projects");
    const projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];
    var match = window.location.hash.match(/[?&]project=([^&]+)/);
    var projectParam = match ? decodeURIComponent(match[1]) : (window.getHashSegments()[1] || "");

    var state = { projectId: projectParam || "", page: 1, limit: 10, status: "", search: "", sort: "title", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }

    function getDisplayItems(rawItems) {
      var filtered = window.filterBySearch(rawItems || [], ["title", "description"], state.search);
      return window.sortArray(filtered, state.sort, state.dir);
    }

    function renderList(items, meta, projectId) {
      var html = window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "Proyectos", href: "#/projects" },
        { label: projectId ? getProjectName(projectId) : "Proyecto", href: projectId ? "#/projects/" + projectId : "" },
        { label: "Features", href: "" }
      ]);
      html += '<h1 class="nexus-page-title">Features</h1>';
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<label class="form-label nexus-text-sm">Proyecto</label><select class="form-select form-select-sm mb-3 nexus-input" id="sel-project" style="max-width:320px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option>';
      projects.forEach(function (p) {
        html += "<option value=\"" + p.id + "\">" + esc(p.name || p.id) + "</option>";
      });
      html += "</select>";
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver las features.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      html += '<input type="search" id="feat-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="feat-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="DRAFT">DRAFT</option><option value="APPROVED">APPROVED</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="DONE">DONE</option><option value="ARCHIVED">ARCHIVED</option></select></label>';
      html += '<a href="#" id="feat-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nueva feature</a></div>';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay features") + "</p><p class=\"nexus-text-secondary\">Cree una feature o ajuste los filtros.</p></div>";
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Título de feature", "title", state.sort, state.dir, setSort) + window.sortableTh("Estado", "status", state.sort, state.dir, setSort) + "<th scope=\"col\">Cant. stories</th><th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (f) {
          var count = f.user_stories_count != null ? f.user_stories_count : (f.stories_count != null ? f.stories_count : "—");
          html += "<tr><td><a href=\"#/stories?feature=" + f.id + "\">" + esc(f.title || f.id) + "</a></td><td><span class=\"" + window.nexusBadgeClass(f.status) + "\">" + esc(f.status || "") + "</span></td><td>" + count + "</td><td><a href=\"#/stories?feature=" + f.id + "\" class=\"btn btn-link btn-sm p-0\">Stories</a></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="feat-pagination" class="mt-2"></div>';
      }
      html += "</div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function loadFeatures() {
      if (!state.projectId) {
        window.setContent(renderList(null, null, state.projectId));
        bindFeatures();
        return;
      }
      window.setContent(window.showLoading());
      window.fetchApi("/projects/" + state.projectId + "/features" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var rawItems = data.items || (Array.isArray(data) ? data : []);
          currentItems = rawItems;
          var toShow = getDisplayItems(rawItems);
          var total = data.total != null ? data.total : rawItems.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages = state.search ? 1 : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
          window.setContent(renderList(toShow, currentMeta, state.projectId));
          bindFeatures();
        } else {
          window.setContent(window.showError(body && body.error && body.error.message));
        }
      });
    }

    function refreshFromCurrent() {
      var toShow = getDisplayItems(currentItems);
      if (!currentMeta) currentMeta = { page: 1, limit: state.limit, total: currentItems.length, totalPages: 1 };
      if (state.search) currentMeta = { page: 1, limit: currentMeta.limit, total: toShow.length, totalPages: toShow.length ? 1 : 0 };
      window.setContent(renderList(toShow, currentMeta, state.projectId));
      bindFeatures();
    }

    function bindFeatures() {
      var sel = document.getElementById("sel-project");
      if (sel) {
        sel.value = state.projectId;
        sel.onchange = function () { state.projectId = sel.value; state.page = 1; currentItems = []; loadFeatures(); };
      }
      var st = document.getElementById("feat-status");
      var search = document.getElementById("feat-search");
      if (st) {
        st.value = state.status;
        st.onchange = function () { state.status = st.value; state.page = 1; loadFeatures(); };
      }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; loadFeatures(); }, 300); };
      }
      var pagEl = document.getElementById("feat-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; loadFeatures(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; loadFeatures(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btnNew = document.getElementById("feat-btn-new");
      if (btnNew) btnNew.onclick = function (e) {
        e.preventDefault();
        var title = prompt("Título de la feature");
        if (!title || !state.projectId) return;
        window.fetchApi("/projects/" + state.projectId + "/features", { method: "POST", body: JSON.stringify({ title: title.trim() }) }).then(function (r) {
          if (r && r.success) loadFeatures();
          else alert(r && r.error && r.error.message || "Error.");
        });
      };
    }

    state.projectId = projectParam;
    if (state.projectId) loadFeatures();
    else {
      window.setContent(renderList(null, null, ""));
      bindFeatures();
    }
  });
})();
