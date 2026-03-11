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
    const isMaster = typeof window.nexusCanAccessMasterActions === "function" ? window.nexusCanAccessMasterActions(user) : (user && user.role === "MASTER");

    var state = { page: 1, limit: 10, statusFilter: [], search: "", sort: "number", dir: "desc", selectionMode: false, selectedIds: [] };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.statusFilter && state.statusFilter.length === 1) q += "&status=" + encodeURIComponent(state.statusFilter[0]);
      return q;
    }

    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Proyectos", href: "" }]);
      html += '<h1 class="nexus-page-title">Proyectos</h1>';
      html += '<div class="nexus-panel nexus-section-spacing">';
      var hasFilter = !!(state.search || (state.statusFilter && state.statusFilter.length > 0 && state.statusFilter.length < 2));
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      var perPageOpts = [10, 25, 50, 100];
      html += '<label class="mb-0"><span class="nexus-text-sm">Ver por página</span> <select id="projects-per-page" class="form-select form-select-sm d-inline-block" style="width:auto" aria-label="Proyectos por página">';
      perPageOpts.forEach(function (n) { html += '<option value="' + n + '"' + (state.limit === n ? ' selected' : '') + '>' + n + '</option>'; });
      html += '</select></label>';
      html += window.renderClearFiltersButton({ show: hasFilter, id: "projects-clear-filters-btn" });
      if (isMaster) {
        html += '<div class="d-flex align-items-center gap-2 ms-auto">';
        if (state.selectionMode) {
          html += '<span class="nexus-text-sm text-muted" id="projects-selection-count">' + (state.selectedIds.length ? state.selectedIds.length + " seleccionado(s)" : "Seleccione proyectos") + '</span>';
          html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="btn-cancel-selection">Cancelar selección</button>';
          html += '<button type="button" class="btn btn-outline-danger btn-sm" id="btn-bulk-delete-confirm" ' + (state.selectedIds.length === 0 ? " disabled" : "") + '>Eliminación múltiple</button>';
        } else {
          html += '<button type="button" class="btn btn-outline-danger btn-sm" id="btn-bulk-delete">Eliminación múltiple</button>';
          html += '<a href="#" id="btn-create-project" class="btn btn-nexus-primary btn-sm">+ Nuevo proyecto</a>';
        }
        html += "</div>";
      }
      html += "</div>";

      if (!items || items.length === 0) {
        var msg = meta && state.search ? "No hay resultados para tu búsqueda o filtro." : "Aún no hay proyectos";
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + msg + "</p><p class=\"nexus-text-secondary\">Cree su primer proyecto para comenzar.</p>";
        if (isMaster) html += '<a href="#" id="btn-create-project-2" class="btn btn-nexus-primary mt-3" aria-label="Crear proyecto">Crear proyecto</a>';
        html += "</div>";
      } else {
        var allChecked = items.length > 0 && items.every(function (p) { return state.selectedIds.indexOf(p.id) !== -1; });
        var nameSortArrow = state.sort === "name" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var nombreHeaderHtml = '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
        nombreHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="name">Nombre' + nameSortArrow + '</a>';
        nombreHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="projects-nombre-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="outside" aria-expanded="false" aria-haspopup="true" aria-label="Buscar por nombre" title="Buscar"><span aria-hidden="true">&#9662;</span></button>';
        nombreHeaderHtml += '<ul class="dropdown-menu dropdown-menu-start stories-titulo-dropdown-menu" id="projects-nombre-filter-menu" style="min-width:260px; max-width:320px; max-height:min(340px, 60vh); overflow:hidden; padding:0">';
        nombreHeaderHtml += '<li class="px-3 py-2 border-bottom"><input type="search" class="form-control form-control-sm" id="projects-search-nombre" placeholder="Buscar por nombre..." aria-label="Buscar" value="' + esc(state.search || "") + '"></li>';
        nombreHeaderHtml += '<li class="px-0 py-0"><ul class="list-unstyled mb-0" id="projects-nombre-matches" style="max-height:220px; overflow-y:auto">';
        (currentItems || []).forEach(function (p) {
          var nam = (p.name || "").replace(/</g, "&lt;").replace(/"/g, "&quot;");
          var desc = (p.description || "").replace(/</g, "&lt;").replace(/"/g, "&quot;").slice(0, 150);
          nombreHeaderHtml += '<li class="dropdown-item proj-nombre-match border-bottom" data-name="' + esc(nam) + '" data-description="' + esc(desc) + '" style="cursor:pointer; white-space:normal">' + esc(p.name || "—") + '</li>';
        });
        nombreHeaderHtml += '</ul></li>';
        nombreHeaderHtml += '<li class="px-3 py-2 border-top bg-light"><button type="button" class="btn btn-primary btn-sm me-1" id="projects-nombre-apply">Aplicar</button><button type="button" class="btn btn-outline-secondary btn-sm" id="projects-nombre-clear">Borrar filtro</button></li>';
        nombreHeaderHtml += '</ul></div>';
        var statusSortArrow = state.sort === "status" ? (state.dir === "asc" ? " \u2191" : " \u2193") : "";
        var allStatusSelected = state.statusFilter.length === 0 || state.statusFilter.length === 2;
        var estadoHeaderHtml = '<div class="dropdown d-inline-block">';
        estadoHeaderHtml += '<a href="#" class="text-decoration-none text-dark" data-sort="status">Estado' + statusSortArrow + '</a>';
        estadoHeaderHtml += '<button class="btn btn-link btn-sm p-0 ms-1 align-baseline" type="button" id="projects-status-filter-btn" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" aria-haspopup="true" aria-label="Filtrar por estado" title="Filtrar"><span aria-hidden="true">&#9662;</span></button>';
        estadoHeaderHtml += '<ul class="dropdown-menu dropdown-menu-end" id="projects-status-filter-menu" style="min-width:220px">';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="projects-status-sort-asc">Ordenar de A a Z</a></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="projects-status-sort-desc">Ordenar de Z a A</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li><a class="dropdown-item" href="#" id="projects-status-clear">Borrar filtro de Estado</a></li>';
        estadoHeaderHtml += '<li><hr class="dropdown-divider"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2"><input type="text" class="form-control form-control-sm" id="projects-status-search" placeholder="Buscar" aria-label="Buscar estado"></li>';
        estadoHeaderHtml += '<li class="px-3 py-2" id="projects-status-checklist">';
        estadoHeaderHtml += '<div class="form-check"><input class="form-check-input" type="checkbox" id="projects-status-select-all"' + (allStatusSelected ? ' checked' : '') + '> <label class="form-check-label" for="projects-status-select-all">(Seleccionar todo)</label></div>';
        estadoHeaderHtml += '<div class="form-check"><input class="form-check-input projects-status-cb" type="checkbox" value="ACTIVE" id="projects-status-ACTIVE"' + (state.statusFilter.length === 0 || state.statusFilter.indexOf("ACTIVE") !== -1 ? ' checked' : '') + '> <label class="form-check-label" for="projects-status-ACTIVE">ACTIVE</label></div>';
        estadoHeaderHtml += '<div class="form-check"><input class="form-check-input projects-status-cb" type="checkbox" value="ARCHIVED" id="projects-status-ARCHIVED"' + (state.statusFilter.length === 0 || state.statusFilter.indexOf("ARCHIVED") !== -1 ? ' checked' : '') + '> <label class="form-check-label" for="projects-status-ARCHIVED">ARCHIVED</label></div>';
        estadoHeaderHtml += '</li>';
        estadoHeaderHtml += '<li class="px-3 pb-2"><button type="button" class="btn btn-primary btn-sm w-100" id="projects-status-apply">Aplicar</button></li>';
        estadoHeaderHtml += '</ul></div>';
        html += window.renderNexusTable({
          columns: [
            { label: "ID", sortKey: "number" },
            { headerHtml: nombreHeaderHtml },
            { headerHtml: estadoHeaderHtml },
            { label: "Fecha de creación", sortKey: "created_at" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          selectionColumn: state.selectionMode && isMaster ? {
            headerCheckboxId: "projects-select-all",
            rowCheckboxClass: "project-row-checkbox",
            getRowId: function (p) { return p.id; },
            getRowLabel: function (p) { return p.name || p.id; },
            selectedIds: state.selectedIds,
            allChecked: allChecked
          } : null,
          rowRenderer: function (p) {
            var created = (p.created_at && p.created_at.slice) ? p.created_at.slice(0, 10) : (p.created_at || "—");
            var idDisplay = (p.number != null && p.number !== "") ? String(p.number) : ((p.id && p.id.substring) ? p.id.substring(0, 8) : (p.id || "—"));
            return [
              '<span class="nexus-text-sm text-muted" title="' + esc(p.id || "") + '">' + esc(idDisplay) + "</span>",
              '<a href="#/projects/' + p.id + '">' + esc(p.name || p.id) + "</a>",
              "<span class=\"" + window.nexusBadgeClass(p.status) + "\">" + esc(p.status || "") + "</span>",
              esc(created),
              window.renderTableActions({
                view: { href: "#/projects/" + p.id, ariaLabel: "Ver proyecto " + (p.name || p.id || "").slice(0, 40) },
                edit: isMaster ? { id: p.id, className: "btn-edit-project" } : null,
                archive: isMaster && p.status !== "ARCHIVED" ? { href: "#/projects/" + p.id } : null,
                delete: isMaster ? { id: p.id, className: "btn-delete-project" } : null
              })
            ];
          }
        });
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
          if (state.statusFilter && state.statusFilter.length > 0) {
            filtered = filtered.filter(function (p) { return state.statusFilter.indexOf(p.status) !== -1; });
          }
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
          if (toShow.length === 0 && state.page > 1) {
            state.page = state.page - 1;
            runList();
            return;
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
      if (state.statusFilter && state.statusFilter.length > 0) {
        filtered = filtered.filter(function (p) { return state.statusFilter.indexOf(p.status) !== -1; });
      }
      var sorted = window.sortArray(filtered, state.sort, state.dir);
      var toShow = state.search ? window.paginateClient(sorted, state.page, state.limit).items : sorted;
      if (state.search) currentMeta = { page: state.page, limit: state.limit, total: sorted.length, totalPages: Math.ceil(sorted.length / state.limit) || 1 };
      else if (!currentMeta) currentMeta = { page: state.page, limit: state.limit, total: currentItems.length, totalPages: 1 };
      window.setContent(renderList(toShow, currentMeta));
      bindProjects();
    }

    function openEditModal(project, onSuccess) {
      var bodyHtml = '<div class="mb-3"><label class="form-label">Nombre</label><input type="text" id="project-edit-name" class="form-control" placeholder="Nombre del proyecto" value="' + esc(project.name || "") + '" required></div>';
      bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="project-edit-desc" class="form-control" rows="3" placeholder="Descripción del proyecto">' + esc(project.description || "") + '</textarea></div><div id="project-edit-error" class="alert alert-danger d-none"></div>';
      window.openNexusFormModal({ id: "projectEditModal", title: "Editar proyecto", bodyHtml: bodyHtml, primaryButtonId: "project-edit-submit", primaryLabel: "Guardar" }, function (bsModal) {
        var name = (document.getElementById("project-edit-name").value || "").trim();
        var desc = (document.getElementById("project-edit-desc").value || "").trim();
        var errEl = document.getElementById("project-edit-error");
        errEl.classList.add("d-none");
        if (!name) { errEl.textContent = "El nombre es obligatorio."; errEl.classList.remove("d-none"); return; }
        window.fetchApi("/projects/" + project.id, { method: "PATCH", body: JSON.stringify({ name: name, description: desc }) }).then(function (r) {
          if (r && r.success) { bsModal.hide(); if (typeof onSuccess === "function") onSuccess(); } else { errEl.textContent = (r && r.error && r.error.message) || "Error al guardar."; errEl.classList.remove("d-none"); }
        });
      });
    }

    function confirmDeleteProject(projectId, onSuccess) {
      var modalId = "projectDeleteConfirmModal";
      var bodyHtml = '<p class="nexus-text-secondary mb-0">¿Está seguro de eliminar el proyecto y todos sus datos relacionados?</p>';
      var html = '<div class="modal fade nexus-modal-manage-user" id="' + modalId + '" tabindex="-1" aria-labelledby="' + modalId + 'Label" aria-hidden="true">';
      html += '<div class="modal-dialog modal-dialog-centered"><div class="nexus-manage-user-card modal-content">';
      html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title" id="' + modalId + 'Label">Eliminar proyecto</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
      html += '<div class="modal-body pt-2">' + bodyHtml + '<div id="project-delete-error" class="alert alert-danger d-none mt-2"></div></div>';
      html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-danger" id="project-delete-confirm-btn">Eliminar</button></div>';
      html += "</div></div></div>";
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      document.body.appendChild(wrap.firstElementChild);
      var modalEl = document.getElementById(modalId);
      modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
      modalEl.addEventListener("hidden.bs.modal", function () { document.body.classList.remove("nexus-manage-user-modal-open"); modalEl.remove(); });
      var bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
      document.getElementById("project-delete-confirm-btn").onclick = function () {
        var errEl = document.getElementById("project-delete-error");
        errEl.classList.add("d-none");
        window.fetchApi("/projects/" + projectId, { method: "DELETE" }).then(function (r) {
          if (r && r.success) { bsModal.hide(); if (typeof onSuccess === "function") onSuccess(); else window.location.hash = "#/projects"; } else { errEl.textContent = (r && r.error && r.error.message) || "Error al eliminar el proyecto."; errEl.classList.remove("d-none"); }
        });
      };
    }

    function confirmBulkDeleteProjects(ids, onSuccess) {
      var x = ids.length;
      var modalId = "projectBulkDeleteConfirmModal";
      var bodyHtml = '<p class="nexus-text-secondary mb-0">¿Desea eliminar ' + x + ' proyecto(s) y sus datos asociados?</p>';
      var html = '<div class="modal fade nexus-modal-manage-user" id="' + modalId + '" tabindex="-1" aria-labelledby="' + modalId + 'Label" aria-hidden="true">';
      html += '<div class="modal-dialog modal-dialog-centered"><div class="nexus-manage-user-card modal-content">';
      html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title" id="' + modalId + 'Label">Eliminación múltiple</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
      html += '<div class="modal-body pt-2">' + bodyHtml + '<div id="project-bulk-delete-error" class="alert alert-danger d-none mt-2"></div></div>';
      html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-danger" id="project-bulk-delete-confirm-btn">Eliminar</button></div>';
      html += "</div></div></div>";
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      document.body.appendChild(wrap.firstElementChild);
      var modalEl = document.getElementById(modalId);
      modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
      modalEl.addEventListener("hidden.bs.modal", function () { document.body.classList.remove("nexus-manage-user-modal-open"); modalEl.remove(); });
      var bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
      document.getElementById("project-bulk-delete-confirm-btn").onclick = function () {
        var errEl = document.getElementById("project-bulk-delete-error");
        errEl.classList.add("d-none");
        window.fetchApi("/projects/bulk-delete", { method: "POST", body: JSON.stringify({ ids: ids }) }).then(function (r) {
          if (r && r.success) {
            bsModal.hide();
            state.selectionMode = false;
            state.selectedIds = [];
            if (typeof onSuccess === "function") onSuccess();
            else runList();
          } else {
            errEl.textContent = (r && r.error && r.error.message) || "Error al eliminar los proyectos.";
            errEl.classList.remove("d-none");
          }
        });
      };
    }

    async function loadProjectDetail(pid) {
      window.setContent(window.showLoading());
      var body = await window.fetchApi("/projects/" + pid);
      if (!body || !body.success || !body.data) {
        window.setContent(window.showError(body && body.error && body.error.message));
        return;
      }
      var p = body.data;
      var html = window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "Proyectos", href: "#/projects" },
        { label: p.name || "Proyecto" }
      ]);
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<h1 class="nexus-page-title">' + esc(p.name || "Proyecto") + "</h1>";
      html += "<p class=\"nexus-text-secondary\">" + esc(p.description || "") + "</p>";
      html += "<p>Estado: <span class=\"" + window.nexusBadgeClass(p.status) + "\">" + esc(p.status || "") + "</span></p>";
      html += '<div class="mt-3 d-flex flex-wrap justify-content-between align-items-center gap-2">';
      html += '<div class="d-flex flex-wrap gap-2">';
      html += '<a href="#/features?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm">Features</a>';
      html += '<a href="#/sprints?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm">Sprints</a>';
      html += '<a href="#/incidents?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm">Incidentes</a>';
      html += '</div>';
      html += '<div class="d-flex flex-wrap gap-2">';
      if (isMaster) {
        html += '<button class="btn btn-nexus-secondary btn-sm" id="btn-edit-project">Editar</button>';
        if (p.status !== "ARCHIVED") {
          html += '<button class="btn btn-outline-danger btn-sm" id="btn-archive">Archivar</button>';
        }
        html += '<button class="btn btn-outline-danger btn-sm" id="btn-delete-project">Eliminar</button>';
      }
      html += '<a href="#/projects" class="btn btn-nexus-secondary btn-sm">Volver</a>';
      html += '</div></div>';
      html += "</div>";
      window.setContent(html);
      var btnArchive = document.getElementById("btn-archive");
      if (btnArchive) btnArchive.onclick = async function () {
        var r = await window.fetchApi("/projects/" + p.id + "/archive", { method: "PATCH" });
        if (r && r.success) window.location.hash = "#/projects";
        else window.setContent(window.showError(r && r.error && r.error.message));
      };
      var btnEdit = document.getElementById("btn-edit-project");
      if (btnEdit) btnEdit.onclick = function () { openEditModal(p, function () { loadProjectDetail(p.id); }); };
      var btnDelete = document.getElementById("btn-delete-project");
      if (btnDelete) btnDelete.onclick = function () { confirmDeleteProject(p.id, function () { window.location.hash = "#/projects"; }); };
    }

    if (projectId) {
      loadProjectDetail(projectId);
      return;
    }

    function bindProjects() {
      var clearFiltersBtn = document.getElementById("projects-clear-filters-btn");
      if (clearFiltersBtn) clearFiltersBtn.onclick = function () { state.search = ""; state.statusFilter = []; state.page = 1; refreshFromCurrent(); };
      var searchNombre = document.getElementById("projects-search-nombre");
      if (searchNombre) {
        searchNombre.oninput = function () {
          var term = (this.value || "").trim().toLowerCase();
          document.querySelectorAll("#content .proj-nombre-match").forEach(function (el) {
            var name = (el.getAttribute("data-name") || "").toLowerCase();
            var desc = (el.getAttribute("data-description") || "").toLowerCase();
            el.style.display = !term || name.indexOf(term) !== -1 || desc.indexOf(term) !== -1 ? "" : "none";
          });
        };
        searchNombre.onclick = function (e) { e.stopPropagation(); };
      }
      document.querySelectorAll("#content .proj-nombre-match").forEach(function (el) {
        el.onclick = function (e) {
          e.preventDefault();
          var name = el.getAttribute("data-name") || "";
          var inp = document.getElementById("projects-search-nombre");
          if (inp) inp.value = name;
        };
      });
      var nombreApply = document.getElementById("projects-nombre-apply");
      if (nombreApply) nombreApply.onclick = function () {
        var inp = document.getElementById("projects-search-nombre");
        state.search = inp ? inp.value.trim() : "";
        state.page = 1;
        var btn = document.getElementById("projects-nombre-filter-btn");
        if (btn && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(btn); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      var nombreClear = document.getElementById("projects-nombre-clear");
      if (nombreClear) nombreClear.onclick = function () {
        var inp = document.getElementById("projects-search-nombre");
        if (inp) inp.value = "";
        state.search = "";
        state.page = 1;
        var btn = document.getElementById("projects-nombre-filter-btn");
        if (btn && window.bootstrap && window.bootstrap.Dropdown) { var inst = window.bootstrap.Dropdown.getInstance(btn); if (inst) inst.hide(); }
        refreshFromCurrent();
      };
      var perPage = document.getElementById("projects-per-page");
      var sortAsc = document.getElementById("projects-status-sort-asc");
      if (sortAsc) sortAsc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "asc"; state.page = 1; refreshFromCurrent(); };
      var sortDesc = document.getElementById("projects-status-sort-desc");
      if (sortDesc) sortDesc.onclick = function (e) { e.preventDefault(); state.sort = "status"; state.dir = "desc"; state.page = 1; refreshFromCurrent(); };
      var clearFilter = document.getElementById("projects-status-clear");
      if (clearFilter) clearFilter.onclick = function (e) { e.preventDefault(); state.statusFilter = []; state.page = 1; refreshFromCurrent(); };
      var selectAll = document.getElementById("projects-status-select-all");
      if (selectAll) selectAll.onclick = function () {
        var checked = this.checked;
        document.querySelectorAll("#content .projects-status-cb").forEach(function (cb) { cb.checked = checked; });
      };
      document.querySelectorAll("#content .projects-status-cb").forEach(function (cb) {
        cb.onclick = function () {
          var all = document.querySelectorAll("#content .projects-status-cb");
          var allChecked = Array.prototype.every.call(all, function (c) { return c.checked; });
          var selAllEl = document.getElementById("projects-status-select-all");
          if (selAllEl) selAllEl.checked = allChecked;
        };
      });
      var statusSearch = document.getElementById("projects-status-search");
      if (statusSearch) {
        statusSearch.value = "";
        statusSearch.oninput = function () {
          var q = (this.value || "").toLowerCase().trim();
          document.querySelectorAll("#content #projects-status-checklist .form-check").forEach(function (wrap) {
            var cb = wrap.querySelector(".projects-status-cb");
            if (!cb) return;
            var label = (wrap.querySelector("label") || {}).textContent || "";
            wrap.style.display = (q === "" || label.toLowerCase().indexOf(q) !== -1) ? "" : "none";
          });
        };
      }
      var applyBtn = document.getElementById("projects-status-apply");
      if (applyBtn) applyBtn.onclick = function () {
        var selected = [];
        document.querySelectorAll("#content .projects-status-cb:checked").forEach(function (cb) { selected.push(cb.value); });
        state.statusFilter = selected.length === 0 || selected.length === 2 ? [] : selected;
        state.page = 1;
        refreshFromCurrent();
      };
      var popperFixed = function (c) { return Object.assign({}, c || {}, { strategy: "fixed" }); };
      var nombreBtn = document.getElementById("projects-nombre-filter-btn");
      var statusBtn = document.getElementById("projects-status-filter-btn");
      if (nombreBtn && window.bootstrap && window.bootstrap.Dropdown) {
        try { var ni = window.bootstrap.Dropdown.getInstance(nombreBtn); if (ni) ni.dispose(); new window.bootstrap.Dropdown(nombreBtn, { popperConfig: popperFixed }); } catch (err) {}
      }
      if (statusBtn && window.bootstrap && window.bootstrap.Dropdown) {
        try { var si = window.bootstrap.Dropdown.getInstance(statusBtn); if (si) si.dispose(); new window.bootstrap.Dropdown(statusBtn, { popperConfig: popperFixed }); } catch (err) {}
      }
      if (perPage) {
        perPage.value = state.limit;
        perPage.onchange = function () { state.limit = parseInt(perPage.value, 10) || 10; state.page = 1; runList(); };
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
      document.querySelectorAll("#content .btn-edit-project").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var id = a.getAttribute("data-id");
          window.fetchApi("/projects/" + id).then(function (body) {
            if (body && body.success && body.data) openEditModal(body.data, runList);
            else window.openNexusAlertModal({ title: "Error", message: (body && body.error && body.error.message) || "Error al cargar el proyecto." });
          });
        };
      });
      document.querySelectorAll("#content .btn-delete-project").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var id = a.getAttribute("data-id");
          confirmDeleteProject(id, runList);
        };
      });
      function doNew() {
        var bodyHtml = '<div class="mb-3"><label class="form-label">Nombre</label><input type="text" id="project-form-name" class="form-control" placeholder="Nombre del proyecto" required></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="project-form-desc" class="form-control" rows="3" placeholder="Descripción del proyecto"></textarea></div><div id="project-form-error" class="alert alert-danger d-none"></div>';
        window.openNexusFormModal({ id: "projectNewModal", title: "Nuevo proyecto", bodyHtml: bodyHtml, primaryButtonId: "project-form-submit", primaryLabel: "Crear" }, function (bsModal) {
          var name = (document.getElementById("project-form-name").value || "").trim();
          var desc = (document.getElementById("project-form-desc").value || "").trim();
          var errEl = document.getElementById("project-form-error");
          errEl.classList.add("d-none");
          if (!name) { errEl.textContent = "El nombre es obligatorio."; errEl.classList.remove("d-none"); return; }
          window.fetchApi("/projects", { method: "POST", body: JSON.stringify({ name: name, description: desc }) }).then(function (r) {
            if (r && r.success) { bsModal.hide(); runList(); } else { errEl.textContent = (r && r.error && r.error.message) || "Error al crear el proyecto."; errEl.classList.remove("d-none"); }
          });
        });
      }
      var btnNew = document.getElementById("btn-create-project");
      if (btnNew) btnNew.onclick = function (e) { e.preventDefault(); doNew(); };
      var btnNew2 = document.getElementById("btn-create-project-2");
      if (btnNew2) btnNew2.onclick = function (e) { e.preventDefault(); doNew(); };

      var btnBulkDelete = document.getElementById("btn-bulk-delete");
      if (btnBulkDelete) {
        btnBulkDelete.onclick = function () {
          state.selectionMode = true;
          state.selectedIds = [];
          refreshFromCurrent();
        };
      }
      var btnCancelSelection = document.getElementById("btn-cancel-selection");
      if (btnCancelSelection) {
        btnCancelSelection.onclick = function () {
          state.selectionMode = false;
          state.selectedIds = [];
          refreshFromCurrent();
        };
      }
      var btnBulkDeleteConfirm = document.getElementById("btn-bulk-delete-confirm");
      if (btnBulkDeleteConfirm) {
        btnBulkDeleteConfirm.onclick = function () {
          if (state.selectedIds.length === 0) {
            window.openNexusAlertModal({ title: "Eliminación múltiple", message: "Seleccione al menos un proyecto." });
            return;
          }
          confirmBulkDeleteProjects(state.selectedIds.slice(), runList);
        };
      }
      var selectAll = document.getElementById("projects-select-all");
      if (selectAll) {
        selectAll.onclick = function () {
          var filtered = window.filterBySearch(currentItems, ["name", "description"], state.search);
          var sorted = window.sortArray(filtered, state.sort, state.dir);
          var toShow = state.search ? window.paginateClient(sorted, state.page, state.limit).items : sorted;
          var visibleIds = toShow.map(function (p) { return p.id; });
          if (selectAll.checked) {
            visibleIds.forEach(function (id) { if (state.selectedIds.indexOf(id) === -1) state.selectedIds.push(id); });
          } else {
            state.selectedIds = state.selectedIds.filter(function (id) { return visibleIds.indexOf(id) === -1; });
          }
          refreshFromCurrent();
        };
      }
      document.querySelectorAll("#content .project-row-checkbox").forEach(function (cb) {
        cb.onclick = function () {
          var id = cb.getAttribute("data-id");
          var idx = state.selectedIds.indexOf(id);
          if (idx === -1) state.selectedIds.push(id);
          else state.selectedIds.splice(idx, 1);
          refreshFromCurrent();
        };
      });
    }

    runList();
  });
})();
