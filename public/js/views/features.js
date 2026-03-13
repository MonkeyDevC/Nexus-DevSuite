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
    if (projectParam && !match) {
      try {
        var featCheck = await window.fetchApi("/features/" + projectParam);
        if (featCheck && featCheck.success && featCheck.data && featCheck.data.project_id) projectParam = featCheck.data.project_id;
      } catch (e) {}
    }

    var state = { projectId: projectParam || "", page: 1, limit: 10, statusFilter: [], search: "", sort: "title", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.statusFilter && state.statusFilter.length === 1) q += "&status=" + encodeURIComponent(state.statusFilter[0]);
      return q;
    }

    function getDisplayItems(rawItems) {
      var filtered = window.filterBySearch(rawItems || [], ["title", "description"], state.search);
      if (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 5) {
        filtered = filtered.filter(function (f) { return state.statusFilter.indexOf(f.status) !== -1; });
      }
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
      var hasFilter = !!(state.search || (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 5));
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">';
      html += (typeof window.renderPageSizeSelector === "function" ? window.renderPageSizeSelector({ selectId: "feat-per-page", currentLimit: state.limit, options: [10, 25, 50] }) : "");
      html += '<label class="mb-0 nexus-text-sm">Proyecto</label>';
      html += '<select class="form-select form-select-sm nexus-input" id="sel-project" style="max-width:320px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option>';
      projects.forEach(function (p) {
        html += "<option value=\"" + p.id + "\">" + esc(p.name || p.id) + "</option>";
      });
      html += "</select>";
      html += window.renderClearFiltersButton({ show: hasFilter, id: "feat-clear-filters-btn" });
      html += '<a href="#" id="feat-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nueva feature</a>';
      html += "</div>";
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver las features.</p></div>';
        html += "</div>";
        return html;
      }
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay features") + "</p><p class=\"nexus-text-secondary\">Cree una feature o ajuste los filtros.</p></div>";
      } else {
        var featStatuses = ["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"];
        var statusSortArrow = state.sort === "status" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var allFeatStatusSelected = state.statusFilter.length === 0 || state.statusFilter.length === 5;
        var estadoHeaderHtml = '<div class="dropdown d-inline-block">';
        estadoHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="status">Estado' + statusSortArrow + '</a>';
        estadoHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="feat-status-filter-btn" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" aria-haspopup="true" aria-label="Filtrar por estado" title="Filtrar"><span aria-hidden="true">&#9662;</span></button>';
        estadoHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end" id="feat-status-filter-menu" style="min-width:220px; max-height:320px; overflow-y:auto">';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="feat-status-sort-asc">Ordenar de A a Z</a></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="feat-status-sort-desc">Ordenar de Z a A</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="feat-status-clear">Borrar filtro de Estado</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2"><input type="text" class="form-control form-control-sm" id="feat-status-search" placeholder="Buscar" aria-label="Buscar estado"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2" id="feat-status-checklist">';
        estadoHeaderHtml += '<div class="form-check"><input class="form-check-input" type="checkbox" id="feat-status-select-all"' + (allFeatStatusSelected ? ' checked' : '') + '> <label class="form-check-label" for="feat-status-select-all">(Seleccionar todo)</label></div>';
        featStatuses.forEach(function (s) {
          estadoHeaderHtml += '<div class="form-check"><input class="form-check-input feat-status-cb" type="checkbox" value="' + esc(s) + '" id="feat-status-' + esc(s) + '"' + (state.statusFilter.length === 0 || state.statusFilter.indexOf(s) !== -1 ? ' checked' : '') + '> <label class="form-check-label" for="feat-status-' + esc(s) + '">' + esc(s) + '</label></div>';
        });
        estadoHeaderHtml += '</li>';
        estadoHeaderHtml += '<li class="px-3 pb-2"><button type="button" class="btn btn-primary btn-sm w-100" id="feat-status-apply">Aplicar</button></li>';
        estadoHeaderHtml += '</ul></div>';
        var titleSortArrow = state.sort === "title" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var tituloHeaderHtml = '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
        tituloHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="title">Título de feature' + titleSortArrow + '</a>';
        tituloHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="feat-titulo-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="outside" aria-expanded="false" aria-haspopup="true" aria-label="Buscar por título" title="Buscar"><span aria-hidden="true">&#9662;</span></button>';
        tituloHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end stories-titulo-dropdown-menu" id="feat-titulo-filter-menu" style="min-width:260px; max-width:340px; max-height:min(380px, 60vh); overflow:hidden; padding:0">';
        tituloHeaderHtml += '<li class="px-3 py-2 border-bottom"><input type="search" class="form-control form-control-sm" id="feat-search-titulo" placeholder="Buscar por título..." aria-label="Buscar" value="' + esc(state.search || "") + '"></li>';
        tituloHeaderHtml += '<li class="px-0 py-0 flex-grow-1 overflow-y-auto" style="max-height:220px"><ul class="list-unstyled mb-0" id="feat-titulo-matches">';
        (currentItems || []).forEach(function (f) {
          var tit = (f.title || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
          var desc = (f.description || "").replace(/</g, "&lt;").replace(/"/g, "&quot;").slice(0, 150);
          tituloHeaderHtml += '<li class="dropdown-item feat-titulo-match border-bottom" data-title="' + esc(tit) + '" data-description="' + esc(desc) + '" style="cursor:pointer; white-space:normal">' + esc(f.title || "—") + '</li>';
        });
        tituloHeaderHtml += '</ul></li>';
        tituloHeaderHtml += '<li class="px-3 py-2 border-top bg-light"><button type="button" class="btn btn-primary btn-sm me-1" id="feat-titulo-apply">Aplicar</button><button type="button" class="btn btn-outline-secondary btn-sm" id="feat-titulo-clear">Borrar filtro</button></li>';
        tituloHeaderHtml += '</ul></div>';
        html += window.renderNexusTable({
          columns: [
            { headerHtml: tituloHeaderHtml },
            { label: "Descripción de la feature" },
            { headerHtml: estadoHeaderHtml },
            { label: "Cant. stories" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (f) {
            var count = f.user_stories_count != null ? f.user_stories_count : (f.stories_count != null ? f.stories_count : "—");
            var desc = (f.description || "").trim();
            var descShort = desc.length > 80 ? desc.slice(0, 77) + "…" : desc;
            var descCell = desc ? ('<span class="nexus-text-sm" title="' + esc(desc) + '">' + esc(descShort || "—") + "</span>") : "—";
            var featStatuses = ["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"];
            var statusSelect = '<select class="form-select form-select-sm feat-status-select nexus-input" data-feature-id="' + esc(f.id) + '" style="max-width:140px" aria-label="Estado">';
            featStatuses.forEach(function (st) {
              statusSelect += '<option value="' + esc(st) + '"' + (f.status === st ? ' selected' : '') + '>' + esc(st) + '</option>';
            });
            statusSelect += '</select>';
            return [
              '<a href="#/stories?feature=' + f.id + (state.projectId ? '&project=' + state.projectId : '') + '">' + esc(f.title || f.id) + "</a>",
              descCell,
              statusSelect,
              String(count),
              window.renderTableActions({ view: { href: "#/stories?feature=" + f.id + (state.projectId ? "&project=" + state.projectId : ""), label: "Stories" } })
            ];
          }
        });
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
      var perPageEl = document.getElementById("feat-per-page");
      if (perPageEl) perPageEl.onchange = function () { state.limit = parseInt(perPageEl.value, 10) || 10; state.page = 1; loadFeatures(); };
      var sel = document.getElementById("sel-project");
      if (sel) {
        sel.value = state.projectId;
        sel.onchange = function () { state.projectId = sel.value; state.page = 1; currentItems = []; loadFeatures(); };
      }
      var clearFiltersBtn = document.getElementById("feat-clear-filters-btn");
      if (clearFiltersBtn) clearFiltersBtn.onclick = function () { state.search = ""; state.statusFilter = []; state.page = 1; refreshFromCurrent(); };
      var sortAsc = document.getElementById("feat-status-sort-asc");
      if (sortAsc) sortAsc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "asc"; state.page = 1; refreshFromCurrent(); };
      var sortDesc = document.getElementById("feat-status-sort-desc");
      if (sortDesc) sortDesc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "desc"; state.page = 1; refreshFromCurrent(); };
      var clearFilter = document.getElementById("feat-status-clear");
      if (clearFilter) clearFilter.onclick = function (e) { e.preventDefault(); state.statusFilter = []; state.page = 1; loadFeatures(); };
      var selectAll = document.getElementById("feat-status-select-all");
      if (selectAll) selectAll.onclick = function () {
        var checked = this.checked;
        document.querySelectorAll("#content .feat-status-cb").forEach(function (cb) { cb.checked = checked; });
      };
      document.querySelectorAll("#content .feat-status-cb").forEach(function (cb) {
        cb.onclick = function () {
          var all = document.querySelectorAll("#content .feat-status-cb");
          var allChecked = all.length && Array.prototype.every.call(all, function (c) { return c.checked; });
          var selAllEl = document.getElementById("feat-status-select-all");
          if (selAllEl) selAllEl.checked = allChecked;
        };
      });
      var statusSearch = document.getElementById("feat-status-search");
      if (statusSearch) {
        statusSearch.value = "";
        statusSearch.oninput = function () {
          var q = (this.value || "").toLowerCase().trim();
          document.querySelectorAll("#content #feat-status-checklist .form-check").forEach(function (wrap) {
            var cb = wrap.querySelector(".feat-status-cb");
            if (!cb) return;
            var label = (wrap.querySelector("label") || {}).textContent || "";
            wrap.style.display = (q === "" || label.toLowerCase().indexOf(q) !== -1) ? "" : "none";
          });
        };
      }
      var applyBtn = document.getElementById("feat-status-apply");
      if (applyBtn) applyBtn.onclick = function () {
        var selected = [];
        document.querySelectorAll("#content .feat-status-cb:checked").forEach(function (cb) { selected.push(cb.value); });
        state.statusFilter = (selected.length === 0 || selected.length === 5) ? [] : selected;
        state.page = 1;
        loadFeatures();
      };
      var searchTitulo = document.getElementById("feat-search-titulo");
      if (searchTitulo) {
        searchTitulo.oninput = function () {
          var term = (this.value || "").trim().toLowerCase();
          document.querySelectorAll("#content .feat-titulo-match").forEach(function (el) {
            var title = (el.getAttribute("data-title") || "").toLowerCase();
            var desc = (el.getAttribute("data-description") || "").toLowerCase();
            var show = !term || title.indexOf(term) !== -1 || desc.indexOf(term) !== -1;
            el.style.display = show ? "" : "none";
          });
        };
      }
      var tituloApply = document.getElementById("feat-titulo-apply");
      if (tituloApply) tituloApply.onclick = function () {
        var inp = document.getElementById("feat-search-titulo");
        state.search = inp ? inp.value : "";
        state.page = 1;
        var btn = document.getElementById("feat-titulo-filter-btn");
        if (btn && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(btn); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      var tituloClear = document.getElementById("feat-titulo-clear");
      if (tituloClear) tituloClear.onclick = function () {
        var inp = document.getElementById("feat-search-titulo");
        if (inp) inp.value = "";
        state.search = "";
        state.page = 1;
        var btn = document.getElementById("feat-titulo-filter-btn");
        if (btn && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(btn); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      document.querySelectorAll("#content .feat-titulo-match").forEach(function (el) {
        el.onclick = function (e) {
          e.preventDefault();
          var title = el.getAttribute("data-title");
          var inp = document.getElementById("feat-search-titulo");
          if (inp && title != null) inp.value = title;
        };
      });
      if (window.bootstrap && window.bootstrap.Dropdown) {
        var popperFixed = function (c) { return Object.assign({}, c || {}, { strategy: "fixed" }); };
        var tituloBtn = document.getElementById("feat-titulo-filter-btn");
        var statusBtn = document.getElementById("feat-status-filter-btn");
        if (tituloBtn) { try { var ti = window.bootstrap.Dropdown.getInstance(tituloBtn); if (ti) ti.dispose(); new window.bootstrap.Dropdown(tituloBtn, { popperConfig: popperFixed }); } catch (err) {} }
        if (statusBtn) { try { var si = window.bootstrap.Dropdown.getInstance(statusBtn); if (si) si.dispose(); new window.bootstrap.Dropdown(statusBtn, { popperConfig: popperFixed }); } catch (err) {} }
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
      document.querySelectorAll("#content .feat-status-select").forEach(function (sel) {
        sel.onchange = function () {
          var featureId = sel.getAttribute("data-feature-id");
          var status = (sel.value || "").trim();
          if (!featureId || !status) return;
          var prevVal = sel.dataset.prevStatus;
          sel.disabled = true;
          window.fetchApi("/features/" + featureId + "/status", { method: "PATCH", body: JSON.stringify({ status: status }) }).then(function (r) {
            sel.disabled = false;
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado correctamente."); sel.dataset.prevStatus = status; refreshFromCurrent(); }
            else {
              if (prevVal) sel.value = prevVal;
              window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al cambiar estado." });
            }
          });
        };
      });
      var btnNew = document.getElementById("feat-btn-new");
      if (btnNew) btnNew.onclick = function (e) {
        e.preventDefault();
        if (!state.projectId) {
          window.openNexusAlertModal({ title: "Nueva feature", message: "Seleccione un proyecto." });
          return;
        }
        var bodyHtml = '<div class="mb-3"><label class="form-label">Título de la feature</label><input type="text" id="feat-form-title" class="form-control" placeholder="Título de la feature" required></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="feat-form-desc" class="form-control" rows="3" placeholder="Descripción de la feature" required></textarea></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Prioridad</label><select id="feat-form-priority" class="form-select" aria-label="Prioridad"><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></select></div>';
        bodyHtml += '<div id="feat-form-error" class="alert alert-danger d-none"></div>';
        window.openNexusFormModal({ id: "featNewModal", title: "Nueva feature", bodyHtml: bodyHtml, primaryButtonId: "feat-form-submit", primaryLabel: "Crear" }, function (bsModal) {
          var title = (document.getElementById("feat-form-title").value || "").trim();
          var desc = (document.getElementById("feat-form-desc").value || "").trim();
          var priorityEl = document.getElementById("feat-form-priority");
          var priority = (priorityEl && priorityEl.value) ? priorityEl.value : "MEDIUM";
          var errEl = document.getElementById("feat-form-error");
          errEl.classList.add("d-none");
          if (!title) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); return; }
          if (!desc) { errEl.textContent = "La descripción es obligatoria."; errEl.classList.remove("d-none"); return; }
          window.fetchApi("/projects/" + state.projectId + "/features", { method: "POST", body: JSON.stringify({ title: title, description: desc, priority: priority }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Feature creada correctamente."); bsModal.hide(); loadFeatures(); }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
          });
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
