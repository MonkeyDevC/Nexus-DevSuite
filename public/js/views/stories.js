/**
 * Stories — Proyecto → Feature → GET /features/:id/stories (page, limit, status). Breadcrumbs, tabla ordenable, filtros, búsqueda, paginación, badges.
 */
(function () {
  window.registerView("stories", async function () {
    await window.showNav();
    window.setContent(window.showLoading());
    const projectsRes = await window.fetchApi("/projects");
    const projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];

    var state = { projectId: "", featureId: "", page: 1, limit: 10, status: "", search: "", sort: "title", dir: "asc" };
    var featuresList = [];
    var currentMeta = null;
    var currentItems = [];

    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }
    function getFeatureTitle(id) {
      var f = featuresList.find(function (x) { return x.id === id; });
      return (f && f.title) || id;
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

    function renderList(items, meta, showBreadcrumb) {
      var html = "";
      if (showBreadcrumb && state.projectId && state.featureId) {
        html += window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Proyectos", href: "#/projects" },
          { label: getProjectName(state.projectId), href: "#/projects/" + state.projectId },
          { label: "Features", href: "#/features?project=" + state.projectId },
          { label: getFeatureTitle(state.featureId), href: "" },
          { label: "Stories", href: "" }
        ]);
      } else {
        html += window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Stories", href: "" }]);
      }
      html += '<h1 class="nexus-page-title">Stories</h1>';
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<label class="form-label nexus-text-sm">Proyecto</label><select class="form-select form-select-sm mb-2 nexus-input" id="stories-sel-project" style="max-width:320px"><option value="">Seleccionar</option>';
      projects.forEach(function (p) { html += "<option value=\"" + p.id + "\">" + (p.name || p.id) + "</option>"; });
      html += '</select><label class="form-label nexus-text-sm">Feature</label><select class="form-select form-select-sm mb-3 nexus-input" id="stories-sel-feature" style="max-width:320px"><option value="">Seleccione primero un proyecto</option></select>';
      if (!state.featureId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione proyecto y feature</p><p class="nexus-text-secondary">Elija un proyecto y una feature para ver las stories.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="stories-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="stories-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="DRAFT">DRAFT</option><option value="READY">READY</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="BLOCKED">BLOCKED</option><option value="IN_REVIEW">IN_REVIEW</option><option value="DONE">DONE</option><option value="ARCHIVED">ARCHIVED</option></select></label>';
      html += '<a href="#" id="stories-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nueva story</a></div>';
      html += '<div id="stories-list">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Aún no hay stories</p><p class="nexus-text-secondary">Cree la primera story de esta feature.</p><a href="#" id="stories-btn-new-2" class="btn btn-nexus-primary">Crear primera story</a></div>';
      } else {
        html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr>';
        html += '<th scope="col">ID story</th>' + window.sortableTh("Título", "title", state.sort, state.dir, setSort) + window.sortableTh("Estado", "status", state.sort, state.dir, setSort) + "<th scope=\"col\">Sprint asignado</th><th scope=\"col\">Prioridad</th><th scope=\"col\">Asignado</th><th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (s) {
          html += "<tr><td>" + (s.id ? String(s.id).slice(0, 8) : "—") + "</td><td>" + (s.title || "—") + "</td><td><span class=\"" + window.nexusBadgeClass(s.status) + "\">" + (s.status || "") + "</span></td><td>" + (s.sprint_id ? "—" : "—") + "</td><td>" + (s.priority || "—") + "</td><td>" + (s.assignee ? (s.assignee.email || s.assigned_to) : "—") + "</td><td><a href=\"#/stories?feature=" + state.featureId + "\" class=\"btn btn-link btn-sm p-0\">Ver</a></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="stories-pagination" class="mt-2"></div>';
      }
      html += "</div></div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function loadStories() {
      if (!state.featureId) {
        window.setContent(renderList(null, null, false));
        bindStories();
        return;
      }
      window.setContent(window.showLoading());
      window.fetchApi("/features/" + state.featureId + "/stories" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var rawItems = data.items || (Array.isArray(data) ? data : []);
          currentItems = rawItems;
          var toShow = getDisplayItems(rawItems);
          var total = data.total != null ? data.total : rawItems.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages = state.search ? 1 : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
          window.setContent(renderList(toShow, currentMeta, true));
          bindStories();
        } else {
          window.setContent(window.showError(body && body.error && body.error.message));
        }
      });
    }

    function refreshFromCurrent() {
      var toShow = getDisplayItems(currentItems);
      if (!currentMeta) currentMeta = { page: 1, limit: state.limit, total: currentItems.length, totalPages: 1 };
      if (state.search) currentMeta = { page: 1, limit: currentMeta.limit, total: toShow.length, totalPages: toShow.length ? 1 : 0 };
      window.setContent(renderList(toShow, currentMeta, true));
      bindStories();
    }

    function bindStories() {
      var selProject = document.getElementById("stories-sel-project");
      var selFeature = document.getElementById("stories-sel-feature");
      if (selProject) {
        selProject.value = state.projectId;
        selProject.onchange = async function () {
          state.projectId = selProject.value;
          state.featureId = "";
          currentItems = [];
          selFeature.innerHTML = "<option value=\"\">Cargando...</option>";
          if (!state.projectId) {
            selFeature.innerHTML = "<option value=\"\">Seleccione proyecto primero</option>";
            window.setContent(renderList(null, null, false));
            bindStories();
            return;
          }
          var body = await window.fetchApi("/projects/" + state.projectId + "/features");
          featuresList = (body && body.success && body.data && body.data.items) ? body.data.items : [];
          selFeature.innerHTML = "<option value=\"\">Seleccione feature</option>" + featuresList.map(function (f) {
            return "<option value=\"" + f.id + "\">" + (f.title || f.id) + "</option>";
          }).join("");
          window.setContent(renderList(null, null, false));
          bindStories();
        };
      }
      if (selFeature) {
        selFeature.value = state.featureId;
        selFeature.onchange = function () { state.featureId = selFeature.value; state.page = 1; loadStories(); };
      }
      var st = document.getElementById("stories-status");
      var search = document.getElementById("stories-search");
      if (st) { st.value = state.status; st.onchange = function () { state.status = st.value; state.page = 1; loadStories(); }; }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; loadStories(); }, 300); };
      }
      var pagEl = document.getElementById("stories-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; loadStories(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; loadStories(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      function doNew() {
        if (!state.featureId) return;
        var title = prompt("Título de la story");
        if (!title) return;
        window.fetchApi("/features/" + state.featureId + "/stories", { method: "POST", body: JSON.stringify({ title: title.trim() }) }).then(function (r) {
          if (r && r.success) loadStories();
          else alert(r && r.error && r.error.message || "Error.");
        });
      }
      var bn = document.getElementById("stories-btn-new");
      if (bn) bn.onclick = function (e) { e.preventDefault(); doNew(); };
      var bn2 = document.getElementById("stories-btn-new-2");
      if (bn2) bn2.onclick = function (e) { e.preventDefault(); doNew(); };
    }

    var segs = window.getHashSegments();
    var hash = window.location.hash;
    var qIdx = hash.indexOf("?");
    if (qIdx !== -1) {
      hash.substring(qIdx + 1).split("&").forEach(function (pair) {
        var kv = pair.split("=");
        if (kv[0] === "feature" && kv[1]) state.featureId = decodeURIComponent(kv[1]);
        if (kv[0] === "project" && kv[1]) state.projectId = decodeURIComponent(kv[1]);
      });
    }
    if (segs[1] && segs[1].indexOf("?") !== 0) state.projectId = segs[1];
    if (segs[2]) state.featureId = segs[2];
    if (state.projectId) {
      var body = await window.fetchApi("/projects/" + state.projectId + "/features");
      featuresList = (body && body.success && body.data && body.data.items) ? body.data.items : [];
    }
    window.setContent(renderList(null, null, false));
    bindStories();
    var selProject = document.getElementById("stories-sel-project");
    if (selProject) selProject.value = state.projectId;
    if (state.projectId && state.featureId && featuresList.some(function (f) { return f.id === state.featureId; })) {
      var selFeature = document.getElementById("stories-sel-feature");
      if (selFeature) {
        selFeature.innerHTML = "<option value=\"\">Seleccione feature</option>" + featuresList.map(function (f) { return "<option value=\"" + f.id + "\">" + (f.title || f.id) + "</option>"; }).join("");
        selFeature.value = state.featureId;
      }
      loadStories();
    }
  });
})();
