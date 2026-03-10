/**
 * Sprints — GET /projects/:id/sprints (page, limit, status), detalle. Tabla ordenable, filtros, búsqueda, paginación, badges, carga, empty state.
 */
(function () {
  window.registerView("sprints", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var sprintId = segs[1];
    if (sprintId) {
      var user = await window.getMe();
      var isMaster = user && user.role === "MASTER";
      function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }
      async function loadSprintDetail(sid) {
        window.setContent(window.showLoading());
        var body = await window.fetchApi("/sprints/" + sid);
        if (!body || !body.success || !body.data) {
          window.setContent(window.showError(body && body.error && body.error.message));
          return;
        }
        var s = body.data;
        var breadcrumbs;
        if (s.project_id) {
          var projectName = "Proyecto";
          try {
            var projRes = await window.fetchApi("/projects/" + s.project_id);
            if (projRes && projRes.success && projRes.data && projRes.data.name) projectName = projRes.data.name;
          } catch (err) {}
          breadcrumbs = [
            { label: "Panel", href: "#/dashboard" },
            { label: "Proyectos", href: "#/projects" },
            { label: projectName, href: "#/projects/" + s.project_id },
            { label: "Sprints", href: "#/sprints?project=" + encodeURIComponent(s.project_id) },
            { label: s.name || "Sprint", href: "" }
          ];
        } else {
          breadcrumbs = [{ label: "Panel", href: "#/dashboard" }, { label: "Sprints", href: "#/sprints" }, { label: s.name || "Sprint", href: "" }];
        }
        var html = window.renderBreadcrumbs(breadcrumbs);
        html += '<div class="nexus-card nexus-section-spacing"><h1 class="nexus-page-title">' + esc(s.name || "Sprint") + "</h1>";
        html += "<p class=\"nexus-text-secondary\">Estado: <span class=\"" + window.nexusBadgeClass(s.status) + "\">" + esc(s.status || "") + "</span></p>";
        html += "<p class=\"nexus-text-sm\">Inicio: " + (s.start_date || "—") + " · Fin: " + (s.end_date || "—") + "</p>";
        if (isMaster && s.status !== "CLOSED") html += '<button class="btn btn-nexus-primary btn-sm me-2" id="sprint-close-btn">Cerrar sprint</button>';
        html += ' <a href="#/sprints' + (s.project_id ? '?project=' + s.project_id : '') + '" class="btn btn-nexus-secondary btn-sm">Volver</a></div>';
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
            if (r && r.success) loadSprintDetail(s.id);
            else window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error." });
          });
        };
      }
      loadSprintDetail(sprintId);
      return;
    }
    window.setContent(window.showLoading());
    var projectsRes = await window.fetchApi("/projects");
    var projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];
    var user = await window.getMe();
    var isMaster = user && user.role === "MASTER";
    var state = { projectId: "", page: 1, limit: 10, statusFilter: [], search: "", sort: "name", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      return "?page=" + state.page + "&limit=" + state.limit;
    }
    function getDisplayItems(raw) {
      var filtered = window.filterBySearch(raw || [], ["name", "goal"], state.search);
      if (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 3) {
        filtered = filtered.filter(function (s) { return state.statusFilter.indexOf(s.status) !== -1; });
      }
      return window.sortArray(filtered, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }
    function renderList(items, meta) {
      var breadcrumbs = state.projectId
        ? [{ label: "Panel", href: "#/dashboard" }, { label: "Proyectos", href: "#/projects" }, { label: getProjectName(state.projectId), href: "#/projects/" + state.projectId }, { label: "Sprints", href: "" }]
        : [{ label: "Panel", href: "#/dashboard" }, { label: "Sprints", href: "" }];
      var html = window.renderBreadcrumbs(breadcrumbs);
      html += '<h1 class="nexus-page-title">Sprints</h1><div class="nexus-panel nexus-section-spacing">';
      var hasFilter = !!(state.search || (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 3));
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">';
      html += '<label class="mb-0 nexus-text-sm">Proyecto</label>';
      html += '<select id="sprints-sel-project" class="form-select form-select-sm nexus-input" style="max-width:320px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option>';
      projects.forEach(function (p) { html += "<option value=\"" + p.id + "\">" + esc(p.name || p.id) + "</option>"; });
      html += "</select>";
      html += window.renderClearFiltersButton({ show: hasFilter, id: "sprints-clear-filters-btn" });
      if (isMaster) html += '<a href="#" id="sprints-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo sprint</a>';
      html += "</div>";
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver los sprints.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div id="sprints-list">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay sprints") + "</p><p class=\"nexus-text-secondary\">Cree un sprint o ajuste los filtros.</p></div>";
      } else {
        var sprintStatuses = ["PLANNED", "IN_PROGRESS", "CLOSED"];
        var statusSortArrow = state.sort === "status" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var nameSortArrow = state.sort === "name" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var allStatusSelected = state.statusFilter.length === 0 || state.statusFilter.length === 3;
        var estadoHeaderHtml = '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
        estadoHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="status">Estado' + statusSortArrow + '</a>';
        estadoHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="sprints-status-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="true" aria-expanded="false" aria-haspopup="true" aria-label="Filtrar por estado" title="Filtrar"><span aria-hidden="true">&#9662;</span></button>';
        estadoHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end" id="sprints-status-filter-menu" style="min-width:200px; max-height:min(280px, 50vh); overflow-y:auto">';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="sprints-status-sort-asc">Ordenar de A a Z</a></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="sprints-status-sort-desc">Ordenar de Z a A</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="sprints-status-clear">Borrar filtro de Estado</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2" id="sprints-status-checklist">';
        estadoHeaderHtml += '<div class="form-check"><input class="form-check-input" type="checkbox" id="sprints-status-select-all"' + (allStatusSelected ? ' checked' : '') + '> <label class="form-check-label" for="sprints-status-select-all">(Seleccionar todo)</label></div>';
        sprintStatuses.forEach(function (st) {
          estadoHeaderHtml += '<div class="form-check"><input class="form-check-input sprints-status-cb" type="checkbox" value="' + (st || "").replace(/"/g, "&quot;") + '" id="sprints-status-' + (st || "").replace(/"/g, "&quot;") + '"' + (state.statusFilter.length === 0 || state.statusFilter.indexOf(st) !== -1 ? ' checked' : '') + '> <label class="form-check-label" for="sprints-status-' + (st || "").replace(/"/g, "&quot;") + '">' + (st || "") + '</label></div>';
        });
        estadoHeaderHtml += '</li>';
        estadoHeaderHtml += '<li class="px-3 pb-2"><button type="button" class="btn btn-primary btn-sm w-100" id="sprints-status-apply">Aplicar</button></li>';
        estadoHeaderHtml += '</ul></div>';
        var nombreHeaderHtml = '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
        nombreHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="name">Nombre' + nameSortArrow + '</a>';
        nombreHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="sprints-nombre-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="outside" aria-expanded="false" aria-haspopup="true" aria-label="Buscar por nombre" title="Buscar"><span aria-hidden="true">&#9662;</span></button>';
        nombreHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end stories-titulo-dropdown-menu" id="sprints-nombre-filter-menu" style="min-width:260px; max-width:340px; max-height:min(380px, 60vh); overflow:hidden; padding:0">';
        nombreHeaderHtml += '<li class="px-3 py-2 border-bottom"><input type="search" class="form-control form-control-sm" id="sprints-search-nombre" placeholder="Buscar por nombre o objetivo..." aria-label="Buscar" value="' + esc(state.search || "") + '"></li>';
        nombreHeaderHtml += '<li class="px-0 py-0 flex-grow-1 overflow-y-auto" style="max-height:220px"><ul class="list-unstyled mb-0" id="sprints-nombre-matches">';
        (currentItems || []).forEach(function (s) {
          var nam = (s.name || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
          var goal = (s.goal || "").replace(/</g, "&lt;").replace(/"/g, "&quot;").slice(0, 150);
          nombreHeaderHtml += '<li class="dropdown-item sprints-nombre-match border-bottom" data-name="' + esc(nam) + '" data-goal="' + esc(goal) + '" style="cursor:pointer; white-space:normal">' + esc(s.name || "—") + '</li>';
        });
        nombreHeaderHtml += '</ul></li>';
        nombreHeaderHtml += '<li class="px-3 py-2 border-top bg-light"><button type="button" class="btn btn-primary btn-sm me-1" id="sprints-nombre-apply">Aplicar</button><button type="button" class="btn btn-outline-secondary btn-sm" id="sprints-nombre-clear">Borrar filtro</button></li>';
        nombreHeaderHtml += '</ul>';
        html += window.renderNexusTable({
          columns: [
            { headerHtml: nombreHeaderHtml },
            { label: "Fecha inicio" },
            { label: "Fecha fin" },
            { headerHtml: estadoHeaderHtml },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (s) {
            return [
              '<a href="#/sprints/' + s.id + '">' + esc(s.name || s.id) + "</a>",
              (s.start_date || "—"),
              (s.end_date || "—"),
              "<span class=\"" + window.nexusBadgeClass(s.status) + "\">" + esc(s.status || "") + "</span>",
              window.renderTableActions({ view: { href: "#/sprints/" + s.id } })
            ];
          }
        });
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
          var raw = Array.isArray(data) ? data : (data.data || data.items || []);
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var meta = data.meta || {};
          var total = meta.total != null ? meta.total : (data.total != null ? data.total : raw.length);
          var limit = meta.limit != null ? meta.limit : (data.limit != null ? data.limit : state.limit);
          var totalPages = state.search ? 1 : (meta.totalPages != null ? meta.totalPages : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit))));
          var totalFiltered = (state.search || (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 3)) ? toShow.length : total;
          currentMeta = { page: state.page, limit: limit, total: totalFiltered, totalPages: state.search || (state.statusFilter && state.statusFilter.length > 0) ? 1 : totalPages };
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
      if (state.search || (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 3)) currentMeta = { page: 1, limit: currentMeta.limit, total: toShow.length, totalPages: toShow.length ? 1 : 0 };
      window.setContent(renderList(toShow, currentMeta));
      bind();
    }

    function bind() {
      var sel = document.getElementById("sprints-sel-project");
      if (sel) {
        sel.value = state.projectId;
        sel.onchange = function () { state.projectId = sel.value; state.page = 1; load(); };
      }
      var clearFiltersBtn = document.getElementById("sprints-clear-filters-btn");
      if (clearFiltersBtn) clearFiltersBtn.onclick = function () { state.search = ""; state.statusFilter = []; state.page = 1; refreshFromCurrent(); };
      var searchNombre = document.getElementById("sprints-search-nombre");
      if (searchNombre) {
        searchNombre.oninput = function () {
          var term = (this.value || "").trim().toLowerCase();
          document.querySelectorAll("#content .sprints-nombre-match").forEach(function (el) {
            var name = (el.getAttribute("data-name") || "").toLowerCase();
            var goal = (el.getAttribute("data-goal") || "").toLowerCase();
            var show = !term || name.indexOf(term) !== -1 || goal.indexOf(term) !== -1;
            el.style.display = show ? "" : "none";
          });
        };
      }
      var nombreApply = document.getElementById("sprints-nombre-apply");
      if (nombreApply) nombreApply.onclick = function () {
        var inp = document.getElementById("sprints-search-nombre");
        state.search = inp ? inp.value : "";
        state.page = 1;
        var dd = document.getElementById("sprints-nombre-filter-btn");
        if (dd && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(dd); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      var nombreClear = document.getElementById("sprints-nombre-clear");
      if (nombreClear) nombreClear.onclick = function () {
        var inp = document.getElementById("sprints-search-nombre");
        if (inp) inp.value = "";
        state.search = "";
        state.page = 1;
        var dd = document.getElementById("sprints-nombre-filter-btn");
        if (dd && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(dd); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      document.querySelectorAll("#content .sprints-nombre-match").forEach(function (el) {
        el.onclick = function (e) {
          e.preventDefault();
          var name = el.getAttribute("data-name");
          var inp = document.getElementById("sprints-search-nombre");
          if (inp && name != null) inp.value = name;
        };
      });
      var statusSortAsc = document.getElementById("sprints-status-sort-asc");
      if (statusSortAsc) statusSortAsc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "asc"; state.page = 1; refreshFromCurrent(); };
      var statusSortDesc = document.getElementById("sprints-status-sort-desc");
      if (statusSortDesc) statusSortDesc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "desc"; state.page = 1; refreshFromCurrent(); };
      var statusClear = document.getElementById("sprints-status-clear");
      if (statusClear) statusClear.onclick = function (e) { e.preventDefault(); state.statusFilter = []; state.page = 1; var sb = document.getElementById("sprints-status-filter-btn"); if (sb && window.bootstrap && window.bootstrap.Dropdown) { var i = window.bootstrap.Dropdown.getInstance(sb); if (i) i.hide(); } refreshFromCurrent(); };
      var statusSelectAll = document.getElementById("sprints-status-select-all");
      if (statusSelectAll) statusSelectAll.onclick = function () {
        var checked = this.checked;
        document.querySelectorAll("#content .sprints-status-cb").forEach(function (cb) { cb.checked = checked; });
      };
      document.querySelectorAll("#content .sprints-status-cb").forEach(function (cb) {
        cb.onclick = function () {
          var all = document.querySelectorAll("#content .sprints-status-cb");
          var allChecked = all.length && Array.prototype.every.call(all, function (c) { return c.checked; });
          var selAllEl = document.getElementById("sprints-status-select-all");
          if (selAllEl) selAllEl.checked = allChecked;
        };
      });
      var statusApply = document.getElementById("sprints-status-apply");
      if (statusApply) statusApply.onclick = function () {
        var selected = [];
        document.querySelectorAll("#content .sprints-status-cb:checked").forEach(function (cb) { selected.push(cb.value); });
        state.statusFilter = (selected.length === 0 || selected.length === 3) ? [] : selected;
        state.page = 1;
        var statusBtn = document.getElementById("sprints-status-filter-btn");
        if (statusBtn && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(statusBtn); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      if (window.bootstrap && window.bootstrap.Dropdown) {
        var popperFixed = function (c) { return Object.assign({}, c || {}, { strategy: "fixed" }); };
        var statusBtn = document.getElementById("sprints-status-filter-btn");
        var nombreBtn = document.getElementById("sprints-nombre-filter-btn");
        if (statusBtn) { try { var si = window.bootstrap.Dropdown.getInstance(statusBtn); if (si) si.dispose(); new window.bootstrap.Dropdown(statusBtn, { popperConfig: popperFixed }); } catch (err) {} }
        if (nombreBtn) { try { var ni = window.bootstrap.Dropdown.getInstance(nombreBtn); if (ni) ni.dispose(); new window.bootstrap.Dropdown(nombreBtn, { popperConfig: popperFixed }); } catch (err) {} }
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
        if (!state.projectId) {
          window.openNexusAlertModal({ title: "Nuevo sprint", message: "Seleccione un proyecto." });
          return;
        }
        var bodyHtml = '<div class="mb-3"><label class="form-label">Nombre del sprint</label><input type="text" id="sprint-form-name" class="form-control" placeholder="Nombre del sprint" required></div><div id="sprint-form-error" class="alert alert-danger d-none"></div>';
        window.openNexusFormModal({ id: "sprintNewModal", title: "Nuevo sprint", bodyHtml: bodyHtml, primaryButtonId: "sprint-form-submit", primaryLabel: "Crear" }, function (bsModal) {
          var name = (document.getElementById("sprint-form-name").value || "").trim();
          var errEl = document.getElementById("sprint-form-error");
          errEl.classList.add("d-none");
          if (!name) { errEl.textContent = "El nombre es obligatorio."; errEl.classList.remove("d-none"); return; }
          window.fetchApi("/projects/" + state.projectId + "/sprints", { method: "POST", body: JSON.stringify({ name: name, goal: "" }) }).then(function (r) {
            if (r && r.success) { bsModal.hide(); load(); }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
          });
        });
      };
    }

    var match = window.location.hash.match(/[?&]project=([^&]+)/);
    if (match) state.projectId = decodeURIComponent(match[1]);
    else {
      var projectParam = segs[1];
      if (projectParam && projectParam.indexOf("?") !== 0) state.projectId = projectParam;
    }
    load();
  });
})();
