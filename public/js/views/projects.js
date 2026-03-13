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
    const projectMode = segs[2] || "";
    const openInEditMode = String(projectMode).toLowerCase() === "edit";
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
          html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="btn-projects-export-full">Exportar</button>';
          html += '<input type="file" id="projects-import-full-input" class="d-none" accept=".json,application/json">';
          html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="btn-projects-import-full">Importar</button>';
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
            var idDisplay = (p.number != null && p.number !== "") ? ("P" + String(p.number)) : ((p.id && p.id.substring) ? p.id.substring(0, 8) : (p.id || "—"));
            return [
              '<span class="nexus-text-sm text-muted" title="' + esc(p.id || "") + '">' + esc(idDisplay) + "</span>",
              '<a href="#/projects/' + p.id + '">' + esc(p.name || p.id) + "</a>",
              "<span class=\"" + window.nexusBadgeClass(p.status) + "\">" + esc(p.status || "") + "</span>",
              esc(created),
              window.renderTableActions({
                view: { href: "#/projects/" + p.id, ariaLabel: "Ver proyecto " + (p.name || p.id || "").slice(0, 40) },
                edit: isMaster ? { href: "#/projects/" + p.id + "/edit" } : null,
                archive: isMaster && p.status !== "ARCHIVED" ? { id: p.id, className: "btn-archive-project" } : null,
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

    function confirmArchiveProject(project, onSuccess) {
      var projectName = (project && project.name) ? String(project.name).trim() : "";
      var titleSuffix = projectName ? (": " + projectName) : "";
      window.openNexusConfirmModal({
        title: "Archivar proyecto",
        message: "¿Esta seguro que desea archivar este proyecto" + titleSuffix + "?",
        primaryLabel: "Sí, archivar",
        primaryDanger: true
      }, function (closeModal, showError) {
        window.fetchApi("/projects/" + project.id + "/archive", { method: "PATCH" }).then(function (r) {
          if (r && r.success) {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Proyecto archivado correctamente.");
            closeModal();
            if (typeof onSuccess === "function") onSuccess();
            return;
          }
          showError((r && r.error && r.error.message) || "Error al archivar el proyecto.");
        });
      });
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

    function projectCriteriaStorageKey(projectId) {
      return "nexus-project-criteria:" + projectId;
    }

    function loadProjectCriteria(projectId) {
      try {
        var raw = localStorage.getItem(projectCriteriaStorageKey(projectId));
        if (!raw) return { acceptance: [], implementation: [] };
        var parsed = JSON.parse(raw);
        return {
          acceptance: Array.isArray(parsed && parsed.acceptance) ? parsed.acceptance : [],
          implementation: Array.isArray(parsed && parsed.implementation) ? parsed.implementation : []
        };
      } catch (e) {
        return { acceptance: [], implementation: [] };
      }
    }

    function saveProjectCriteria(projectId, acceptance, implementation) {
      var payload = {
        acceptance: Array.isArray(acceptance) ? acceptance : [],
        implementation: Array.isArray(implementation) ? implementation : []
      };
      localStorage.setItem(projectCriteriaStorageKey(projectId), JSON.stringify(payload));
    }

    function projectEvidenceStorageKey(projectId) {
      return "nexus.project.evidence." + String(projectId || "");
    }

    function normalizeEvidencePayload(payload) {
      var p = payload && typeof payload === "object" ? payload : {};
      return {
        notes: p.notes != null ? String(p.notes) : "",
        files: Array.isArray(p.files) ? p.files.filter(function (f) { return f && f.data_url; }).map(function (f) {
          return {
            name: f.name ? String(f.name) : "archivo",
            type: f.type ? String(f.type) : "application/octet-stream",
            data_url: String(f.data_url)
          };
        }) : []
      };
    }

    function loadProjectEvidence(projectId) {
      try {
        var raw = localStorage.getItem(projectEvidenceStorageKey(projectId));
        if (!raw) return { notes: "", files: [] };
        return normalizeEvidencePayload(JSON.parse(raw));
      } catch (e) {
        return { notes: "", files: [] };
      }
    }

    function saveProjectEvidence(projectId, evidence) {
      localStorage.setItem(projectEvidenceStorageKey(projectId), JSON.stringify(normalizeEvidencePayload(evidence)));
    }

    function featureCriteriaStorageKey(featureId) {
      return "nexus.feature.criteria." + String(featureId || "");
    }

    function loadFeatureCriteria(featureId) {
      try {
        var raw = localStorage.getItem(featureCriteriaStorageKey(featureId));
        if (!raw) return { acceptance: [], implementation: [] };
        var parsed = JSON.parse(raw);
        return {
          acceptance: Array.isArray(parsed && parsed.acceptance) ? parsed.acceptance : [],
          implementation: Array.isArray(parsed && parsed.implementation) ? parsed.implementation : []
        };
      } catch (e) {
        return { acceptance: [], implementation: [] };
      }
    }

    function saveFeatureCriteria(featureId, acceptance, implementation) {
      var payload = {
        acceptance: Array.isArray(acceptance) ? acceptance : [],
        implementation: Array.isArray(implementation) ? implementation : []
      };
      localStorage.setItem(featureCriteriaStorageKey(featureId), JSON.stringify(payload));
    }

    function getProjectCriteriaLines(selector) {
      var inputs = document.querySelectorAll(selector);
      var lines = [];
      if (inputs) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
      return lines;
    }

    function fetchAllProjectFeatures(projectId) {
      if (!projectId) return Promise.resolve([]);
      var all = [];
      function fetchPage(page) {
        return window.fetchApi("/projects/" + projectId + "/features?page=" + page + "&limit=100").then(function (body) {
          if (!(body && body.success && body.data)) return all;
          var data = body.data;
          var items = data.items || (Array.isArray(data) ? data : []);
          all = all.concat(items);
          var totalPages = data.totalPages != null ? data.totalPages : 1;
          if (page < totalPages) return fetchPage(page + 1);
          return all;
        });
      }
      return fetchPage(1);
    }

    function fetchAllFeatureStories(featureId) {
      if (!featureId) return Promise.resolve([]);
      var all = [];
      function fetchPage(page) {
        return window.fetchApi("/features/" + featureId + "/stories?page=" + page + "&limit=100").then(function (body) {
          if (!(body && body.success && body.data)) return all;
          var data = body.data;
          var items = data.items || (Array.isArray(data) ? data : []);
          all = all.concat(items);
          var totalPages = data.totalPages != null ? data.totalPages : 1;
          if (page < totalPages) return fetchPage(page + 1);
          return all;
        });
      }
      return fetchPage(1);
    }

    function fetchAllProjects() {
      var all = [];
      function fetchPage(page) {
        return window.fetchApi("/projects?page=" + page + "&limit=100").then(function (body) {
          if (!(body && body.success && body.data)) return all;
          var data = body.data;
          var items = data.items || (Array.isArray(data) ? data : []);
          all = all.concat(items);
          var totalPages = data.totalPages != null ? data.totalPages : 1;
          if (page < totalPages) return fetchPage(page + 1);
          return all;
        });
      }
      return fetchPage(1);
    }

    function buildProjectExportNode(project) {
      return fetchAllProjectFeatures(project.id).then(function (features) {
        var featurePromises = (features || []).map(function (f) {
          return fetchAllFeatureStories(f.id).then(function (stories) {
            var fCrit = loadFeatureCriteria(f.id);
            return {
              title: f.title || "",
              description: f.description || "",
              priority: f.priority || "MEDIUM",
              status: f.status || "DRAFT",
              acceptance_criteria: fCrit.acceptance || [],
              implementation_criteria: fCrit.implementation || [],
              stories: (stories || []).map(function (s) {
                return {
                  title: s.title || "",
                  description: s.description || "",
                  status: s.status || "DRAFT",
                  priority: s.priority || "MEDIUM",
                  assigned_to: s.assigned_to || null,
                  sprint_id: s.sprint_id || null,
                  acceptance_criteria: Array.isArray(s.acceptance_criteria) ? s.acceptance_criteria : (s.acceptance_criteria && s.acceptance_criteria.items) ? s.acceptance_criteria.items : [],
                  implementation_criteria: Array.isArray(s.implementation_criteria) ? s.implementation_criteria : (s.implementation_criteria && s.implementation_criteria.items) ? s.implementation_criteria.items : []
                };
              })
            };
          });
        });
        return Promise.all(featurePromises).then(function (featureNodes) {
          var crit = loadProjectCriteria(project.id);
          return {
            project: {
              id: project.id,
              name: project.name || "",
              description: project.description || "",
              status: project.status || "ACTIVE",
              acceptance_criteria: crit.acceptance || [],
              implementation_criteria: crit.implementation || []
            },
            features: featureNodes
          };
        });
      });
    }

    function importFeaturesAndStoriesForProject(projectId, features) {
      var createdFeatures = 0;
      var createdStories = 0;
      var failed = 0;
      return fetchAllProjectFeatures(projectId).then(function (existingFeatures) {
        var byTitle = {};
        (existingFeatures || []).forEach(function (f) { byTitle[(f.title || "").trim().toLowerCase()] = f; });
        var chain = Promise.resolve();
        (features || []).forEach(function (feat) {
          chain = chain.then(function () {
            var title = (feat && feat.title ? String(feat.title) : "").trim();
            var desc = (feat && feat.description ? String(feat.description) : "").trim();
            var prio = (feat && feat.priority ? String(feat.priority) : "MEDIUM").toUpperCase();
            var st = (feat && feat.status ? String(feat.status) : "DRAFT").toUpperCase();
            if (!title || !desc) { failed += 1; return; }
            var existing = byTitle[title.toLowerCase()];
            var featurePromise = existing ? Promise.resolve({ success: true, data: existing }) : window.fetchApi("/projects/" + projectId + "/features", { method: "POST", body: JSON.stringify({ title: title, description: desc, priority: prio }) });
            return featurePromise.then(function (fr) {
              if (!(fr && fr.success && fr.data && fr.data.id)) { failed += 1; return; }
              var fid = fr.data.id;
              if (!existing) createdFeatures += 1;
              var postFeatTasks = [];
              if (st && st !== "DRAFT") postFeatTasks.push(window.fetchApi("/features/" + fid + "/status", { method: "PATCH", body: JSON.stringify({ status: st }) }));
              var stories = Array.isArray(feat && feat.stories) ? feat.stories : [];
              stories.forEach(function (story) {
                postFeatTasks.push((function () {
                  var stTitle = (story && story.title ? String(story.title) : "").trim();
                  var stDesc = (story && story.description ? String(story.description) : "").trim();
                  var stPrio = (story && story.priority ? String(story.priority) : "MEDIUM").toUpperCase();
                  var stStatus = (story && story.status ? String(story.status) : "DRAFT").toUpperCase();
                  var assignedTo = story && story.assigned_to ? String(story.assigned_to) : null;
                  var sprintId = story && story.sprint_id ? String(story.sprint_id) : null;
                  var acceptance = story && Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria : [];
                  var implementation = story && Array.isArray(story.implementation_criteria) ? story.implementation_criteria : [];
                  if (!stTitle || !stDesc) { failed += 1; return Promise.resolve(); }
                  var createPayload = { title: stTitle, description: stDesc, priority: stPrio };
                  if (assignedTo) createPayload.assigned_to = assignedTo;
                  if (sprintId) createPayload.sprint_id = sprintId;
                  return window.fetchApi("/features/" + fid + "/stories", { method: "POST", body: JSON.stringify(createPayload) }).then(function (sr) {
                    if (!(sr && sr.success && sr.data && sr.data.id)) { failed += 1; return; }
                    createdStories += 1;
                    var sid = sr.data.id;
                    var postStoryTasks = [];
                    if (acceptance.length || implementation.length || assignedTo) {
                      postStoryTasks.push(window.fetchApi("/stories/" + sid, { method: "PATCH", body: JSON.stringify({ acceptance_criteria: acceptance, implementation_criteria: implementation, assigned_to: assignedTo || null }) }));
                    }
                    if (stStatus && stStatus !== "DRAFT") postStoryTasks.push(window.fetchApi("/stories/" + sid + "/status", { method: "PATCH", body: JSON.stringify({ status: stStatus }) }));
                    if (sprintId) postStoryTasks.push(window.fetchApi("/stories/" + sid + "/sprint", { method: "PATCH", body: JSON.stringify({ sprint_id: sprintId }) }));
                    return Promise.all(postStoryTasks);
                  }).catch(function () { failed += 1; });
                })());
              });
              return Promise.all(postFeatTasks);
            }).catch(function () { failed += 1; });
          });
        });
        return chain.then(function () { return { createdFeatures: createdFeatures, createdStories: createdStories, failed: failed }; });
      });
    }

    function applyImportedFeatureCriteria(payload) {
      var nodes = Array.isArray(payload && payload.projects) ? payload.projects : [];
      if (!nodes.length) return Promise.resolve();
      return fetchAllProjects().then(function (projects) {
        var projectsByName = {};
        (projects || []).forEach(function (p) { projectsByName[(p.name || "").trim().toLowerCase()] = p; });
        var tasks = nodes.map(function (node) {
          var projectData = node && node.project ? node.project : null;
          var projectName = (projectData && projectData.name) ? String(projectData.name).trim().toLowerCase() : "";
          var targetProject = projectName ? projectsByName[projectName] : null;
          var featuresInPayload = Array.isArray(node && node.features) ? node.features : [];
          if (!targetProject || !featuresInPayload.length) return Promise.resolve();
          return fetchAllProjectFeatures(targetProject.id).then(function (targetFeatures) {
            var byTitle = {};
            (targetFeatures || []).forEach(function (f) { byTitle[(f.title || "").trim().toLowerCase()] = f; });
            featuresInPayload.forEach(function (featNode) {
              var featTitle = (featNode && featNode.title) ? String(featNode.title).trim().toLowerCase() : "";
              var targetFeature = featTitle ? byTitle[featTitle] : null;
              if (!targetFeature) return;
              var acceptance = Array.isArray(featNode && featNode.acceptance_criteria) ? featNode.acceptance_criteria : [];
              var implementation = Array.isArray(featNode && featNode.implementation_criteria) ? featNode.implementation_criteria : [];
              if (acceptance.length || implementation.length) {
                saveFeatureCriteria(targetFeature.id, acceptance, implementation);
              }
            });
          });
        });
        return Promise.all(tasks).then(function () { return true; });
      });
    }

    async function loadProjectDetail(pid, forceEditMode) {
      window.setContent(window.showLoading());
      var body = await window.fetchApi("/projects/" + pid);
      if (!body || !body.success || !body.data) {
        window.setContent(window.showError(body && body.error && body.error.message));
        return;
      }
      var p = body.data;
      var storedCriteria = loadProjectCriteria(p.id);
      var evidenceState = loadProjectEvidence(p.id);
      var evidenceBaselineJson = JSON.stringify(evidenceState);
      var acceptanceLines = storedCriteria.acceptance || [];
      var implementationLines = storedCriteria.implementation || [];
      var statusOpts = ["ACTIVE", "ARCHIVED"];
      var statusSelectHtml = '<span class="nexus-text-sm text-muted">Estado</span><select id="project-detail-status-edit" class="form-select form-select-sm mt-1" style="max-width:100%">';
      statusOpts.forEach(function (st) {
        statusSelectHtml += '<option value="' + esc(st) + '"' + (p.status === st ? ' selected' : '') + '>' + esc(st) + '</option>';
      });
      statusSelectHtml += "</select>";
      var html = window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "Proyectos", href: "#/projects" },
        { label: p.name || "Proyecto" }
      ]);
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<h1 class="nexus-page-title">' + esc(p.name || "Proyecto") + "</h1>";
      html += '<div class="nexus-card p-4" style="max-width:100%">';
      html += '<ul class="nav nav-tabs mb-3" role="tablist"><li class="nav-item"><button type="button" class="nav-link' + (forceEditMode ? "" : " active") + '" id="project-detail-tab-vista" data-bs-toggle="tab" data-bs-target="#project-detail-panel-vista" aria-selected="' + (forceEditMode ? "false" : "true") + '">Vista</button></li><li class="nav-item"><button type="button" class="nav-link' + (forceEditMode ? " active" : "") + '" id="project-detail-tab-edicion" data-bs-toggle="tab" data-bs-target="#project-detail-panel-edicion" aria-selected="' + (forceEditMode ? "true" : "false") + '">Edición</button></li><li class="nav-item"><button type="button" class="nav-link" id="project-detail-tab-evidencia" data-bs-toggle="tab" data-bs-target="#project-detail-panel-evidencia" aria-selected="false">Evidencia</button></li></ul>';
      html += '<div class="tab-content">';
      html += '<div class="tab-pane fade' + (forceEditMode ? "" : " show active") + '" id="project-detail-panel-vista" role="tabpanel"><div class="row g-3">';
      html += '<div class="col-md-4"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + esc((p.number != null && p.number !== "") ? ("P" + String(p.number)) : ((p.id || "").slice(0, 8) || "—")) + "</p></div>";
      html += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Estado</span><p class="mb-0">' + esc(p.status || "—") + "</p></div>";
      html += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + esc((p.created_at && p.created_at.slice) ? p.created_at.slice(0, 10) : (p.created_at || "—")) + "</p></div>";
      html += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Descripción</span>';
      html += (p.description && String(p.description).trim()) ? '<p class="mb-0" style="white-space:pre-wrap">' + esc(p.description) + "</p>" : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
      html += "</div>";
      html += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de aceptación</span><div id="project-detail-criteria-vista">';
      if (!acceptanceLines.length) html += '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
      else {
        html += '<ul class="list-unstyled mb-0">';
        acceptanceLines.forEach(function (line, idx) { html += '<li class="py-1">' + (idx + 1) + ". " + esc(line || "—") + "</li>"; });
        html += "</ul>";
      }
      html += "</div></div>";
      html += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de implementación</span><div id="project-detail-impl-vista">';
      if (!implementationLines.length) html += '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
      else {
        html += '<ul class="list-unstyled mb-0">';
        implementationLines.forEach(function (line, idx) { html += '<li class="py-1">' + (idx + 1) + ". " + esc(line || "—") + "</li>"; });
        html += "</ul>";
      }
      html += "</div></div>";
      html += "</div></div>";
      html += '<div class="tab-pane fade' + (forceEditMode ? " show active" : "") + '" id="project-detail-panel-edicion" role="tabpanel"><div class="row g-3">';
      html += '<div class="col-md-4"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + esc((p.number != null && p.number !== "") ? ("P" + String(p.number)) : ((p.id || "").slice(0, 8) || "—")) + "</p></div>";
      html += '<div class="col-md-4">' + statusSelectHtml + "</div>";
      html += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + esc((p.created_at && p.created_at.slice) ? p.created_at.slice(0, 10) : (p.created_at || "—")) + "</p></div>";
      html += '<div class="col-12"><span class="nexus-text-sm text-muted">Nombre</span><input type="text" id="project-detail-edit-name" class="form-control form-control-sm mt-1" value="' + esc(p.name || "") + '" placeholder="Nombre" aria-label="Nombre"></div>';
      html += '<div class="col-12"><span class="nexus-text-sm text-muted">Descripción</span><textarea id="project-detail-edit-desc" class="form-control form-control-sm mt-1" rows="3" placeholder="Descripción" aria-label="Descripción">' + esc(p.description || "") + "</textarea></div>";
      html += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de aceptación</span><div id="project-detail-criteria-list">';
      var numCriteria = acceptanceLines.length || 1;
      for (var i = 0; i < numCriteria; i++) {
        html += '<div class="project-criterion-row d-flex gap-2 align-items-center mb-2"><input type="text" class="form-control form-control-sm project-detail-criteria-input" placeholder="Criterio ' + (i + 1) + '" value="' + esc(acceptanceLines[i] || "") + '" aria-label="Criterio ' + (i + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm project-criterion-remove" aria-label="Quitar criterio">&times;</button></div>';
      }
      html += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="project-detail-criteria-add" class="btn btn-outline-secondary btn-sm">+ Añadir criterio</button><button type="button" id="project-detail-criteria-save" class="btn btn-nexus-primary btn-sm">Guardar criterios</button><span id="project-detail-criteria-msg" class="nexus-text-sm text-muted"></span></div></div>';
      html += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de implementación</span><div id="project-detail-impl-criteria-list">';
      var numImpl = implementationLines.length || 1;
      for (var j = 0; j < numImpl; j++) {
        html += '<div class="project-impl-row d-flex gap-2 align-items-center mb-2"><input type="text" class="form-control form-control-sm project-detail-impl-input" placeholder="Criterio ' + (j + 1) + '" value="' + esc(implementationLines[j] || "") + '" aria-label="Criterio ' + (j + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm project-impl-remove" aria-label="Quitar criterio">&times;</button></div>';
      }
      html += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="project-detail-impl-add" class="btn btn-outline-secondary btn-sm">+ Añadir criterio</button><button type="button" id="project-detail-impl-save" class="btn btn-nexus-primary btn-sm">Guardar criterios</button><span id="project-detail-impl-msg" class="nexus-text-sm text-muted"></span></div></div>';
      html += '</div></div>';
      html += '<div class="tab-pane fade" id="project-detail-panel-evidencia" role="tabpanel"><div class="row g-3">';
      html += '<div class="col-md-6"><span class="nexus-text-sm text-muted d-block mb-2">Edición</span><textarea id="project-detail-evidence-notes" class="form-control form-control-sm mb-2" rows="5" placeholder="Notas de evidencia...">' + esc(evidenceState.notes || "") + '</textarea><input type="file" id="project-detail-evidence-files" class="form-control form-control-sm mb-2" accept="image/*,video/*,.pdf,.doc,.docx,.txt" multiple><div id="project-detail-evidence-list"></div></div>';
      html += '<div class="col-md-6"><span class="nexus-text-sm text-muted d-block mb-2">Previsualización</span><div id="project-detail-evidence-preview"></div></div>';
      html += "</div></div></div>";
      html += '<div class="mt-3 d-flex flex-wrap justify-content-between align-items-center gap-2">';
      html += '<div class="d-flex flex-wrap gap-2">';
      html += '<button type="button" id="project-detail-export" class="btn btn-outline-secondary btn-sm">Exportar</button>';
      html += '<input type="file" id="project-detail-import-input" class="d-none" accept=".json,application/json">';
      html += '<button type="button" id="project-detail-import" class="btn btn-outline-secondary btn-sm">Importar</button>';
      html += '</div>';
      html += '<div class="d-flex flex-wrap gap-2">';
      html += '<a href="#/features?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm">Features</a>';
      html += '<a href="#/sprints?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm">Sprints</a>';
      html += '<a href="#/incidents?project=' + esc(p.id) + '" class="btn btn-nexus-secondary btn-sm">Incidentes</a>';
      if (isMaster) {
        if (p.status !== "ARCHIVED") html += '<button class="btn btn-outline-danger btn-sm" id="btn-archive">Archivar</button>';
        html += '<button class="btn btn-outline-danger btn-sm" id="btn-delete-project">Eliminar</button>';
      }
      html += "</div></div>";
      html += "</div>";
      window.openNexusFormModal({
        id: "projectDetailModal",
        title: "Detalle del proyecto",
        bodyHtml: html,
        mode: isMaster ? "edit" : "view",
        primaryButtonId: "project-detail-save-modal",
        primaryLabel: "Guardar",
        cancelButtonId: "project-detail-cancel-modal",
        modalDialogClass: "nexus-modal-story-detail",
        getDirtyState: isMaster ? isDirty : undefined,
        onSaveBeforeClose: isMaster ? function () {
          return saveMain().then(function (ok) {
            if (!ok) {
              window.openNexusAlertModal({ title: "Error", message: "No se pudieron guardar los cambios del proyecto." });
              return false;
            }
            saveCriteriaOnly();
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Proyecto actualizado correctamente.");
            runList();
            return true;
          });
        } : undefined
      }, function (bsModal) {
        if (!isMaster) bsModal.hide();
      });

      var modalEl = document.getElementById("projectDetailModal");
      if (modalEl) {
        modalEl.addEventListener("hidden.bs.modal", function () {
          if (window.location.hash.indexOf("#/projects/") === 0) window.location.hash = "#/projects";
        }, { once: true });
      }

      if (!isMaster) {
        var tabEd = document.getElementById("project-detail-tab-edicion");
        if (tabEd && tabEd.parentNode) tabEd.parentNode.remove();
      }
      var initialName = (p.name || "").trim();
      var initialDesc = (p.description || "").trim();
      var baselineCriteria = acceptanceLines.slice();
      var baselineImpl = implementationLines.slice();
      var baselineStatus = p.status || "ACTIVE";
      function readFilesAsDataUrl(fileList) {
        var files = Array.prototype.slice.call(fileList || []);
        return Promise.all(files.map(function (file) {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function () { resolve({ name: file.name || "archivo", type: file.type || "application/octet-stream", data_url: reader.result }); };
            reader.onerror = function () { resolve(null); };
            reader.readAsDataURL(file);
          });
        })).then(function (rows) { return rows.filter(Boolean); });
      }
      function getCurrentProjectEvidence() {
        var notesEl = document.getElementById("project-detail-evidence-notes");
        return normalizeEvidencePayload({ notes: notesEl ? notesEl.value : "", files: evidenceState.files });
      }
      function renderProjectEvidencePane() {
        var listEl = document.getElementById("project-detail-evidence-list");
        var previewEl = document.getElementById("project-detail-evidence-preview");
        if (listEl) {
          if (!evidenceState.files.length) listEl.innerHTML = '<p class="mb-0 nexus-text-sm text-muted">Sin archivos adjuntos.</p>';
          else {
            var listHtml = '<ul class="list-unstyled mb-0">';
            evidenceState.files.forEach(function (file, idx) {
              listHtml += '<li class="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-2"><span class="nexus-text-sm text-truncate me-2">' + esc(file.name || ("Archivo " + (idx + 1))) + '</span><button type="button" class="btn btn-outline-danger btn-sm project-evidence-remove" data-evidence-index="' + idx + '">Quitar</button></li>';
            });
            listHtml += "</ul>";
            listEl.innerHTML = listHtml;
            listEl.querySelectorAll(".project-evidence-remove").forEach(function (btn) {
              btn.onclick = function () {
                var index = parseInt(btn.getAttribute("data-evidence-index"), 10);
                if (!isNaN(index)) evidenceState.files.splice(index, 1);
                renderProjectEvidencePane();
              };
            });
          }
        }
        if (previewEl) {
          var preview = "";
          var notesText = (document.getElementById("project-detail-evidence-notes") && document.getElementById("project-detail-evidence-notes").value || "").trim();
          preview += '<div class="border rounded p-2 mb-2"><div class="nexus-text-sm text-muted mb-1">Notas</div>' + (notesText ? ('<div style="white-space:pre-wrap">' + esc(notesText) + '</div>') : '<div class="nexus-text-sm text-muted">Sin notas.</div>') + "</div>";
          if (!evidenceState.files.length) preview += '<p class="mb-0 nexus-text-sm text-muted">Sin previsualizaciones.</p>';
          else {
            evidenceState.files.forEach(function (file) {
              if (String(file.type || "").indexOf("image/") === 0) preview += '<img src="' + file.data_url + '" alt="' + esc(file.name || "evidencia") + '" class="img-fluid rounded border mb-2">';
              else if (String(file.type || "").indexOf("video/") === 0) preview += '<video src="' + file.data_url + '" controls class="w-100 rounded border mb-2" style="max-height:240px"></video>';
              else preview += '<div class="border rounded p-2 mb-2"><span class="nexus-text-sm">' + esc(file.name || "Archivo") + "</span></div>";
            });
          }
          previewEl.innerHTML = preview;
        }
      }
      function bindProjectEvidenceEvents() {
        var notesEl = document.getElementById("project-detail-evidence-notes");
        var filesEl = document.getElementById("project-detail-evidence-files");
        if (notesEl) notesEl.oninput = function () { renderProjectEvidencePane(); };
        if (filesEl) filesEl.onchange = function () {
          if (!(filesEl.files && filesEl.files.length)) return;
          readFilesAsDataUrl(filesEl.files).then(function (rows) {
            evidenceState.files = evidenceState.files.concat(rows);
            filesEl.value = "";
            renderProjectEvidencePane();
          });
        };
      }
      function isDirty() {
        var n = (document.getElementById("project-detail-edit-name") && document.getElementById("project-detail-edit-name").value || "").trim();
        var d = (document.getElementById("project-detail-edit-desc") && document.getElementById("project-detail-edit-desc").value || "").trim();
        var st = (document.getElementById("project-detail-status-edit") && document.getElementById("project-detail-status-edit").value) || baselineStatus;
        if (n !== initialName || d !== initialDesc || st !== baselineStatus) return true;
        var curr = getProjectCriteriaLines("#project-detail-impl-criteria-list .project-detail-criteria-input, #project-detail-criteria-list .project-detail-criteria-input");
        // curr combines all by selector above; split properly below for robust check
        var currA = getProjectCriteriaLines("#project-detail-criteria-list .project-detail-criteria-input");
        var currI = getProjectCriteriaLines("#project-detail-impl-criteria-list .project-detail-impl-input");
        if (currA.length !== baselineCriteria.length || currI.length !== baselineImpl.length) return true;
        for (var i = 0; i < baselineCriteria.length; i++) if (currA[i] !== baselineCriteria[i]) return true;
        for (var k = 0; k < baselineImpl.length; k++) if (currI[k] !== baselineImpl[k]) return true;
        if (JSON.stringify(getCurrentProjectEvidence()) !== evidenceBaselineJson) return true;
        return false;
      }
      function saveMain() {
        var name = (document.getElementById("project-detail-edit-name").value || "").trim();
        var desc = (document.getElementById("project-detail-edit-desc").value || "").trim();
        var st = (document.getElementById("project-detail-status-edit") && document.getElementById("project-detail-status-edit").value) || (p.status || "ACTIVE");
        if (!name) return Promise.resolve(false);
        var payload = { name: name, description: desc };
        return window.fetchApi("/projects/" + p.id, { method: "PATCH", body: JSON.stringify(payload) }).then(function (r) {
          if (!(r && r.success)) return false;
          if (st !== p.status) {
            if (st === "ARCHIVED") return window.fetchApi("/projects/" + p.id + "/archive", { method: "PATCH" }).then(function (x) { return !!(x && x.success); });
          }
          return true;
        }).then(function (ok) {
          if (ok) {
            initialName = name;
            initialDesc = desc;
            baselineStatus = st;
          }
          return ok;
        });
      }
      function saveCriteriaOnly() {
        var a = getProjectCriteriaLines("#project-detail-criteria-list .project-detail-criteria-input");
        var i = getProjectCriteriaLines("#project-detail-impl-criteria-list .project-detail-impl-input");
        saveProjectCriteria(p.id, a, i);
        var evidenceSnapshot = getCurrentProjectEvidence();
        saveProjectEvidence(p.id, evidenceSnapshot);
        evidenceState = normalizeEvidencePayload(evidenceSnapshot);
        evidenceBaselineJson = JSON.stringify(evidenceState);
        baselineCriteria = a.slice();
        baselineImpl = i.slice();
        refreshProjectViewCriteriaFromEdit();
      }
      function criteriaToViewHtml(lines) {
        if (!lines || !lines.length) return '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
        var h = '<ul class="list-unstyled mb-0">';
        lines.forEach(function (line, idx) { h += '<li class="py-1">' + (idx + 1) + ". " + esc(line || "—") + "</li>"; });
        h += "</ul>";
        return h;
      }
      function refreshProjectViewCriteriaFromEdit() {
        var a = getProjectCriteriaLines("#project-detail-criteria-list .project-detail-criteria-input");
        var i = getProjectCriteriaLines("#project-detail-impl-criteria-list .project-detail-impl-input");
        var viewA = document.getElementById("project-detail-criteria-vista");
        var viewI = document.getElementById("project-detail-impl-vista");
        if (viewA) viewA.innerHTML = criteriaToViewHtml(a);
        if (viewI) viewI.innerHTML = criteriaToViewHtml(i);
      }
      function bindRowRemoveButtons() {
        document.querySelectorAll(".project-criterion-remove").forEach(function (btn) {
          btn.onclick = function () {
            var row = btn.closest(".project-criterion-row");
            var list = document.getElementById("project-detail-criteria-list");
            if (row && list && list.querySelectorAll(".project-criterion-row").length > 1) row.remove();
          };
        });
        document.querySelectorAll(".project-impl-remove").forEach(function (btn) {
          btn.onclick = function () {
            var row = btn.closest(".project-impl-row");
            var list = document.getElementById("project-detail-impl-criteria-list");
            if (row && list && list.querySelectorAll(".project-impl-row").length > 1) row.remove();
          };
        });
      }
      bindRowRemoveButtons();
      var btnCriteriaAdd = document.getElementById("project-detail-criteria-add");
      if (btnCriteriaAdd) btnCriteriaAdd.onclick = function () {
        var list = document.getElementById("project-detail-criteria-list");
        var n = list.querySelectorAll(".project-criterion-row").length + 1;
        var row = document.createElement("div");
        row.className = "project-criterion-row d-flex gap-2 align-items-center mb-2";
        row.innerHTML = '<input type="text" class="form-control form-control-sm project-detail-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm project-criterion-remove" aria-label="Quitar criterio">&times;</button>';
        list.appendChild(row);
        bindRowRemoveButtons();
      };
      var btnImplAdd = document.getElementById("project-detail-impl-add");
      if (btnImplAdd) btnImplAdd.onclick = function () {
        var list = document.getElementById("project-detail-impl-criteria-list");
        var n = list.querySelectorAll(".project-impl-row").length + 1;
        var row = document.createElement("div");
        row.className = "project-impl-row d-flex gap-2 align-items-center mb-2";
        row.innerHTML = '<input type="text" class="form-control form-control-sm project-detail-impl-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm project-impl-remove" aria-label="Quitar criterio">&times;</button>';
        list.appendChild(row);
        bindRowRemoveButtons();
      };
      var btnCriteriaSave = document.getElementById("project-detail-criteria-save");
      if (btnCriteriaSave) btnCriteriaSave.onclick = function () {
        saveCriteriaOnly();
        var msg = document.getElementById("project-detail-criteria-msg");
        if (msg) msg.textContent = "Guardado";
      };
      var btnImplSave = document.getElementById("project-detail-impl-save");
      if (btnImplSave) btnImplSave.onclick = function () {
        saveCriteriaOnly();
        var msg = document.getElementById("project-detail-impl-msg");
        if (msg) msg.textContent = "Guardado";
      };
      var btnExport = document.getElementById("project-detail-export");
      if (btnExport) btnExport.onclick = function () {
        var payload = {
          project: {
            id: p.id,
            name: (document.getElementById("project-detail-edit-name") && document.getElementById("project-detail-edit-name").value) || (p.name || ""),
            description: (document.getElementById("project-detail-edit-desc") && document.getElementById("project-detail-edit-desc").value) || (p.description || ""),
            status: (document.getElementById("project-detail-status-edit") && document.getElementById("project-detail-status-edit").value) || (p.status || "ACTIVE"),
            evidence: getCurrentProjectEvidence(),
            acceptance_criteria: getProjectCriteriaLines("#project-detail-criteria-list .project-detail-criteria-input"),
            implementation_criteria: getProjectCriteriaLines("#project-detail-impl-criteria-list .project-detail-impl-input")
          },
          exported_at: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "project-" + ((p.number != null && p.number !== "") ? String(p.number) : (p.id || "config")) + "-config.json";
        a.click();
        URL.revokeObjectURL(a.href);
      };
      var importInput = document.getElementById("project-detail-import-input");
      var btnImport = document.getElementById("project-detail-import");
      if (btnImport && importInput) btnImport.onclick = function () { importInput.click(); };
      if (importInput) importInput.onchange = function () {
        var file = importInput.files && importInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(reader.result);
            var nameEl = document.getElementById("project-detail-edit-name");
            var descEl = document.getElementById("project-detail-edit-desc");
            var stEl = document.getElementById("project-detail-status-edit");
            var notesEl = document.getElementById("project-detail-evidence-notes");
            var projectData = (data && data.project && typeof data.project === "object") ? data.project : data;
            if (nameEl && projectData.name !== undefined) nameEl.value = projectData.name || "";
            if (descEl && projectData.description !== undefined) descEl.value = projectData.description || "";
            if (stEl && projectData.status) stEl.value = projectData.status;
            if (projectData.evidence) evidenceState = normalizeEvidencePayload(projectData.evidence);
            if (notesEl) notesEl.value = evidenceState.notes || "";
            var listA = document.getElementById("project-detail-criteria-list");
            if (listA && Array.isArray(projectData.acceptance_criteria)) {
              listA.innerHTML = "";
              (projectData.acceptance_criteria.length ? projectData.acceptance_criteria : [""]).forEach(function (val, idx) {
                var row = document.createElement("div");
                row.className = "project-criterion-row d-flex gap-2 align-items-center mb-2";
                row.innerHTML = '<input type="text" class="form-control form-control-sm project-detail-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + esc(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm project-criterion-remove" aria-label="Quitar criterio">&times;</button>';
                listA.appendChild(row);
              });
            }
            var listI = document.getElementById("project-detail-impl-criteria-list");
            if (listI && Array.isArray(projectData.implementation_criteria)) {
              listI.innerHTML = "";
              (projectData.implementation_criteria.length ? projectData.implementation_criteria : [""]).forEach(function (val, idx) {
                var row = document.createElement("div");
                row.className = "project-impl-row d-flex gap-2 align-items-center mb-2";
                row.innerHTML = '<input type="text" class="form-control form-control-sm project-detail-impl-input" placeholder="Criterio ' + (idx + 1) + '" value="' + esc(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm project-impl-remove" aria-label="Quitar criterio">&times;</button>';
                listI.appendChild(row);
              });
            }
            bindRowRemoveButtons();
            bindProjectEvidenceEvents();
            renderProjectEvidencePane();
            var tabEd = document.getElementById("project-detail-tab-edicion");
            if (tabEd) tabEd.click();
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Configuración del proyecto importada correctamente.");
          } catch (e) {
            window.openNexusAlertModal({ title: "Error", message: "El archivo no es un JSON válido." });
          }
          importInput.value = "";
        };
        reader.readAsText(file);
      };
      var btnArchive = document.getElementById("btn-archive");
      if (btnArchive) btnArchive.onclick = function () {
        confirmArchiveProject(p, function () { window.location.hash = "#/projects"; });
      };
      var btnDelete = document.getElementById("btn-delete-project");
      if (btnDelete) btnDelete.onclick = function () { confirmDeleteProject(p.id, function () { window.location.hash = "#/projects"; }); };
      bindProjectEvidenceEvents();
      renderProjectEvidencePane();
    }

    if (projectId) {
      runList();
      loadProjectDetail(projectId, openInEditMode);
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
      document.querySelectorAll("#content .btn-archive-project").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var id = a.getAttribute("data-id");
          var project = (currentItems || []).find(function (p) { return p.id === id; }) || { id: id };
          confirmArchiveProject(project, runList);
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
        function doCreate() {
          var name = (document.getElementById("project-form-name").value || "").trim();
          var desc = (document.getElementById("project-form-desc").value || "").trim();
          var errEl = document.getElementById("project-form-error");
          errEl.classList.add("d-none");
          if (!name) { errEl.textContent = "El nombre es obligatorio."; errEl.classList.remove("d-none"); return Promise.resolve(false); }
          return window.fetchApi("/projects", { method: "POST", body: JSON.stringify({ name: name, description: desc }) }).then(function (r) {
            if (r && r.success) { runList(); return true; }
            errEl.textContent = (r && r.error && r.error.message) || "Error al crear el proyecto."; errEl.classList.remove("d-none"); return false;
          });
        }
        window.openNexusFormModal({
          id: "projectNewModal", title: "Nuevo proyecto", bodyHtml: bodyHtml, mode: "create",
          primaryButtonId: "project-form-submit", primaryLabel: "Crear",
          getDirtyState: function () { var n = (document.getElementById("project-form-name").value || "").trim(); var d = (document.getElementById("project-form-desc").value || "").trim(); return n.length > 0 || d.length > 0; },
          onSaveBeforeClose: doCreate
        }, function (bsModal) {
          doCreate().then(function (ok) { if (ok) bsModal.hide(); });
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
      var btnExportFull = document.getElementById("btn-projects-export-full");
      if (btnExportFull) btnExportFull.onclick = function () {
        fetchAllProjects().then(function (projects) {
          var nodesP = (projects || []).map(function (proj) { return buildProjectExportNode(proj); });
          return Promise.all(nodesP).then(function (nodes) {
            var payload = { exported_at: new Date().toISOString(), projects: nodes };
            var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "projects-full-config.json";
            a.click();
            URL.revokeObjectURL(a.href);
          });
        });
      };
      var btnImportFull = document.getElementById("btn-projects-import-full");
      var inputImportFull = document.getElementById("projects-import-full-input");
      if (btnImportFull && inputImportFull) btnImportFull.onclick = function () { inputImportFull.click(); };
      if (inputImportFull) inputImportFull.onchange = function () {
        var file = inputImportFull.files && inputImportFull.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var parsed;
          try {
            parsed = JSON.parse(reader.result);
          } catch (e) {
            window.openNexusAlertModal({ title: "Importar proyectos", message: "El archivo no es un JSON válido." });
            inputImportFull.value = "";
            return;
          }
          window.fetchApi("/projects/import", { method: "POST", body: JSON.stringify(parsed) }).then(function (resp) {
            if (resp && resp.success && resp.data) {
              var d = resp.data;
              applyImportedFeatureCriteria(parsed).then(function () {
                if (typeof window.showSuccessMessage === "function") {
                  window.showSuccessMessage("Importación completada. Proyectos: " + (d.projects_created || 0) + ", Features: " + (d.features_created || 0) + ", Stories: " + (d.stories_created || 0) + ".");
                }
                runList();
              }).catch(function () {
                if (typeof window.showSuccessMessage === "function") {
                  window.showSuccessMessage("Importación completada. Proyectos: " + (d.projects_created || 0) + ", Features: " + (d.features_created || 0) + ", Stories: " + (d.stories_created || 0) + ".");
                }
                runList();
              });
              return;
            }
            var code = resp && resp.error && resp.error.code;
            var msg = (resp && resp.error && resp.error.message) || "No se pudo importar el archivo.";
            var detailsPath = resp && resp.error && resp.error.details && resp.error.details.path;
            if (detailsPath) msg += " (" + detailsPath + ")";
            window.openNexusAlertModal({ title: code || "Importar proyectos", message: msg });
          });
          inputImportFull.value = "";
        };
        reader.readAsText(file);
      };
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
