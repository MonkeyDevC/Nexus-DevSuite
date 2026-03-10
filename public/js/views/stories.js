/**
 * Stories — Proyecto → Feature → GET /features/:id/stories (page, limit, status). Breadcrumbs, tabla ordenable, filtros, búsqueda, paginación, badges.
 */
(function () {
  function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  window.registerView("stories", async function () {
    await window.showNav();
    window.setContent(window.showLoading());
    const projectsRes = await window.fetchApi("/projects");
    const projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];

    var state = { projectId: "", featureId: "", page: 1, limit: 10, statusFilter: [], search: "", sort: "title", dir: "asc", sprintsList: [] };
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
      if (state.statusFilter && state.statusFilter.length === 1) q += "&status=" + encodeURIComponent(state.statusFilter[0]);
      return q;
    }

    function displayId(s) {
      return "US-" + (s.number != null ? s.number : (s.id ? String(s.id).slice(0, 8) : ""));
    }
    function getDisplayItems(rawItems) {
      var withDisplayId = (rawItems || []).map(function (s) {
        return Object.assign({}, s, { displayId: displayId(s) });
      });
      var filtered = window.filterBySearch(withDisplayId, ["title", "description", "displayId"], state.search);
      if (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 7) {
        filtered = filtered.filter(function (s) { return state.statusFilter.indexOf(s.status) !== -1; });
      }
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
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-1">';
      html += '<label class="mb-0 nexus-text-sm">Proyecto</label>';
      html += '<select class="form-select form-select-sm nexus-input" id="stories-sel-project" style="max-width:280px"><option value="">Seleccionar</option>';
      projects.forEach(function (p) { html += "<option value=\"" + p.id + "\">" + (p.name || p.id) + "</option>"; });
      html += '</select>';
      html += '<label class="mb-0 nexus-text-sm ms-2">Feature</label>';
      html += '<select class="form-select form-select-sm nexus-input" id="stories-sel-feature" style="max-width:280px">';
      if (!state.projectId) {
        html += '<option value="">Seleccione primero un proyecto</option>';
      } else if (featuresList.length === 0) {
        html += '<option value="">Seleccione feature</option>';
      } else {
        html += '<option value="">Seleccione feature</option>';
        featuresList.forEach(function (f) { html += '<option value="' + f.id + '">' + esc(f.title || f.id) + '</option>'; });
      }
      html += '</select>';
      html += '<a href="#" id="stories-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nueva story</a>';
      html += '</div>';
      if (!state.featureId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione proyecto y feature</p><p class="nexus-text-secondary">Elija un proyecto y una feature para ver las stories.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div id="stories-list">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Aún no hay stories</p><p class="nexus-text-secondary">Cree la primera story de esta feature.</p><a href="#" id="stories-btn-new-2" class="btn btn-nexus-primary">Crear primera story</a></div>';
      } else {
        var storyStatuses = ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"];
        var statusSortArrow = state.sort === "status" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var titleSortArrow = state.sort === "title" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var allStoryStatusSelected = state.statusFilter.length === 0 || state.statusFilter.length === 7;
        var estadoHeaderHtml = '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
        estadoHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="status">Estado' + statusSortArrow + '</a>';
        estadoHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="stories-status-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="true" aria-expanded="false" aria-haspopup="true" aria-label="Filtrar por estado" title="Filtrar"><span aria-hidden="true">&#9662;</span></button>';
        estadoHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end" id="stories-status-filter-menu" style="min-width:220px; max-height:min(320px, 50vh); overflow-y:auto">';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="stories-status-sort-asc">Ordenar de A a Z</a></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="stories-status-sort-desc">Ordenar de Z a A</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="stories-status-clear">Borrar filtro de Estado</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2"><input type="text" class="form-control form-control-sm" id="stories-status-search" placeholder="Buscar" aria-label="Buscar estado"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2" id="stories-status-checklist">';
        estadoHeaderHtml += '<div class="form-check"><input class="form-check-input" type="checkbox" id="stories-status-select-all"' + (allStoryStatusSelected ? ' checked' : '') + '> <label class="form-check-label" for="stories-status-select-all">(Seleccionar todo)</label></div>';
        storyStatuses.forEach(function (s) {
          estadoHeaderHtml += '<div class="form-check"><input class="form-check-input stories-status-cb" type="checkbox" value="' + (s || "").replace(/"/g, "&quot;") + '" id="stories-status-' + (s || "").replace(/"/g, "&quot;") + '"' + (state.statusFilter.length === 0 || state.statusFilter.indexOf(s) !== -1 ? ' checked' : '') + '> <label class="form-check-label" for="stories-status-' + (s || "").replace(/"/g, "&quot;") + '">' + (s || "") + '</label></div>';
        });
        estadoHeaderHtml += '</li>';
        estadoHeaderHtml += '<li class="px-3 pb-2"><button type="button" class="btn btn-primary btn-sm w-100" id="stories-status-apply">Aplicar</button></li>';
        estadoHeaderHtml += '</ul></div>';
        var tituloHeaderHtml = '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
        tituloHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="title">Título' + titleSortArrow + '</a>';
        tituloHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="stories-titulo-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="outside" aria-expanded="false" aria-haspopup="true" aria-label="Buscar por título o ID" title="Buscar"><span aria-hidden="true">&#9662;</span></button>';
        tituloHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end stories-titulo-dropdown-menu" id="stories-titulo-filter-menu" style="min-width:280px; max-width:360px; max-height:min(400px, 60vh); overflow:hidden; padding:0">';
        tituloHeaderHtml += '<li class="px-3 py-2 border-bottom"><input type="search" class="form-control form-control-sm" id="stories-search-titulo" placeholder="Buscar por título o ID (ej. US-2)..." aria-label="Buscar" value="' + esc(state.search || "") + '"></li>';
        tituloHeaderHtml += '<li class="px-0 py-0 flex-grow-1 overflow-y-auto" style="max-height:240px"><ul class="list-unstyled mb-0" id="stories-titulo-matches">';
        (currentItems || []).forEach(function (s) {
          var did = displayId(s);
          var tit = (s.title || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
          var desc = (s.description || "").replace(/</g, "&lt;").replace(/"/g, "&quot;").slice(0, 200);
          tituloHeaderHtml += '<li class="dropdown-item stories-titulo-match border-bottom" data-display-id="' + esc(did) + '" data-title="' + esc(tit) + '" data-description="' + esc(desc) + '" style="cursor:pointer; white-space:normal">' + esc(did) + ' — ' + esc(s.title || "—") + '</li>';
        });
        tituloHeaderHtml += '</ul></li>';
        tituloHeaderHtml += '<li class="px-3 py-2 border-top bg-light"><button type="button" class="btn btn-primary btn-sm me-1" id="stories-titulo-apply">Aplicar</button><button type="button" class="btn btn-outline-secondary btn-sm" id="stories-titulo-clear">Borrar filtro</button></li>';
        tituloHeaderHtml += '</ul>';
        html += window.renderNexusTable({
          columns: [
            { label: "ID story" },
            { headerHtml: tituloHeaderHtml },
            { headerHtml: estadoHeaderHtml },
            { label: "Sprint asignado" },
            { label: "Prioridad" },
            { label: "Asignado" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (s) {
            return [
              (s.displayId != null ? s.displayId : displayId(s)),
              (s.title || "—"),
              "<span class=\"" + window.nexusBadgeClass(s.status) + "\">" + (s.status || "") + "</span>",
              '<span class="story-sprint-cell d-inline-flex align-items-center gap-1"><span class="story-sprint-display">' + (s.sprint ? esc(s.sprint.name) : "—") + '</span><a href="#" class="story-sprint-edit btn btn-link btn-sm p-0 ms-1 text-secondary" data-story-id="' + esc(s.id) + '" data-sprint-id="' + (s.sprint_id || "") + '" title="Asignar sprint" aria-label="Editar sprint">&#9998;</a></span>',
              (s.priority || "—"),
              (s.assignee ? ((s.assignee.name && String(s.assignee.name).trim()) ? String(s.assignee.name).trim() : (s.assignee.email || "—")) : "—"),
              '<div class="nexus-table-actions"><a href="#" class="nexus-action-view story-view-btn" data-story-id="' + esc(s.id) + '">Ver</a></div>'
            ];
          }
        });
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
      var projectId = state.projectId;
      Promise.all([
        window.fetchApi("/features/" + state.featureId + "/stories" + buildQuery()),
        projectId ? window.fetchApi("/projects/" + projectId + "/sprints?limit=50") : Promise.resolve(null)
      ]).then(function (results) {
        var body = results[0];
        if (body && body.success && body.data) {
          var sprintsRes = results[1];
          var rawSprints = (sprintsRes && sprintsRes.success && sprintsRes.data) ? sprintsRes.data : null;
          state.sprintsList = Array.isArray(rawSprints) ? rawSprints : (rawSprints && rawSprints.data) ? rawSprints.data : (rawSprints && rawSprints.items) ? rawSprints.items : [];
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
          if (selFeature) selFeature.innerHTML = "<option value=\"\">Cargando...</option>";
          if (!state.projectId) {
            if (selFeature) selFeature.innerHTML = "<option value=\"\">Seleccione proyecto primero</option>";
            window.setContent(renderList(null, null, false));
            bindStories();
            return;
          }
          var body = await window.fetchApi("/projects/" + state.projectId + "/features");
          featuresList = (body && body.success && body.data && body.data.items) ? body.data.items : [];
          window.setContent(renderList(null, null, false));
          bindStories();
          var selFeat = document.getElementById("stories-sel-feature");
          if (selFeat && featuresList.length) selFeat.innerHTML = "<option value=\"\">Seleccione feature</option>" + featuresList.map(function (f) { return "<option value=\"" + f.id + "\">" + (f.title || f.id) + "</option>"; }).join("");
        };
      }
      if (selFeature) {
        selFeature.value = state.featureId;
        selFeature.onchange = function () { state.featureId = selFeature.value; state.page = 1; loadStories(); };
      }
      var sortAsc = document.getElementById("stories-status-sort-asc");
      if (sortAsc) sortAsc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "asc"; state.page = 1; refreshFromCurrent(); };
      var sortDesc = document.getElementById("stories-status-sort-desc");
      if (sortDesc) sortDesc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "desc"; state.page = 1; refreshFromCurrent(); };
      var clearFilter = document.getElementById("stories-status-clear");
      if (clearFilter) clearFilter.onclick = function (e) { e.preventDefault(); state.statusFilter = []; state.page = 1; loadStories(); };
      var selectAll = document.getElementById("stories-status-select-all");
      if (selectAll) selectAll.onclick = function () {
        var checked = this.checked;
        document.querySelectorAll("#content .stories-status-cb").forEach(function (cb) { cb.checked = checked; });
      };
      document.querySelectorAll("#content .stories-status-cb").forEach(function (cb) {
        cb.onclick = function () {
          var all = document.querySelectorAll("#content .stories-status-cb");
          var allChecked = all.length && Array.prototype.every.call(all, function (c) { return c.checked; });
          var selAllEl = document.getElementById("stories-status-select-all");
          if (selAllEl) selAllEl.checked = allChecked;
        };
      });
      var statusSearch = document.getElementById("stories-status-search");
      if (statusSearch) {
        statusSearch.value = "";
        statusSearch.oninput = function () {
          var q = (this.value || "").toLowerCase().trim();
          document.querySelectorAll("#content #stories-status-checklist .form-check").forEach(function (wrap) {
            var cb = wrap.querySelector(".stories-status-cb");
            if (!cb) return;
            var label = (wrap.querySelector("label") || {}).textContent || "";
            wrap.style.display = (q === "" || label.toLowerCase().indexOf(q) !== -1) ? "" : "none";
          });
        };
      }
      var applyBtn = document.getElementById("stories-status-apply");
      if (applyBtn) applyBtn.onclick = function () {
        var selected = [];
        document.querySelectorAll("#content .stories-status-cb:checked").forEach(function (cb) { selected.push(cb.value); });
        state.statusFilter = (selected.length === 0 || selected.length === 7) ? [] : selected;
        state.page = 1;
        loadStories();
      };
      var searchTitulo = document.getElementById("stories-search-titulo");
      if (searchTitulo) {
        searchTitulo.oninput = function () {
          var term = (this.value || "").trim().toLowerCase();
          document.querySelectorAll("#content .stories-titulo-match").forEach(function (el) {
            var did = (el.getAttribute("data-display-id") || "").toLowerCase();
            var tit = (el.getAttribute("data-title") || "").toLowerCase();
            var desc = (el.getAttribute("data-description") || "").toLowerCase();
            var show = !term || did.indexOf(term) !== -1 || tit.indexOf(term) !== -1 || desc.indexOf(term) !== -1;
            el.style.display = show ? "" : "none";
          });
        };
      }
      var tituloApply = document.getElementById("stories-titulo-apply");
      if (tituloApply) tituloApply.onclick = function () {
        var inp = document.getElementById("stories-search-titulo");
        state.search = inp ? inp.value : "";
        state.page = 1;
        var dd = document.getElementById("stories-titulo-filter-btn");
        if (dd && window.bootstrap && window.bootstrap.Dropdown) {
          var inst = window.bootstrap.Dropdown.getInstance(dd);
          if (inst) inst.hide();
        }
        refreshFromCurrent();
      };
      var tituloClear = document.getElementById("stories-titulo-clear");
      if (tituloClear) tituloClear.onclick = function () {
        var inp = document.getElementById("stories-search-titulo");
        if (inp) inp.value = "";
        state.search = "";
        state.page = 1;
        var dd = document.getElementById("stories-titulo-filter-btn");
        if (dd && window.bootstrap && window.bootstrap.Dropdown) {
          var inst = window.bootstrap.Dropdown.getInstance(dd);
          if (inst) inst.hide();
        }
        refreshFromCurrent();
      };
      document.querySelectorAll("#content .stories-titulo-match").forEach(function (el) {
        el.onclick = function (e) {
          e.preventDefault();
          var did = el.getAttribute("data-display-id");
          var inp = document.getElementById("stories-search-titulo");
          if (inp && did != null) { inp.value = did; }
        };
      });
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
      document.getElementById("content").addEventListener("click", function (e) {
        var editBtn = e.target && e.target.closest && e.target.closest(".story-sprint-edit");
        if (editBtn) {
          e.preventDefault();
          var storyId = editBtn.getAttribute("data-story-id");
          var currentSprintId = editBtn.getAttribute("data-sprint-id") || "";
          var td = editBtn.closest("td");
          if (!td || !storyId) return;
          var opts = state.sprintsList || [];
          td.classList.add("story-sprint-edit-cell");
          var selectHtml = '<select class="form-select form-select-sm story-sprint-select nexus-input" data-story-id="' + (storyId.replace(/"/g, "&quot;")) + '"><option value="">Ninguno</option>';
          opts.forEach(function (sp) {
            var sel = (sp.id === currentSprintId) ? " selected" : "";
            selectHtml += "<option value=\"" + (sp.id || "").replace(/"/g, "&quot;") + "\"" + sel + ">" + esc(sp.name || sp.id || "") + "</option>";
          });
          selectHtml += "</select>";
          td.innerHTML = '<div class="story-sprint-select-wrap">' + selectHtml + "</div>";
          var sel = td.querySelector(".story-sprint-select");
          if (sel) {
            sel.focus();
            sel.onchange = function () {
              var val = sel.value || null;
              window.fetchApi("/stories/" + storyId + "/sprint", { method: "PATCH", body: JSON.stringify({ sprint_id: val }) }).then(function (r) {
                if (r && r.success) loadStories();
                else if (r && r.error) window.openNexusAlertModal({ title: "Error", message: r.error.message || "No se pudo asignar el sprint." });
              });
            };
          }
          return;
        }
        var btn = e.target && e.target.closest && e.target.closest(".story-view-btn");
        if (!btn) return;
        e.preventDefault();
        var storyId = btn.getAttribute("data-story-id");
        if (!storyId) return;
        window.fetchApi("/stories/" + storyId).then(async function (res) {
          if (!res || !res.success || !res.data) {
            window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "No se pudo cargar la story." });
            return;
          }
          var s = res.data;
          var projectIdForSprints = state.projectId;
          if (s.feature_id) {
            try {
              var featRes = await window.fetchApi("/features/" + s.feature_id);
              if (featRes && featRes.success && featRes.data && featRes.data.project_id) projectIdForSprints = featRes.data.project_id;
            } catch (err) {}
          }
          var did = displayId(s);
          var assigneeText = s.assignee ? ((s.assignee.name && String(s.assignee.name).trim()) ? String(s.assignee.name).trim() : (s.assignee.email || "")) || "—" : "No asignado";
          if (s.assignee && !assigneeText) assigneeText = s.assignee.email || "No name";
          var criteriaLines = [];
          if (s.acceptance_criteria && typeof s.acceptance_criteria === "object") {
            var items = Array.isArray(s.acceptance_criteria) ? s.acceptance_criteria : (s.acceptance_criteria.items || Object.keys(s.acceptance_criteria).map(function (k) { return s.acceptance_criteria[k]; }));
            if (items && items.length) criteriaLines = items.map(function (c) { return typeof c === "string" ? c : (c && c.text) ? c.text : JSON.stringify(c); });
          }
          var criteriaTextareaValue = esc(criteriaLines.join("\n"));
          var sprintSelectHtml = '<span class="nexus-text-sm text-muted">Sprint</span><div class="d-flex align-items-center gap-2 mt-1"><select id="story-detail-sprint" class="form-select form-select-sm" style="max-width:220px"><option value="">Ninguno</option></select><span id="story-detail-sprint-msg" class="nexus-text-sm text-muted"></span></div>';
          var bodyHtml = '<div class="nexus-card p-4" style="max-width:100%">';
          bodyHtml += '<div class="row g-3">';
          bodyHtml += '<div class="col-12"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + esc(did) + '</p></div>';
          bodyHtml += '<div class="col-12"><span class="nexus-text-sm text-muted">Título</span><p class="mb-0">' + esc(s.title || "—") + '</p></div>';
          bodyHtml += '<div class="col-12"><span class="nexus-text-sm text-muted">Descripción</span><p class="mb-0" style="white-space:pre-wrap">' + esc(s.description || "—") + '</p></div>';
          bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted">Estado</span><p class="mb-0"><span class="' + window.nexusBadgeClass(s.status) + '">' + esc(s.status || "") + '</span></p></div>';
          bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted">Prioridad</span><p class="mb-0">' + esc(s.priority || "—") + '</p></div>';
          bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted">Asignado a</span><p class="mb-0">' + esc(assigneeText) + '</p></div>';
          bodyHtml += '<div class="col-12">' + sprintSelectHtml + '</div>';
          bodyHtml += '<div class="col-12"><span class="nexus-text-sm text-muted">Criterios de aceptación</span><div class="mt-1"><textarea id="story-detail-criteria" class="form-control nexus-input" rows="4" placeholder="Un criterio por línea" aria-label="Criterios de aceptación">' + criteriaTextareaValue + '</textarea><button type="button" id="story-detail-criteria-save" class="btn btn-nexus-primary btn-sm mt-2">Guardar criterios</button><span id="story-detail-criteria-msg" class="ms-2 nexus-text-sm text-muted"></span></div></div>';
          bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + (s.created_at ? esc(s.created_at) : "—") + '</p></div>';
          bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted">Actualizado</span><p class="mb-0 nexus-text-sm">' + (s.updated_at ? esc(s.updated_at) : "—") + '</p></div>';
          bodyHtml += '</div></div>';
          window.openNexusFormModal({ id: "storyDetailModal", title: "Detalle de la story", bodyHtml: bodyHtml, primaryButtonId: "story-detail-close", primaryLabel: "Cerrar" }, function (bsModal) { bsModal.hide(); });
          var criteriaSaveBtn = document.getElementById("story-detail-criteria-save");
          if (criteriaSaveBtn) criteriaSaveBtn.onclick = function () {
            var textarea = document.getElementById("story-detail-criteria");
            var msgEl = document.getElementById("story-detail-criteria-msg");
            if (!textarea) return;
            var lines = (textarea.value || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
            var payload = { acceptance_criteria: lines };
            if (msgEl) msgEl.textContent = "Guardando…";
            window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify(payload) }).then(function (r) {
              if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
              if (r && r.success && typeof loadStories === "function") loadStories();
            });
          };
          var sprintsPromise = projectIdForSprints ? window.fetchApi("/projects/" + projectIdForSprints + "/sprints?limit=50") : Promise.resolve(null);
          sprintsPromise.then(function (sprintsRes) {
            var raw = (sprintsRes && sprintsRes.success && sprintsRes.data) ? sprintsRes.data : null;
            var list = Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : (raw && raw.items) ? raw.items : [];
            var seen = {};
            list = list.filter(function (sp) {
              var id = (sp.id != null ? String(sp.id) : "");
              if (seen[id]) return false;
              seen[id] = true;
              return true;
            });
            var sel = document.getElementById("story-detail-sprint");
            var msgEl = document.getElementById("story-detail-sprint-msg");
            if (!sel) return;
            sel.innerHTML = '<option value="">Ninguno</option>';
            list.forEach(function (sp) {
              var opt = document.createElement("option");
              opt.value = sp.id || "";
              opt.textContent = sp.name || sp.id || "";
              if ((s.sprint_id && sp.id === s.sprint_id) || (s.sprint && sp.id === s.sprint.id)) opt.selected = true;
              sel.appendChild(opt);
            });
            sel.onchange = function () {
              var val = sel.value || null;
              if (msgEl) msgEl.textContent = "Guardando…";
              window.fetchApi("/stories/" + storyId + "/sprint", { method: "PATCH", body: JSON.stringify({ sprint_id: val }) }).then(function (r) {
                if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
                if (r && r.success) loadStories();
              });
            };
          });
        });
      });
      (function () {
        var popperFixed = function (defaultConfig) { return Object.assign({}, defaultConfig || {}, { strategy: "fixed" }); };
        var statusBtn = document.getElementById("stories-status-filter-btn");
        var tituloBtn = document.getElementById("stories-titulo-filter-btn");
        if (window.bootstrap && window.bootstrap.Dropdown) {
          if (statusBtn) {
            try {
              var sInst = window.bootstrap.Dropdown.getInstance(statusBtn);
              if (sInst) sInst.dispose();
              new window.bootstrap.Dropdown(statusBtn, { popperConfig: popperFixed });
            } catch (err) {}
          }
          if (tituloBtn) {
            try {
              var tInst = window.bootstrap.Dropdown.getInstance(tituloBtn);
              if (tInst) tInst.dispose();
              new window.bootstrap.Dropdown(tituloBtn, { popperConfig: popperFixed });
            } catch (err) {}
          }
        }
      })();
      function doNew() {
        if (!state.featureId) {
          window.openNexusAlertModal({ title: "Nueva story", message: "Seleccione una feature." });
          return;
        }
        var usersPromise = window.fetchApi("/users?limit=50");
        var sprintsPromise = state.projectId ? window.fetchApi("/projects/" + state.projectId + "/sprints?limit=50") : Promise.resolve(null);
        Promise.all([usersPromise, sprintsPromise]).then(function (results) {
          var usersRes = results[0];
          var sprintsRes = results[1];
          var raw = (usersRes && usersRes.success && usersRes.data) ? usersRes.data : null;
          var users = Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : (raw && raw.items) ? raw.items : [];
          var rawSprints = (sprintsRes && sprintsRes.success && sprintsRes.data) ? sprintsRes.data : null;
          var sprintList = Array.isArray(rawSprints) ? rawSprints : (rawSprints && rawSprints.data) ? rawSprints.data : (rawSprints && rawSprints.items) ? rawSprints.items : [];
          var seenSprint = {};
          sprintList = sprintList.filter(function (sp) { var id = (sp.id != null ? String(sp.id) : ""); if (seenSprint[id]) return false; seenSprint[id] = true; return true; });
          function userDisplayName(u) {
            if (!u) return null;
            var n = u.name && String(u.name).trim();
            return n || null;
          }
          var bodyHtml = '<div class="mb-3"><label class="form-label">Título de la story</label><input type="text" id="story-form-title" class="form-control" placeholder="Título de la story" required></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="story-form-desc" class="form-control" rows="3" placeholder="Descripción de la story" required></textarea></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Prioridad</label><select id="story-form-priority" class="form-select"><option value="MEDIUM" selected>Media</option><option value="LOW">Baja</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Sprint</label><select id="story-form-sprint" class="form-select"><option value="">Ninguno</option>';
          sprintList.forEach(function (sp) { bodyHtml += '<option value="' + (sp.id || "").replace(/"/g, "&quot;") + '">' + esc(sp.name || sp.id || "") + '</option>'; });
          bodyHtml += '</select><small class="form-text text-muted">Sprint del proyecto (opcional)</small></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Asignado a</label>';
          bodyHtml += '<input type="hidden" id="story-form-assigned" value="">';
          bodyHtml += '<div class="position-relative"><button type="button" id="story-form-assigned-trigger" class="form-select form-control text-start d-block" style="cursor:pointer" aria-haspopup="listbox" aria-expanded="false">Nadie (sin asignar)</button>';
          bodyHtml += '<div id="story-form-assigned-dropdown" class="border rounded bg-white shadow-sm position-absolute start-0 end-0 mt-1 d-none" style="z-index:1060; max-height:280px; min-width:100%">';
          bodyHtml += '<input type="text" id="story-form-assigned-filter" class="form-control form-control-sm border-0 border-bottom rounded-0" placeholder="Filtrar por nombre..." aria-label="Filtrar por nombre" style="outline:none">';
          bodyHtml += '<div id="story-form-assigned-list" class="story-form-assigned-list-scroll" style="height:200px; overflow-y:scroll; overflow-x:hidden">';
          bodyHtml += '<div class="story-form-assigned-item dropdown-item py-2" data-id="" data-name="Nadie" data-email="" style="cursor:pointer">Nadie (sin asignar)</div>';
          users.forEach(function (u) {
            var id = (u.id || "").replace(/"/g, "&quot;");
            var name = (u.name && String(u.name).trim() ? String(u.name).trim() : "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
            var email = (u.email || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
            var label = userDisplayName(u) ? esc(userDisplayName(u)) : '<span class="text-muted">No name</span>';
            bodyHtml += '<div class="story-form-assigned-item dropdown-item py-2" data-id="' + id + '" data-name="' + name + '" data-email="' + email + '" style="cursor:pointer">' + label + '</div>';
          });
          bodyHtml += '</div></div></div>';
          bodyHtml += '<small class="form-text text-muted">Usuario que trabajará en esta story (opcional)</small></div>';
          bodyHtml += '<div id="story-form-error" class="alert alert-danger d-none"></div>';
          window.openNexusFormModal({ id: "storyNewModal", title: "Nueva story", bodyHtml: bodyHtml, primaryButtonId: "story-form-submit", primaryLabel: "Crear" }, function (bsModal) {
            var title = (document.getElementById("story-form-title").value || "").trim();
            var desc = (document.getElementById("story-form-desc").value || "").trim();
            var priority = (document.getElementById("story-form-priority") && document.getElementById("story-form-priority").value) || "MEDIUM";
            var assignedInput = document.getElementById("story-form-assigned");
            var assigned_to = (assignedInput && assignedInput.value) ? assignedInput.value : null;
            var sprintSel = document.getElementById("story-form-sprint");
            var sprint_id = (sprintSel && sprintSel.value) ? sprintSel.value : null;
            var errEl = document.getElementById("story-form-error");
            errEl.classList.add("d-none");
            if (!title) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); return; }
            if (!desc) { errEl.textContent = "La descripción es obligatoria."; errEl.classList.remove("d-none"); return; }
            var payload = { title: title, description: desc, priority: priority };
            if (assigned_to) payload.assigned_to = assigned_to;
            if (sprint_id) payload.sprint_id = sprint_id;
            window.fetchApi("/features/" + state.featureId + "/stories", { method: "POST", body: JSON.stringify(payload) }).then(function (r) {
              if (r && r.success) { bsModal.hide(); loadStories(); }
              else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
            });
          });
          setTimeout(function () {
            var trigger = document.getElementById("story-form-assigned-trigger");
            var dropdown = document.getElementById("story-form-assigned-dropdown");
            var filterInput = document.getElementById("story-form-assigned-filter");
            var listEl = document.getElementById("story-form-assigned-list");
            var hiddenInput = document.getElementById("story-form-assigned");
            if (!trigger || !dropdown || !hiddenInput) return;
            function closeDropdown() { dropdown.classList.add("d-none"); trigger.setAttribute("aria-expanded", "false"); }
            function openDropdown() { dropdown.classList.remove("d-none"); trigger.setAttribute("aria-expanded", "true"); if (filterInput) { filterInput.value = ""; filterInput.focus(); filterList(""); } }
            function filterList(term) {
              var t = (term || "").trim().toLowerCase();
              listEl.querySelectorAll(".story-form-assigned-item").forEach(function (el) {
                var name = (el.getAttribute("data-name") || "").toLowerCase();
                var email = (el.getAttribute("data-email") || "").toLowerCase();
                var show = !t || name.indexOf(t) !== -1 || email.indexOf(t) !== -1;
                el.style.display = show ? "" : "none";
              });
            }
            trigger.onclick = function (e) { e.preventDefault(); if (dropdown.classList.contains("d-none")) openDropdown(); else closeDropdown(); };
            if (filterInput) filterInput.oninput = function () { filterList(this.value); };
            listEl.querySelectorAll(".story-form-assigned-item").forEach(function (el) {
              el.onclick = function (e) {
                e.preventDefault();
                var id = el.getAttribute("data-id") || "";
                var name = el.getAttribute("data-name") || "";
                var displayText = el.textContent.trim();
                hiddenInput.value = id;
                trigger.textContent = name === "Nadie" ? "Nadie (sin asignar)" : (displayText || "No name");
                closeDropdown();
              };
            });
            document.addEventListener("click", function (e) {
              if (dropdown && !dropdown.classList.contains("d-none") && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
            });
          }, 0);
        }).catch(function () {
          var bodyHtml = '<div class="mb-3"><label class="form-label">Título de la story</label><input type="text" id="story-form-title" class="form-control" placeholder="Título de la story" required></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="story-form-desc" class="form-control" rows="3" placeholder="Descripción de la story" required></textarea></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Prioridad</label><select id="story-form-priority" class="form-select"><option value="MEDIUM" selected>Media</option><option value="LOW">Baja</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Sprint</label><select id="story-form-sprint" class="form-select"><option value="">Ninguno</option></select><small class="form-text text-muted">Sprint del proyecto (opcional)</small></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Asignado a</label><input type="hidden" id="story-form-assigned" value="">';
          bodyHtml += '<div class="position-relative"><button type="button" id="story-form-assigned-trigger" class="form-select form-control text-start d-block" style="cursor:pointer">Nadie (sin asignar)</button>';
          bodyHtml += '<div id="story-form-assigned-dropdown" class="border rounded bg-white shadow-sm position-absolute start-0 end-0 mt-1 d-none" style="z-index:1060; max-height:280px"><div id="story-form-assigned-list" class="story-form-assigned-list-scroll" style="height:200px; overflow-y:scroll"><div class="story-form-assigned-item dropdown-item py-2" data-id="" data-name="Nadie" data-email="" style="cursor:pointer">Nadie (sin asignar)</div></div></div></div>';
          bodyHtml += '<small class="form-text text-muted">No se pudo cargar la lista de usuarios.</small></div>';
          bodyHtml += '<div id="story-form-error" class="alert alert-danger d-none"></div>';
          window.openNexusFormModal({ id: "storyNewModal", title: "Nueva story", bodyHtml: bodyHtml, primaryButtonId: "story-form-submit", primaryLabel: "Crear" }, function (bsModal) {
            var title = (document.getElementById("story-form-title").value || "").trim();
            var desc = (document.getElementById("story-form-desc").value || "").trim();
            var priority = (document.getElementById("story-form-priority") && document.getElementById("story-form-priority").value) || "MEDIUM";
            var assignedInput = document.getElementById("story-form-assigned");
            var sprintSel = document.getElementById("story-form-sprint");
            var sprint_id = (sprintSel && sprintSel.value) ? sprintSel.value : null;
            var assigned_to = (assignedInput && assignedInput.value) ? assignedInput.value : null;
            var errEl = document.getElementById("story-form-error");
            errEl.classList.add("d-none");
            if (!title) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); return; }
            if (!desc) { errEl.textContent = "La descripción es obligatoria."; errEl.classList.remove("d-none"); return; }
            var payload = { title: title, description: desc, priority: priority };
            if (assigned_to) payload.assigned_to = assigned_to;
            if (sprint_id) payload.sprint_id = sprint_id;
            window.fetchApi("/features/" + state.featureId + "/stories", { method: "POST", body: JSON.stringify(payload) }).then(function (r) {
              if (r && r.success) { bsModal.hide(); loadStories(); }
              else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
            });
          });
          setTimeout(function () {
            var trigger = document.getElementById("story-form-assigned-trigger");
            var dropdown = document.getElementById("story-form-assigned-dropdown");
            var hiddenInput = document.getElementById("story-form-assigned");
            if (trigger && dropdown && hiddenInput) {
              trigger.onclick = function (e) { e.preventDefault(); dropdown.classList.toggle("d-none"); };
              dropdown.querySelectorAll(".story-form-assigned-item").forEach(function (el) {
                el.onclick = function (e) { e.preventDefault(); hiddenInput.value = el.getAttribute("data-id") || ""; trigger.textContent = el.getAttribute("data-name") === "Nadie" ? "Nadie (sin asignar)" : el.textContent.trim(); dropdown.classList.add("d-none"); };
              });
            }
          }, 0);
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
    if (state.featureId && !state.projectId) {
      var featRes = await window.fetchApi("/features/" + state.featureId);
      if (featRes && featRes.success && featRes.data && featRes.data.project_id) {
        state.projectId = featRes.data.project_id;
      }
    }
    if (state.projectId) {
      var body = await window.fetchApi("/projects/" + state.projectId + "/features");
      featuresList = (body && body.success && body.data && body.data.items) ? body.data.items : [];
    }
    window.setContent(renderList(null, null, !!(state.projectId && state.featureId)));
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
