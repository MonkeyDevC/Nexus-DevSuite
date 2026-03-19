/**
 * Features — ETAPA 14: GET /projects/:id/features. Breadcrumb Dashboard/Projects/[Project]/Features, design system.
 */
(function () {
  function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function createEvidenceRef() { return "img-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function buildEvidenceRefTag(ref) { return "<evidence://" + String(ref || "") + ">"; }
  function insertTextAtCursor(el, text) {
    if (!el) return;
    var start = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
    var end = typeof el.selectionEnd === "number" ? el.selectionEnd : el.value.length;
    var before = el.value.slice(0, start);
    var after = el.value.slice(end);
    el.value = before + text + after;
    var nextPos = start + text.length;
    if (typeof el.setSelectionRange === "function") el.setSelectionRange(nextPos, nextPos);
  }

  window.registerView("features", async function () {
    await window.showNav();
    window.setContent(window.showLoading());
    const projectsRes = await window.fetchApi("/projects?page=1&limit=50");
    const projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];
    var match = window.location.hash.match(/[?&]project=([^&]+)/);
    var projectParam = match ? decodeURIComponent(match[1]) : (window.getHashSegments()[1] || "");
    if (projectParam && !match) {
      try {
        var featCheck = await window.fetchApi("/features/" + projectParam);
        if (featCheck && featCheck.success && featCheck.data && featCheck.data.project_id) projectParam = featCheck.data.project_id;
      } catch (e) {}
    }

    var state = { projectId: projectParam || "", page: 1, limit: 10, statusFilter: [], search: "", sort: "title", dir: "asc", projectSearch: "" };
    var currentMeta = null;
    var currentItems = [];

    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }

    function formatProjectListLabel(project) {
      if (!project) return "—";
      var pid = (project.number != null && project.number !== "") ? ("P" + String(project.number)) : ((project.id || "").slice(0, 8) || "—");
      var name = (project.name && String(project.name).trim()) ? String(project.name).trim() : (project.id || "—");
      return pid + " - " + name;
    }

    function getProjectListLabelById(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return p ? formatProjectListLabel(p) : id;
    }

    function featureCriteriaStorageKey(featureId) {
      return "nexus.feature.criteria." + String(featureId || "");
    }

    function loadFeatureCriteria(featureId) {
      try {
        var raw = localStorage.getItem(featureCriteriaStorageKey(featureId));
        if (!raw) return { acceptance: [], implementation: [] };
        var parsed = JSON.parse(raw);
        var acceptance = Array.isArray(parsed && parsed.acceptance) ? parsed.acceptance.filter(Boolean).map(function (x) { return String(x).trim(); }).filter(Boolean) : [];
        var implementation = Array.isArray(parsed && parsed.implementation) ? parsed.implementation.filter(Boolean).map(function (x) { return String(x).trim(); }).filter(Boolean) : [];
        return { acceptance: acceptance, implementation: implementation };
      } catch (e) {
        return { acceptance: [], implementation: [] };
      }
    }

    function saveFeatureCriteria(featureId, acceptance, implementation) {
      var payload = {
        acceptance: Array.isArray(acceptance) ? acceptance.filter(Boolean).map(function (x) { return String(x).trim(); }).filter(Boolean) : [],
        implementation: Array.isArray(implementation) ? implementation.filter(Boolean).map(function (x) { return String(x).trim(); }).filter(Boolean) : []
      };
      localStorage.setItem(featureCriteriaStorageKey(featureId), JSON.stringify(payload));
    }

    function featureEvidenceStorageKey(featureId) {
      return "nexus.feature.evidence." + String(featureId || "");
    }

    function normalizeEvidencePayload(payload) {
      var p = payload && typeof payload === "object" ? payload : {};
      return {
        notes: p.notes != null ? String(p.notes) : "",
        files: Array.isArray(p.files) ? p.files.filter(function (f) { return f && f.data_url; }).map(function (f) {
          return {
            ref: f.ref ? String(f.ref) : createEvidenceRef(),
            name: f.name ? String(f.name) : "archivo",
            type: f.type ? String(f.type) : "application/octet-stream",
            data_url: String(f.data_url)
          };
        }) : []
      };
    }

    function loadFeatureEvidence(featureId) {
      try {
        var raw = localStorage.getItem(featureEvidenceStorageKey(featureId));
        if (!raw) return { notes: "", files: [] };
        return normalizeEvidencePayload(JSON.parse(raw));
      } catch (e) {
        return { notes: "", files: [] };
      }
    }

    function saveFeatureEvidence(featureId, evidence) {
      localStorage.setItem(featureEvidenceStorageKey(featureId), JSON.stringify(normalizeEvidencePayload(evidence)));
    }

    function getProjectOptionsBySearch(term, selectedId) {
      var q = (term || "").trim().toLowerCase();
      var filtered = projects.filter(function (p) {
        if (!q) return true;
        var name = (p.name || "").toLowerCase();
        var description = (p.description || "").toLowerCase();
        var id = (p.id || "").toLowerCase();
        var number = (p.number != null && p.number !== "") ? ("p" + String(p.number).toLowerCase()) : "";
        return name.indexOf(q) !== -1 || description.indexOf(q) !== -1 || id.indexOf(q) !== -1 || number.indexOf(q) !== -1;
      });
      if (selectedId && !filtered.some(function (p) { return p.id === selectedId; })) {
        var selectedProject = projects.find(function (p) { return p.id === selectedId; });
        if (selectedProject) filtered.unshift(selectedProject);
      }
      return filtered;
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
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-2 feat-toolbar-row">';
      html += (typeof window.renderPageSizeSelector === "function" ? window.renderPageSizeSelector({ selectId: "feat-per-page", currentLimit: state.limit, options: [10, 25, 50] }) : "");
      var selectedProjectLabel = state.projectId ? getProjectListLabelById(state.projectId) : "Seleccionar proyecto";
      html += '<div class="d-flex flex-column">';
      html += '<label class="mb-0 nexus-text-sm">Proyecto</label>';
      html += '<div class="dropdown d-inline-block" data-bs-boundary="viewport">';
      html += '<button class="btn btn-outline-secondary btn-sm d-flex justify-content-between align-items-center text-start" type="button" id="feat-project-filter-btn" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-auto-close="outside" aria-expanded="false" aria-haspopup="true" aria-label="Filtrar por proyecto" title="Proyecto" style="min-width:320px; max-width:320px">';
      html += '<span id="feat-project-selected-label" class="text-truncate me-2">' + esc(selectedProjectLabel) + '</span><span aria-hidden="true">&#9662;</span>';
      html += '</button>';
      html += '<ul class="dropdown-menu dropdown-menu-start stories-titulo-dropdown-menu" id="feat-project-filter-menu" style="min-width:320px; max-width:360px; max-height:min(380px, 60vh); overflow:hidden; padding:0">';
      html += '<li class="px-3 py-2 border-bottom"><input type="search" class="form-control form-control-sm" id="feat-search-project" placeholder="Buscar proyecto..." aria-label="Buscar proyecto" value="' + esc(state.projectSearch || "") + '"></li>';
      html += '<li class="px-0 py-0 flex-grow-1" style="max-height:240px; overflow-y:auto;"><ul class="list-unstyled mb-0" id="feat-project-matches">';
      html += '<li class="dropdown-item feat-project-match border-bottom' + (!state.projectId ? " active" : "") + '" data-project-id="" data-project-name="Seleccionar proyecto" style="cursor:pointer; white-space:normal">Seleccionar proyecto</li>';
      getProjectOptionsBySearch(state.projectSearch, state.projectId).forEach(function (p) {
        var activeClass = (state.projectId && p.id === state.projectId) ? " active" : "";
        var projectLabel = formatProjectListLabel(p);
        html += '<li class="dropdown-item feat-project-match border-bottom' + activeClass + '" data-project-id="' + esc(p.id) + '" data-project-name="' + esc(projectLabel) + '" style="cursor:pointer; white-space:normal">' + esc(projectLabel) + "</li>";
      });
      html += '</ul></li>';
      html += "</ul></div></div>";
      html += window.renderClearFiltersButton({ show: hasFilter, id: "feat-clear-filters-btn" });
      html += '<div class="d-flex flex-wrap gap-2 ms-auto feat-toolbar-actions">';
      html += '<button type="button" id="feat-btn-export" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Exportar features"><i data-lucide="download"></i> Exportar</button>';
      html += '<input type="file" id="feat-import-input" class="d-none" accept=".json,application/json">';
      html += '<button type="button" id="feat-btn-import" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Importar features"><i data-lucide="upload"></i> Importar</button>';
      html += '<button type="button" id="feat-btn-new" class="btn btn-nexus-primary btn-sm tooltip" data-tooltip="Crear nueva feature"><i data-lucide="plus"></i> Nueva feature</button>';
      html += "</div>";
      html += "</div>";
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver las features.</p></div>';
        html += "</div>";
        return html;
      }
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay features") + "</p><p class=\"nexus-text-secondary\">Cree una feature o ajuste los filtros.</p></div>";
      } else {
        var pageOffset = ((meta && meta.page ? meta.page : state.page) - 1) * ((meta && meta.limit ? meta.limit : state.limit) || 10);
        var featureDisplayIdById = {};
        (items || []).forEach(function (f, idx) {
          var number = (f && f.number != null && f.number !== "") ? f.number : (pageOffset + idx + 1);
          featureDisplayIdById[f.id] = "FT-" + String(number);
        });
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
            { label: "ID" },
            { headerHtml: tituloHeaderHtml },
            { label: "Descripción de la feature" },
            { label: "Prioridad", sortKey: "priority" },
            { headerHtml: estadoHeaderHtml },
            { label: "Progreso stories" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (f) {
            var total = f.user_stories_count != null ? f.user_stories_count : (f.stories_count != null ? f.stories_count : 0);
            var done = f.stories_done != null ? f.stories_done : 0;
            var pct = f.progress_pct != null ? f.progress_pct : (total > 0 ? Math.round((done / total) * 100) : 0);
            var count = total === 0 && done === 0 ? "—" : (done + "/" + total + (total > 0 ? " (" + pct + "%)" : ""));
            var desc = (f.description || "").trim();
            var descShort = desc.length > 80 ? desc.slice(0, 77) + "…" : desc;
            var descCell = desc ? ('<span class="nexus-text-sm" title="' + esc(desc) + '">' + esc(descShort || "—") + "</span>") : "—";
            var featStatuses = ["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"];
            var statusSelect = '<select class="form-select form-select-sm feat-status-select nexus-input" data-feature-id="' + esc(f.id) + '" style="min-width:9rem; width:100%; max-width:100%" aria-label="Estado">';
            featStatuses.forEach(function (st) {
              statusSelect += '<option value="' + esc(st) + '"' + (f.status === st ? ' selected' : '') + '>' + esc(st) + '</option>';
            });
            statusSelect += '</select>';
            return [
              '<span class="nexus-text-sm text-muted">' + esc(featureDisplayIdById[f.id] || ("FT-" + ((f && f.id) ? String(f.id).slice(0, 8) : "—"))) + "</span>",
              '<a href="#" class="feat-view-link" data-feature-id="' + esc(f.id || "") + '">' + esc(f.title || f.id) + "</a>",
              descCell,
              '<span class="nexus-text-sm">' + esc(f.priority || "—") + "</span>",
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

    function syncProjectHashWithState() {
      var nextHash = state.projectId ? ("#/features?project=" + encodeURIComponent(state.projectId)) : "#/features";
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
        return true;
      }
      return false;
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

    function openFeatureDetailModal(featureId) {
      if (!featureId || typeof window.openNexusFormModal !== "function") return;
      var existingModal = document.getElementById("featureDetailModal");
      if (existingModal) {
        var existingInstance = typeof bootstrap !== "undefined" ? bootstrap.Modal.getInstance(existingModal) : null;
        if (existingInstance) {
          existingInstance.show();
          return;
        }
        existingModal.remove();
      }
      window.fetchApi("/features/" + featureId).then(function (res) {
        if (!(res && res.success && res.data)) {
          window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "No se pudo cargar la feature." });
          return;
        }
        var f = res.data;
        var stored = loadFeatureCriteria(f.id);
        var acceptanceBase = stored.acceptance.slice();
        var implementationBase = stored.implementation.slice();
        var evidenceState = loadFeatureEvidence(f.id);
        var evidenceBaselineJson = JSON.stringify(evidenceState);
        var statusBase = f.status || "DRAFT";
        var priorityBase = f.priority || "MEDIUM";
        var titleBase = (f.title || "").trim();
        var descriptionBase = (f.description || "").trim();
        var featureDisplayNumber = null;
        if (f.number != null && f.number !== "") {
          featureDisplayNumber = String(f.number);
        } else {
          var idxInCurrent = (currentItems || []).findIndex(function (x) { return x && x.id === f.id; });
          if (idxInCurrent >= 0) {
            var pageOffsetForModal = (state.page - 1) * (state.limit || 10);
            featureDisplayNumber = String(pageOffsetForModal + idxInCurrent + 1);
          }
        }
        var featureDisplayId = "FT-" + (featureDisplayNumber || "—");

        var currentHash = window.location.hash || "";
        if (currentHash.indexOf("feature=") !== -1) {
          var cleaned = currentHash.replace(/([?&])feature=[^&]*/, "$1").replace(/[?&]$/, "");
          if (cleaned !== currentHash) {
            window.history.replaceState(null, "", cleaned);
          }
        }

        function renderCriteriaListHtml(lines) {
          if (!lines || !lines.length) return '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
          var h = '<ol class="criteria-list criteria-list-numbered">';
          lines.forEach(function (line) { h += "<li>" + esc(line || "—") + "</li>"; });
          h += "</ol>";
          return h;
        }
        function getLines(selector) {
          var inputs = document.querySelectorAll("#featureDetailModal " + selector);
          var out = [];
          if (inputs) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) out.push(v); }
          return out;
        }
        function refreshViewFromEdit() {
          var viewA = document.getElementById("feature-detail-criteria-vista");
          var viewI = document.getElementById("feature-detail-impl-vista");
          var viewStatus = document.getElementById("feature-detail-status-vista");
          var viewPriority = document.getElementById("feature-detail-priority-vista");
          var viewTitle = document.getElementById("feature-detail-title-vista");
          var viewDescription = document.getElementById("feature-detail-description-vista");
          var pageTitle = document.getElementById("feature-detail-page-title");
          var statusSel = document.getElementById("feature-detail-status-edit");
          var prioritySel = document.getElementById("feature-detail-priority-edit");
          var titleEl = document.getElementById("feature-detail-title-edit");
          var descEl = document.getElementById("feature-detail-desc-edit");
          if (viewA) viewA.innerHTML = renderCriteriaListHtml(getLines(".feature-detail-criteria-input"));
          if (viewI) viewI.innerHTML = renderCriteriaListHtml(getLines(".feature-detail-impl-input"));
          if (viewStatus && statusSel) viewStatus.textContent = statusSel.value || "—";
          if (viewPriority && prioritySel) viewPriority.textContent = prioritySel.value || "—";
          if (viewTitle && titleEl) viewTitle.textContent = (titleEl.value || "").trim() || "—";
          if (viewDescription && descEl) {
            var d = (descEl.value || "").trim();
            viewDescription.innerHTML = d ? ('<p class="viewer-description-text">' + esc(d) + "</p>") : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
          }
          if (pageTitle && titleEl) pageTitle.textContent = (titleEl.value || "").trim() || "Feature";
        }
        function bindRemoveButtons() {
          document.querySelectorAll("#featureDetailModal .feature-criterion-remove").forEach(function (btn) {
            btn.onclick = function () {
              var row = btn.closest(".feature-criterion-row");
              var list = document.getElementById("feature-detail-criteria-list");
              if (row && list && list.querySelectorAll(".feature-criterion-row").length > 1) row.remove();
            };
          });
          document.querySelectorAll("#featureDetailModal .feature-impl-remove").forEach(function (btn) {
            btn.onclick = function () {
              var row = btn.closest(".feature-impl-row");
              var list = document.getElementById("feature-detail-impl-list");
              if (row && list && list.querySelectorAll(".feature-impl-row").length > 1) row.remove();
            };
          });
        }
        function readFilesAsDataUrl(fileList) {
          var files = Array.prototype.slice.call(fileList || []);
          return Promise.all(files.map(function (file) {
            return new Promise(function (resolve) {
              var reader = new FileReader();
              reader.onload = function () {
                resolve({
                  ref: createEvidenceRef(),
                  name: file.name || "archivo",
                  type: file.type || "application/octet-stream",
                  data_url: reader.result
                });
              };
              reader.onerror = function () { resolve(null); };
              reader.readAsDataURL(file);
            });
          })).then(function (rows) { return rows.filter(Boolean); });
        }
        function getCurrentEvidenceData() {
          var notesEl = document.getElementById("feature-detail-evidence-notes");
          return normalizeEvidencePayload({
            notes: notesEl ? notesEl.value : "",
            files: evidenceState.files
          });
        }
        function renderEvidencePane() {
          var previewEl = document.getElementById("feature-detail-evidence-preview");
          if (previewEl) {
            var preview = "";
            var notesText = (document.getElementById("feature-detail-evidence-notes") && document.getElementById("feature-detail-evidence-notes").value || "").trim();
            var filesByRef = {};
            var filesByName = {};
            evidenceState.files.forEach(function (file) {
              if (file && file.ref) filesByRef[String(file.ref)] = file;
              if (file && file.name) filesByName[String(file.name)] = file;
            });
            function renderNotesWithInlineImages(text) {
              if (!text) return '<div class="nexus-text-sm text-muted">Sin notas.</div>';
              var pattern = /<([^>\n]+)>/g;
              var html = "";
              var last = 0;
              var m;
              while ((m = pattern.exec(text)) !== null) {
                var segment = text.slice(last, m.index);
                if (segment) html += esc(segment).replace(/\n/g, "<br>");
                var token = (m[1] || "").trim();
                var ref = token.indexOf("evidence://") === 0 ? token.slice("evidence://".length) : token;
                var file = filesByRef[ref] || filesByName[ref];
                if (file && String(file.type || "").indexOf("image/") === 0) {
                  html += '<div class="my-2"><img src="' + file.data_url + '" alt="' + esc(file.name || "evidencia") + '" class="img-fluid rounded border"></div>';
                } else {
                  html += esc(m[0]);
                }
                last = pattern.lastIndex;
              }
              var tail = text.slice(last);
              if (tail) html += esc(tail).replace(/\n/g, "<br>");
              return html || '<div class="nexus-text-sm text-muted">Sin notas.</div>';
            }
            preview += '<div style="white-space:normal">' + renderNotesWithInlineImages(notesText) + "</div>";
            previewEl.innerHTML = preview;
          }
        }
        function bindEvidenceEvents() {
          var notesEl = document.getElementById("feature-detail-evidence-notes");
          if (notesEl) notesEl.oninput = function () { renderEvidencePane(); };
          if (notesEl) notesEl.onpaste = function (ev) {
            var items = (ev.clipboardData && ev.clipboardData.items) ? Array.prototype.slice.call(ev.clipboardData.items) : [];
            var imageFiles = items
              .filter(function (it) { return it && it.kind === "file" && String(it.type || "").indexOf("image/") === 0; })
              .map(function (it) { return it.getAsFile(); })
              .filter(Boolean);
            if (!imageFiles.length) return;
            ev.preventDefault();
            readFilesAsDataUrl(imageFiles).then(function (rows) {
              if (!rows.length) return;
              evidenceState.files = evidenceState.files.concat(rows);
              var tags = rows.map(function (row) { return buildEvidenceRefTag(row.ref); }).join("\n");
              var prefix = notesEl.value && !/\n$/.test(notesEl.value) ? "\n" : "";
              insertTextAtCursor(notesEl, prefix + tags);
              renderEvidencePane();
            });
          };
          bindEvidenceLayoutControls();
        }
        function bindEvidenceLayoutControls() {
          var featureModalEl = document.getElementById("featureDetailModal");
          if (typeof window.bindEvidenceLayout === "function") window.bindEvidenceLayout(featureModalEl || document);
        }
        function saveCriteriaOnly() {
          var a = getLines(".feature-detail-criteria-input");
          var i = getLines(".feature-detail-impl-input");
          saveFeatureCriteria(f.id, a, i);
          acceptanceBase = a.slice();
          implementationBase = i.slice();
          refreshViewFromEdit();
        }
        function doSaveAll() {
          var titleEl = document.getElementById("feature-detail-title-edit");
          var descEl = document.getElementById("feature-detail-desc-edit");
          var nextTitle = (titleEl && titleEl.value || "").trim();
          var nextDescription = (descEl && descEl.value || "").trim();
          var statusSel = document.getElementById("feature-detail-status-edit");
          var prioritySel = document.getElementById("feature-detail-priority-edit");
          var nextStatus = statusSel ? (statusSel.value || "DRAFT") : "DRAFT";
          var nextPriority = prioritySel ? (prioritySel.value || "MEDIUM") : "MEDIUM";
          if (!nextTitle || !nextDescription) {
            window.openNexusAlertModal({ title: "Validación", message: "Título y descripción son obligatorios." });
            return Promise.resolve(false);
          }
          var detailsTask = (nextTitle !== titleBase || nextDescription !== descriptionBase || nextPriority !== priorityBase)
            ? window.fetchApi("/features/" + f.id, {
              method: "PATCH",
              body: JSON.stringify({ title: nextTitle, description: nextDescription, priority: nextPriority })
            }).then(function (r) {
              if (r && r.success) {
                titleBase = nextTitle;
                descriptionBase = nextDescription;
                priorityBase = nextPriority;
                f.title = nextTitle;
                f.description = nextDescription;
                f.priority = nextPriority;
                return true;
              }
              window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "No se pudo actualizar título y descripción de la feature." });
              return false;
            })
            : Promise.resolve(true);
          var statusTask = (nextStatus !== statusBase)
            ? window.fetchApi("/features/" + f.id + "/status", { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }).then(function (r) {
              if (r && r.success) { statusBase = nextStatus; return true; }
              window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "No se pudo actualizar el estado de la feature." });
              return false;
            })
            : Promise.resolve(true);
          return detailsTask.then(function (detailsOk) {
            if (!detailsOk) return false;
            return statusTask;
          }).then(function (ok) {
            if (!ok) return false;
            saveCriteriaOnly();
            var evidenceSnapshot = getCurrentEvidenceData();
            saveFeatureEvidence(f.id, evidenceSnapshot);
            evidenceState = normalizeEvidencePayload(evidenceSnapshot);
            evidenceBaselineJson = JSON.stringify(evidenceState);
            refreshViewFromEdit();
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Feature actualizada correctamente.");
            loadFeatures();
            return true;
          });
        }
        function getDirtyState() {
          var tabEd = document.getElementById("feature-detail-tab-edicion");
          var tabEv = document.getElementById("feature-detail-tab-evidencia");
          if (tabEd && tabEv && !tabEd.classList.contains("active") && !tabEv.classList.contains("active")) {
            return false;
          }
          var titleEl = document.getElementById("feature-detail-title-edit");
          var descEl = document.getElementById("feature-detail-desc-edit");
          var currTitle = (titleEl && titleEl.value || "").trim();
          var currDescription = (descEl && descEl.value || "").trim();
          if (currTitle !== titleBase || currDescription !== descriptionBase) return true;
          var prioritySel = document.getElementById("feature-detail-priority-edit");
          if (prioritySel && (prioritySel.value || "MEDIUM") !== priorityBase) return true;
          var currEvidenceJson = JSON.stringify(getCurrentEvidenceData());
          if (currEvidenceJson !== evidenceBaselineJson) return true;
          var statusSel = document.getElementById("feature-detail-status-edit");
          if (statusSel && (statusSel.value || "DRAFT") !== statusBase) return true;
          var a = getLines(".feature-detail-criteria-input");
          var i = getLines(".feature-detail-impl-input");
          if (a.length !== acceptanceBase.length || i.length !== implementationBase.length) return true;
          for (var x = 0; x < acceptanceBase.length; x++) if (a[x] !== acceptanceBase[x]) return true;
          for (var y = 0; y < implementationBase.length; y++) if (i[y] !== implementationBase[y]) return true;
          return false;
        }

        var featStatuses = ["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"];
        var featPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        var statusSelectHtml = '<label class="editor-label" for="feature-detail-status-edit">Estado</label><select id="feature-detail-status-edit" class="form-select form-select-sm form-modern-input" style="max-width:100%">';
        featStatuses.forEach(function (s) { statusSelectHtml += '<option value="' + esc(s) + '"' + (statusBase === s ? ' selected' : '') + '>' + esc(s) + '</option>'; });
        statusSelectHtml += "</select>";
        var prioritySelectHtml = '<label class="editor-label" for="feature-detail-priority-edit">Prioridad</label><select id="feature-detail-priority-edit" class="form-select form-select-sm form-modern-input" style="max-width:100%">';
        featPriorities.forEach(function (p) { prioritySelectHtml += '<option value="' + esc(p) + '"' + (priorityBase === p ? ' selected' : '') + '>' + esc(p) + '</option>'; });
        prioritySelectHtml += "</select>";

        var bodyHtml = window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Proyectos", href: "#/projects" },
          { label: getProjectName(state.projectId), href: state.projectId ? ("#/projects/" + state.projectId) : "#/projects" },
          { label: "Features", href: state.projectId ? ("#/features?project=" + state.projectId) : "#/features" }
        ]);
        bodyHtml += '<h1 class="nexus-page-title" id="feature-detail-page-title">' + esc(f.title || "Feature") + "</h1>";
        bodyHtml += '<div class="nexus-card p-4" style="max-width:100%">';
        bodyHtml += '<div class="view-mode-switch mb-3" role="tablist" aria-label="Modo de vista"><button type="button" class="mode-btn nav-link active tooltip" id="feature-detail-tab-vista" data-bs-toggle="tab" data-bs-target="#feature-detail-panel-vista" aria-selected="true" data-tooltip="Modo vista"><i data-lucide="eye"></i> Vista</button><button type="button" class="mode-btn nav-link tooltip" id="feature-detail-tab-edicion" data-bs-toggle="tab" data-bs-target="#feature-detail-panel-edicion" aria-selected="false" data-tooltip="Modo edición"><i data-lucide="pencil"></i> Edición</button><button type="button" class="mode-btn nav-link tooltip" id="feature-detail-tab-evidencia" data-bs-toggle="tab" data-bs-target="#feature-detail-panel-evidencia" aria-selected="false" data-tooltip="Modo evidencia"><i data-lucide="paperclip"></i> Evidencia</button><button type="button" class="mode-btn nav-link tooltip" id="feature-detail-tab-backlog" data-bs-toggle="tab" data-bs-target="#feature-detail-panel-backlog" aria-selected="false" data-tooltip="Backlog de user stories"><i data-lucide="list-checks"></i> Backlog</button></div>';
        bodyHtml += '<div class="tab-content">';
        bodyHtml += '<div class="tab-pane fade show active" id="feature-detail-panel-vista" role="tabpanel"><div class="entity-viewer">';
        bodyHtml += '<section class="viewer-header"><h2 class="viewer-title" id="feature-detail-title-vista">' + esc(f.title || "—") + '</h2></section>';
        bodyHtml += '<section class="viewer-metadata">';
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">ID</div><div class="metadata-value">' + esc(featureDisplayId) + '</div></div>';
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Estado</div><div class="metadata-value" id="feature-detail-status-vista">' + esc(statusBase) + '</div></div>';
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Prioridad</div><div class="metadata-value" id="feature-detail-priority-vista">' + esc(f.priority || "—") + '</div></div>';
        var totalSt = f.user_stories_count != null ? f.user_stories_count : 0;
        var doneSt = f.stories_done != null ? f.stories_done : 0;
        var pctSt = f.progress_pct != null ? f.progress_pct : (totalSt > 0 ? Math.round((doneSt / totalSt) * 100) : 0);
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Progreso stories</div><div class="metadata-value">' + (totalSt ? (doneSt + '/' + totalSt + ' (' + pctSt + '%)') : '—') + '</div></div>';
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Creado</div><div class="metadata-value">' + esc((f.created_at && f.created_at.slice) ? f.created_at.slice(0, 10) : (f.created_at || "—")) + '</div></div>';
        bodyHtml += '</section>';
        bodyHtml += '<section class="viewer-section"><div class="viewer-section-title">Descripción</div><div id="feature-detail-description-vista">' + ((f.description && String(f.description).trim()) ? ('<p class="viewer-description-text">' + esc(f.description) + '</p>') : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>') + '</div></section>';
        bodyHtml += '<section class="viewer-section"><div class="viewer-section-title">Criterios de aceptación</div><div id="feature-detail-criteria-vista">' + renderCriteriaListHtml(acceptanceBase) + '</div></section>';
        bodyHtml += '<section class="viewer-section"><div class="viewer-section-title">Criterios de implementación</div><div id="feature-detail-impl-vista">' + renderCriteriaListHtml(implementationBase) + '</div></section>';
        bodyHtml += '</div></div>';

        bodyHtml += '<div class="tab-pane fade" id="feature-detail-panel-edicion" role="tabpanel"><div class="entity-editor">';
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">General</div><label class="editor-label" for="feature-detail-title-edit">Título</label><input type="text" id="feature-detail-title-edit" class="form-control form-control-sm form-modern-input editor-title-input" value="' + esc(f.title || "") + '"></section>';
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Metadata</div><div class="metadata-grid">';
        bodyHtml += '<div><span class="editor-label">ID</span><div class="editor-meta-value">' + esc(featureDisplayId) + "</div></div>";
        bodyHtml += '<div>' + statusSelectHtml + "</div>";
        bodyHtml += '<div>' + prioritySelectHtml + "</div>";
        bodyHtml += '<div><span class="editor-label">Actualizado</span><div class="editor-meta-value">' + esc((f.updated_at && f.updated_at.slice) ? f.updated_at.slice(0, 10) : (f.updated_at || "—")) + "</div></div>";
        bodyHtml += "</div></section>";
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Descripción</div><textarea id="feature-detail-desc-edit" class="form-control form-control-sm form-modern-input description-editor" rows="3">' + esc(f.description || "") + "</textarea></section>";
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Criterios de aceptación</div><div id="feature-detail-criteria-list">';
        var nA = acceptanceBase.length || 1;
        for (var i = 0; i < nA; i++) bodyHtml += '<div class="feature-criterion-row criteria-item"><input type="text" class="form-control form-control-sm form-modern-input feature-detail-criteria-input" value="' + esc(acceptanceBase[i] || "") + '" placeholder="Criterio ' + (i + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm feature-criterion-remove criteria-remove-btn tooltip" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button></div>';
        bodyHtml += '</div><div class="d-flex flex-wrap gap-2 mt-2"><button type="button" id="feature-detail-criteria-add" class="btn btn-outline-secondary btn-sm btn-add tooltip" data-tooltip="Añadir criterio"><i data-lucide="plus"></i> Añadir criterio</button><button type="button" id="feature-detail-criteria-save" class="btn btn-nexus-primary btn-sm tooltip" data-tooltip="Guardar criterios"><i data-lucide="save"></i> Guardar criterios</button><span id="feature-detail-criteria-msg" class="nexus-text-sm text-muted"></span></div></section>';
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Criterios de implementación</div><div id="feature-detail-impl-list">';
        var nI = implementationBase.length || 1;
        for (var j = 0; j < nI; j++) bodyHtml += '<div class="feature-impl-row criteria-item"><input type="text" class="form-control form-control-sm form-modern-input feature-detail-impl-input" value="' + esc(implementationBase[j] || "") + '" placeholder="Criterio ' + (j + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm feature-impl-remove criteria-remove-btn tooltip" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button></div>';
        bodyHtml += '</div><div class="d-flex flex-wrap gap-2 mt-2"><button type="button" id="feature-detail-impl-add" class="btn btn-outline-secondary btn-sm btn-add tooltip" data-tooltip="Añadir criterio"><i data-lucide="plus"></i> Añadir criterio</button><button type="button" id="feature-detail-impl-save" class="btn btn-nexus-primary btn-sm tooltip" data-tooltip="Guardar criterios"><i data-lucide="save"></i> Guardar criterios</button><span id="feature-detail-impl-msg" class="nexus-text-sm text-muted"></span></div></section>';
        bodyHtml += '</div></div>';
        bodyHtml += '<div class="tab-pane fade" id="feature-detail-panel-evidencia" role="tabpanel">';
        bodyHtml += '<div class="evidence-container" id="feature-detail-evidence-container" data-evidence-mode="split">';
        bodyHtml += '<div class="evidence-fullscreen-layout-controls mb-2">';
        bodyHtml += '<button type="button" data-evidence-layout="left" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Solo editor"><i data-lucide="pencil"></i> Editor</button>';
        bodyHtml += '<button type="button" data-evidence-layout="right" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Solo vista previa"><i data-lucide="eye"></i> Preview</button>';
        bodyHtml += '<button type="button" data-evidence-layout="split" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Vista dividida"><i data-lucide="columns"></i> Split</button>';
        bodyHtml += '<button type="button" class="btn btn-outline-secondary btn-sm btn-evidence-fullscreen-global ms-auto tooltip" aria-label="Ver en pantalla completa" data-tooltip="Pantalla completa"><i data-lucide="maximize"></i> Pantalla completa</button>';
        bodyHtml += "</div>";
        bodyHtml += '<div class="evidence-body evidence-split-layout" style="height:320px;">';
        bodyHtml += '<div class="evidence-col" id="feature-detail-evidence-left-col" data-evidence-role="left-col"><div class="evidence-panel"><div class="evidence-panel-header">Edición</div><div class="evidence-panel-body evidence-content"><textarea id="feature-detail-evidence-notes" class="form-control form-control-sm border-0 shadow-none p-0 m-0 bg-transparent" rows="6" placeholder="Notas de evidencia..." style="min-height:100%; height:100%; resize:none; overflow-y:auto;">' + esc(evidenceState.notes || "") + '</textarea></div></div></div>';
        bodyHtml += '<div class="split-resizer" data-evidence-role="resizer" aria-hidden="true"></div>';
        bodyHtml += '<div class="evidence-col" id="feature-detail-evidence-right-col" data-evidence-role="right-col"><div class="evidence-panel"><div class="evidence-panel-header">Visualización</div><div class="evidence-panel-body evidence-content"><div id="feature-detail-evidence-preview"></div></div></div></div>';
        bodyHtml += "</div></div></div>";
        bodyHtml += '<div class="mt-3 d-flex flex-wrap justify-content-start align-items-center gap-2" id="feature-detail-transfer-actions">';
        bodyHtml += '<button type="button" id="feature-detail-export" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Exportar evidencia"><i data-lucide="download"></i> Exportar</button>';
        bodyHtml += '<input type="file" id="feature-detail-import-input" class="d-none" accept=".json,application/json">';
        bodyHtml += '<button type="button" id="feature-detail-import" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Importar evidencia"><i data-lucide="upload"></i> Importar</button>';
        bodyHtml += "</div></div>";
        bodyHtml += '<div class="tab-pane fade" id="feature-detail-panel-backlog" role="tabpanel">';
        bodyHtml += '<h3 class="nexus-font-semibold nexus-text-primary mb-3">Backlog de la feature</h3>';
        bodyHtml += '<div class="d-flex flex-wrap align-items-center gap-2 mb-3"><button type="button" class="btn btn-nexus-primary btn-sm" id="feature-detail-backlog-create-story"><i data-lucide="plus"></i> Create Story</button></div>';
        bodyHtml += '<div id="feature-detail-backlog-container" class="table-responsive"><p class="nexus-text-sm text-muted">Seleccione la pestaña Backlog para cargar las stories.</p></div>';
        bodyHtml += "</div>";
        bodyHtml += "</div>";
        bodyHtml += '<div class="d-flex flex-wrap justify-content-end gap-2 mt-3 pt-3 border-top nexus-card-footer">';
        bodyHtml += '<button type="button" class="btn btn-secondary nexus-form-modal-cancel-btn tooltip" id="feature-detail-cancel" data-nexus-modal-id="featureDetailModal" data-tooltip="Cancelar"><i data-lucide="x"></i> Cancelar</button>';
        bodyHtml += '<button type="button" class="btn btn-nexus-primary tooltip" id="feature-detail-save-all" data-tooltip="Guardar"><i data-lucide="save"></i> Guardar</button>';
        bodyHtml += "</div>";
        bodyHtml += "</div>";

        var createdModal = null;
        window.openNexusFormModal({
          id: "featureDetailModal",
          title: "Detalle de la feature",
          bodyHtml: bodyHtml,
          mode: "edit",
          primaryButtonId: "feature-detail-save-all",
          primaryLabel: "Guardar",
          cancelButtonId: "feature-detail-cancel",
          modalDialogClass: "nexus-modal-story-detail",
          footerInsideBody: true,
          getDirtyState: getDirtyState,
          onSaveBeforeClose: doSaveAll
        }, function () { doSaveAll(); });

        createdModal = document.getElementById("featureDetailModal");
        if (createdModal) {
          createdModal.addEventListener("hidden.bs.modal", function () {
            // Aseguramos que no queden copias huérfanas del modal en el DOM
            var dup = document.querySelectorAll("#featureDetailModal");
            if (dup.length > 1) {
              for (var di = 1; di < dup.length; di++) {
                if (dup[di] && dup[di].parentNode) dup[di].parentNode.removeChild(dup[di]);
              }
            }
          });
        }

        bindRemoveButtons();
        var btnAddA = document.getElementById("feature-detail-criteria-add");
        if (btnAddA) btnAddA.onclick = function () {
          var list = document.getElementById("feature-detail-criteria-list");
          var n = list.querySelectorAll(".feature-criterion-row").length + 1;
          var row = document.createElement("div");
          row.className = "feature-criterion-row criteria-item";
          row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input feature-detail-criteria-input" placeholder="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm feature-criterion-remove criteria-remove-btn tooltip" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
          list.appendChild(row);
          if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
          bindRemoveButtons();
        };
        var btnAddI = document.getElementById("feature-detail-impl-add");
        if (btnAddI) btnAddI.onclick = function () {
          var list = document.getElementById("feature-detail-impl-list");
          var n = list.querySelectorAll(".feature-impl-row").length + 1;
          var row = document.createElement("div");
          row.className = "feature-impl-row criteria-item";
          row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input feature-detail-impl-input" placeholder="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm feature-impl-remove criteria-remove-btn tooltip" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
          list.appendChild(row);
          if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
          bindRemoveButtons();
        };
        var btnSaveA = document.getElementById("feature-detail-criteria-save");
        if (btnSaveA) btnSaveA.onclick = function () { saveCriteriaOnly(); var m = document.getElementById("feature-detail-criteria-msg"); if (m) m.textContent = "Guardado"; };
        var btnSaveI = document.getElementById("feature-detail-impl-save");
        if (btnSaveI) btnSaveI.onclick = function () { saveCriteriaOnly(); var m = document.getElementById("feature-detail-impl-msg"); if (m) m.textContent = "Guardado"; };
        var btnExport = document.getElementById("feature-detail-export");
        if (btnExport) btnExport.onclick = function () {
          var payload = {
            feature: {
              id: f.id,
              title: (document.getElementById("feature-detail-title-edit") && document.getElementById("feature-detail-title-edit").value) || "",
              description: (document.getElementById("feature-detail-desc-edit") && document.getElementById("feature-detail-desc-edit").value) || "",
              status: (document.getElementById("feature-detail-status-edit") && document.getElementById("feature-detail-status-edit").value) || statusBase,
              priority: (document.getElementById("feature-detail-priority-edit") && document.getElementById("feature-detail-priority-edit").value) || priorityBase,
              evidence: getCurrentEvidenceData(),
              acceptance_criteria: getLines(".feature-detail-criteria-input"),
              implementation_criteria: getLines(".feature-detail-impl-input")
            },
            exported_at: new Date().toISOString()
          };
          var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "feature-" + featureDisplayId + "-config.json";
          a.click();
          URL.revokeObjectURL(a.href);
        };
        var importInput = document.getElementById("feature-detail-import-input");
        var btnImport = document.getElementById("feature-detail-import");
        if (btnImport && importInput) btnImport.onclick = function () { importInput.click(); };
        if (importInput) importInput.onchange = function () {
          var file = importInput.files && importInput.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            try {
              var data = JSON.parse(reader.result);
              var featureData = (data && data.feature && typeof data.feature === "object") ? data.feature : data;
              var stEl = document.getElementById("feature-detail-status-edit");
              var priorityEl = document.getElementById("feature-detail-priority-edit");
              var titleEl = document.getElementById("feature-detail-title-edit");
              var descEl = document.getElementById("feature-detail-desc-edit");
              if (featureData.evidence) evidenceState = normalizeEvidencePayload(featureData.evidence);
              if (stEl && featureData.status) stEl.value = featureData.status;
              if (priorityEl && featureData.priority) priorityEl.value = featureData.priority;
              if (titleEl && featureData.title !== undefined) titleEl.value = featureData.title || "";
              if (descEl && featureData.description !== undefined) descEl.value = featureData.description || "";
              var notesEl = document.getElementById("feature-detail-evidence-notes");
              if (notesEl) notesEl.value = evidenceState.notes || "";
              var listA = document.getElementById("feature-detail-criteria-list");
              if (listA && Array.isArray(featureData.acceptance_criteria)) {
                listA.innerHTML = "";
                (featureData.acceptance_criteria.length ? featureData.acceptance_criteria : [""]).forEach(function (val, idx) {
                  var row = document.createElement("div");
                  row.className = "feature-criterion-row criteria-item";
                  row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input feature-detail-criteria-input" value="' + esc(String(val || "")) + '" placeholder="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm feature-criterion-remove criteria-remove-btn tooltip" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
                  listA.appendChild(row);
                });
              }
              var listI = document.getElementById("feature-detail-impl-list");
              if (listI && Array.isArray(featureData.implementation_criteria)) {
                listI.innerHTML = "";
                (featureData.implementation_criteria.length ? featureData.implementation_criteria : [""]).forEach(function (val, idx) {
                  var row = document.createElement("div");
                  row.className = "feature-impl-row criteria-item";
                  row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input feature-detail-impl-input" value="' + esc(String(val || "")) + '" placeholder="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm feature-impl-remove criteria-remove-btn tooltip" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
                  listI.appendChild(row);
                });
              }
              if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
              bindRemoveButtons();
              bindEvidenceEvents();
              refreshViewFromEdit();
              renderEvidencePane();
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Configuración de la feature importada correctamente.");
            } catch (e) {
              window.openNexusAlertModal({ title: "Error", message: "El archivo no es un JSON válido." });
            }
            importInput.value = "";
          };
          reader.readAsText(file);
        };
        function syncFeatureTransferActionsVisibility() {
          var group = document.getElementById("feature-detail-transfer-actions");
          var tabEd = document.getElementById("feature-detail-tab-edicion");
          if (!group || !tabEd) return;
          group.classList.toggle("d-none", !tabEd.classList.contains("active"));
        }
        function loadFeatureBacklog(featureId) {
          var container = document.getElementById("feature-detail-backlog-container");
          if (!container) return;
          container.innerHTML = "<p class=\"nexus-text-sm text-muted\">Cargando...</p>";
          window.fetchApi("/features/" + featureId + "/stories?page=1&limit=100").then(function (r) {
            if (!r || !r.success || !r.data) {
              container.innerHTML = "<p class=\"nexus-text-sm text-danger\">Error al cargar el backlog.</p>";
              return;
            }
            var items = r.data.items || r.data || [];
            if (items.length === 0) {
              container.innerHTML = "<p class=\"nexus-text-sm text-muted\">No hay user stories en esta feature.</p>";
              return;
            }
            var table = "<table class=\"table table-sm nexus-table\"><thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Prioridad</th><th>Sprint</th><th>Responsable</th><th></th></tr></thead><tbody>";
            items.forEach(function (st) {
              var displayId = "US-" + (st.number != null ? st.number : (st.id ? String(st.id).slice(0, 8) : ""));
              var title = (st.title || "").slice(0, 60);
              var status = st.status || "—";
              var priority = st.priority || "—";
              var sprintName = (st.sprint && st.sprint.name) ? st.sprint.name : (st.sprint_id ? "—" : "Sin asignar");
              var assignee = (st.assignee && (st.assignee.name || st.assignee.email)) ? (st.assignee.name || st.assignee.email) : "—";
              var storyIdAttr = st.id ? esc(st.id) : "";
              table += "<tr><td>" + esc(displayId) + "</td><td>" + (st.id ? "<a href=\"#\" class=\"feature-backlog-story-link\" data-story-id=\"" + storyIdAttr + "\">" + esc(title) + "</a>" : esc(title)) + "</td><td><span class=\"" + (typeof window.nexusBadgeClass === "function" ? window.nexusBadgeClass(st.status) : "") + "\">" + esc(status) + "</span></td><td>" + esc(priority) + "</td><td>" + esc(sprintName) + "</td><td>" + esc(assignee) + "</td><td><a href=\"#\" class=\"btn btn-outline-secondary btn-sm feature-backlog-story-link\" data-story-id=\"" + storyIdAttr + "\">Ver</a></td></tr>";
            });
            table += "</tbody></table>";
            container.innerHTML = table;
            if (!container.dataset.storyClickBound) {
              container.dataset.storyClickBound = "1";
              container.addEventListener("click", function (e) {
                var a = e.target && e.target.closest ? e.target.closest("a.feature-backlog-story-link") : null;
                if (!a) return;
                e.preventDefault();
                var storyId = (a.getAttribute("data-story-id") || "").trim();
                if (!storyId) return;
                if (window.targetStackManager) {
                  window.targetStackManager.openTarget("story", storyId, { projectId: f.project_id || state.projectId || null, featureId: f.id });
                }
                if (typeof window.openStoryViewModal === "function") {
                  window.openStoryViewModal(storyId, { projectIdHint: f.project_id || state.projectId, onStoryUpdated: function () { loadFeatureBacklog(f.id); }, includeStoriesLink: false });
                } else if (typeof window._openStoryModalById === "function") {
                  window._openStoryModalById(storyId, function () { loadFeatureBacklog(f.id); });
                } else if (typeof window.openNexusAlertModal === "function") {
                  window.openNexusAlertModal({ title: "Story", message: "No hay componente disponible para abrir el detalle de la story." });
                }
              });
            }
            if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
          }).catch(function () {
            container.innerHTML = "<p class=\"nexus-text-sm text-danger\">Error al cargar el backlog.</p>";
          });
        }
        var tabVistaFeature = document.getElementById("feature-detail-tab-vista");
        var tabEdicionFeature = document.getElementById("feature-detail-tab-edicion");
        var tabEvidenciaFeature = document.getElementById("feature-detail-tab-evidencia");
        var tabBacklogFeature = document.getElementById("feature-detail-tab-backlog");
        if (tabVistaFeature) tabVistaFeature.addEventListener("shown.bs.tab", syncFeatureTransferActionsVisibility);
        if (tabEdicionFeature) tabEdicionFeature.addEventListener("shown.bs.tab", syncFeatureTransferActionsVisibility);
        if (tabEvidenciaFeature) tabEvidenciaFeature.addEventListener("shown.bs.tab", syncFeatureTransferActionsVisibility);
        if (tabBacklogFeature) tabBacklogFeature.addEventListener("shown.bs.tab", function () { loadFeatureBacklog(f.id); });
        syncFeatureTransferActionsVisibility();
        var btnCreateStory = document.getElementById("feature-detail-backlog-create-story");
        if (btnCreateStory) btnCreateStory.onclick = function () {
          var projectIdForSprints = f.project_id || state.projectId || "";
          var usersPromise = window.fetchApi("/users?limit=50");
          var sprintsPromise = projectIdForSprints ? window.fetchApi("/projects/" + projectIdForSprints + "/sprints?limit=50") : Promise.resolve(null);
          Promise.all([usersPromise, sprintsPromise]).then(function (results) {
            var raw = (results[0] && results[0].success && results[0].data) ? results[0].data : null;
            var users = Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : (raw && raw.items) ? raw.items : [];
            var rawSprints = (results[1] && results[1].success && results[1].data) ? results[1].data : null;
            var sprintList = Array.isArray(rawSprints) ? rawSprints : (rawSprints && rawSprints.data) ? rawSprints.data : (rawSprints && rawSprints.items) ? rawSprints.items : [];
            var bodyHtml = "<div class=\"mb-3\"><label class=\"form-label\">Título de la story</label><input type=\"text\" id=\"feature-backlog-story-title\" class=\"form-control\" placeholder=\"Título\" required></div>";
            bodyHtml += "<div class=\"mb-3\"><label class=\"form-label\">Descripción</label><textarea id=\"feature-backlog-story-desc\" class=\"form-control\" rows=\"3\" placeholder=\"Descripción\" required></textarea></div>";
            bodyHtml += "<div class=\"mb-3\"><label class=\"form-label\">Prioridad</label><select id=\"feature-backlog-story-priority\" class=\"form-select\"><option value=\"MEDIUM\" selected>Media</option><option value=\"LOW\">Baja</option><option value=\"HIGH\">Alta</option><option value=\"CRITICAL\">Crítica</option></select></div>";
            bodyHtml += "<div class=\"mb-3\"><label class=\"form-label\">Story points</label><select id=\"feature-backlog-story-points\" class=\"form-select\"><option value=\"\">—</option><option value=\"1\">1</option><option value=\"2\">2</option><option value=\"3\">3</option><option value=\"5\">5</option><option value=\"8\">8</option><option value=\"13\">13</option><option value=\"21\">21</option></select></div>";
            bodyHtml += "<div class=\"mb-3\"><label class=\"form-label\">Asignado a</label><select id=\"feature-backlog-story-assigned\" class=\"form-select\"><option value=\"\">Nadie</option>";
            users.forEach(function (u) { bodyHtml += "<option value=\"" + esc(u.id || "") + "\">" + esc((u.name && u.name.trim()) ? u.name.trim() : (u.email || u.id)) + "</option>"; });
            bodyHtml += "</select></div>";
            bodyHtml += "<div class=\"mb-3\"><label class=\"form-label\">Sprint</label><select id=\"feature-backlog-story-sprint\" class=\"form-select\"><option value=\"\">Ninguno</option>";
            sprintList.forEach(function (sp) { bodyHtml += "<option value=\"" + esc(sp.id || "") + "\">" + esc(sp.name || sp.id || "") + "</option>"; });
            bodyHtml += "</select></div>";
            bodyHtml += "<div id=\"feature-backlog-story-error\" class=\"alert alert-danger d-none\"></div>";
            function doCreate() {
              var title = (document.getElementById("feature-backlog-story-title") && document.getElementById("feature-backlog-story-title").value || "").trim();
              var desc = (document.getElementById("feature-backlog-story-desc") && document.getElementById("feature-backlog-story-desc").value || "").trim();
              var priority = (document.getElementById("feature-backlog-story-priority") && document.getElementById("feature-backlog-story-priority").value) || "MEDIUM";
              var pointsEl = document.getElementById("feature-backlog-story-points");
              var story_points = (pointsEl && pointsEl.value) ? parseInt(pointsEl.value, 10) : null;
              var assignedEl = document.getElementById("feature-backlog-story-assigned");
              var sprintEl = document.getElementById("feature-backlog-story-sprint");
              var assigned_to = (assignedEl && assignedEl.value) ? assignedEl.value : null;
              var sprint_id = (sprintEl && sprintEl.value) ? sprintEl.value : null;
              var errEl = document.getElementById("feature-backlog-story-error");
              if (errEl) { errEl.classList.add("d-none"); errEl.textContent = ""; }
              if (!title) { if (errEl) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); } return Promise.resolve(false); }
              if (!desc) { if (errEl) { errEl.textContent = "La descripción es obligatoria."; errEl.classList.remove("d-none"); } return Promise.resolve(false); }
              var payload = { title: title, description: desc, priority: priority };
              if (assigned_to) payload.assigned_to = assigned_to;
              if (sprint_id) payload.sprint_id = sprint_id;
              if (story_points != null && !isNaN(story_points)) payload.story_points = story_points;
              return window.fetchApi("/features/" + f.id + "/stories", { method: "POST", body: JSON.stringify(payload) }).then(function (res) {
                if (res && res.success) {
                  if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Story creada correctamente.");
                  loadFeatureBacklog(f.id);
                  return true;
                }
                if (errEl) { errEl.textContent = (res && res.error && res.error.message) || "Error al crear la story."; errEl.classList.remove("d-none"); }
                return false;
              });
            }
            window.openNexusFormModal({
              id: "featureBacklogNewStoryModal",
              title: "Create Story",
              bodyHtml: bodyHtml,
              mode: "create",
              primaryButtonId: "feature-backlog-story-submit",
              primaryLabel: "Crear",
              getDirtyState: function () { var t = (document.getElementById("feature-backlog-story-title") && document.getElementById("feature-backlog-story-title").value || "").trim(); var d = (document.getElementById("feature-backlog-story-desc") && document.getElementById("feature-backlog-story-desc").value || "").trim(); return t.length > 0 || d.length > 0; },
              onSaveBeforeClose: doCreate
            }, function (bsModal) { doCreate().then(function (ok) { if (ok && bsModal) bsModal.hide(); }); });
            if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
          }).catch(function () {
            window.openNexusAlertModal({ title: "Error", message: "No se pudo cargar usuarios o sprints." });
          });
        };
        var featureModalEl = document.getElementById("featureDetailModal");
        if (featureModalEl && typeof window.bindEvidenceLayout === "function") window.bindEvidenceLayout(featureModalEl);
        bindEvidenceEvents();
        renderEvidencePane();
      });
    }

    function bindFeatures() {
      var perPageEl = document.getElementById("feat-per-page");
      if (perPageEl) perPageEl.onchange = function () { state.limit = parseInt(perPageEl.value, 10) || 10; state.page = 1; loadFeatures(); };
      var projectSearchInput = document.getElementById("feat-search-project");
      if (projectSearchInput) {
        projectSearchInput.value = state.projectSearch || "";
        projectSearchInput.onclick = function (e) { e.stopPropagation(); };
        projectSearchInput.oninput = function () {
          state.projectSearch = (projectSearchInput.value || "").trim();
          var term = state.projectSearch.toLowerCase();
          document.querySelectorAll("#content .feat-project-match").forEach(function (el) {
            if ((el.getAttribute("data-project-id") || "") === "") { el.style.display = ""; return; }
            var name = (el.getAttribute("data-project-name") || "").toLowerCase();
            el.style.display = !term || name.indexOf(term) !== -1 ? "" : "none";
          });
        };
      }
      document.querySelectorAll("#content .feat-project-match").forEach(function (el) {
        el.onclick = function (e) {
          e.preventDefault();
          state.projectId = el.getAttribute("data-project-id") || "";
          if (projectSearchInput) projectSearchInput.value = "";
          state.projectSearch = "";
          document.querySelectorAll("#content .feat-project-match").forEach(function (x) { x.classList.remove("active"); });
          el.classList.add("active");
          var projectBtn = document.getElementById("feat-project-filter-btn");
          if (projectBtn && window.bootstrap && window.bootstrap.Dropdown) {
            var inst = window.bootstrap.Dropdown.getInstance(projectBtn);
            if (inst) inst.hide();
          }
          state.page = 1;
          currentItems = [];
          if (syncProjectHashWithState()) return;
          loadFeatures();
        };
      });
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
        var projectBtn = document.getElementById("feat-project-filter-btn");
        var tituloBtn = document.getElementById("feat-titulo-filter-btn");
        var statusBtn = document.getElementById("feat-status-filter-btn");
        if (projectBtn) { try { var pi = window.bootstrap.Dropdown.getInstance(projectBtn); if (pi) pi.dispose(); new window.bootstrap.Dropdown(projectBtn, { popperConfig: popperFixed }); } catch (err) {} }
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
      document.querySelectorAll("#content .feat-view-link").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var featureId = a.getAttribute("data-feature-id");
          if (!featureId) return;
          if (window.targetStackManager) {
            window.targetStackManager.openTarget("feature", featureId, { projectId: state.projectId || null });
          }
          if (typeof window.openFeatureDetailTarget === "function") {
            window.openFeatureDetailTarget(featureId, { projectId: state.projectId || null });
          } else {
            openFeatureDetailModal(featureId);
          }
        };
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
      var btnExport = document.getElementById("feat-btn-export");
      var btnImport = document.getElementById("feat-btn-import");
      var importInput = document.getElementById("feat-import-input");
      if (btnExport) btnExport.onclick = function () {
        if (!state.projectId) {
          window.openNexusAlertModal({ title: "Exportar features", message: "Seleccione un proyecto." });
          return;
        }
        fetchAllProjectFeatures(state.projectId).then(function (features) {
          var payload = {
            project_id: state.projectId,
            project_name: getProjectName(state.projectId),
            exported_at: new Date().toISOString(),
            features: (features || []).map(function (f) {
              var crit = loadFeatureCriteria(f.id);
              return {
                title: f.title || "",
                description: f.description || "",
                priority: f.priority || "MEDIUM",
                status: f.status || "DRAFT",
                acceptance_criteria: crit.acceptance || [],
                implementation_criteria: crit.implementation || []
              };
            })
          };
          var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "features-" + (state.projectId || "project") + ".json";
          a.click();
          URL.revokeObjectURL(a.href);
        });
      };
      if (btnImport && importInput) btnImport.onclick = function () {
        if (!state.projectId) {
          window.openNexusAlertModal({ title: "Importar features", message: "Seleccione un proyecto." });
          return;
        }
        importInput.click();
      };
      if (importInput) importInput.onchange = function () {
        var file = importInput.files && importInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var parsed;
          try {
            parsed = JSON.parse(reader.result);
          } catch (e) {
            window.openNexusAlertModal({ title: "Importar features", message: "El archivo no es un JSON válido." });
            importInput.value = "";
            return;
          }
          var list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.features) ? parsed.features : null);
          if (!list) {
            window.openNexusAlertModal({ title: "Importar features", message: "Formato inválido. Debe contener un array de features." });
            importInput.value = "";
            return;
          }
          if (list.length === 0) {
            window.openNexusAlertModal({ title: "Importar features", message: "El archivo no contiene features para importar." });
            importInput.value = "";
            return;
          }
          var created = 0;
          var failed = 0;
          var chain = Promise.resolve();
          list.forEach(function (item) {
            chain = chain.then(function () {
              var title = (item && item.title ? String(item.title) : "").trim();
              var description = (item && item.description ? String(item.description) : "").trim();
              var priority = (item && item.priority ? String(item.priority) : "MEDIUM").toUpperCase();
              var status = (item && item.status ? String(item.status) : "DRAFT").toUpperCase();
              if (!title || !description) { failed += 1; return; }
              return window.fetchApi("/projects/" + state.projectId + "/features", {
                method: "POST",
                body: JSON.stringify({ title: title, description: description, priority: priority })
              }).then(function (r) {
                if (!(r && r.success && r.data && r.data.id)) { failed += 1; return; }
                created += 1;
                var acceptance = item && Array.isArray(item.acceptance_criteria) ? item.acceptance_criteria : [];
                var implementation = item && Array.isArray(item.implementation_criteria) ? item.implementation_criteria : [];
                if (acceptance.length || implementation.length) {
                  saveFeatureCriteria(r.data.id, acceptance, implementation);
                }
                if (status && status !== "DRAFT") {
                  return window.fetchApi("/features/" + r.data.id + "/status", {
                    method: "PATCH",
                    body: JSON.stringify({ status: status })
                  });
                }
              }).catch(function () { failed += 1; });
            });
          });
          chain.then(function () {
            if (created > 0 && typeof window.showSuccessMessage === "function") {
              window.showSuccessMessage("Importación completada: " + created + " feature(s) creadas.");
            }
            if (failed > 0) {
              window.openNexusAlertModal({ title: "Importar features", message: "Algunas features no se pudieron importar (" + failed + ")." });
            }
            loadFeatures();
          });
          importInput.value = "";
        };
        reader.readAsText(file);
      };
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
        function doCreate() {
          var title = (document.getElementById("feat-form-title").value || "").trim();
          var desc = (document.getElementById("feat-form-desc").value || "").trim();
          var priorityEl = document.getElementById("feat-form-priority");
          var priority = (priorityEl && priorityEl.value) ? priorityEl.value : "MEDIUM";
          var errEl = document.getElementById("feat-form-error");
          errEl.classList.add("d-none");
          if (!title) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); return Promise.resolve(false); }
          if (!desc) { errEl.textContent = "La descripción es obligatoria."; errEl.classList.remove("d-none"); return Promise.resolve(false); }
          return window.fetchApi("/projects/" + state.projectId + "/features", { method: "POST", body: JSON.stringify({ title: title, description: desc, priority: priority }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Feature creada correctamente."); loadFeatures(); return true; }
            errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); return false;
          });
        }
        window.openNexusFormModal({
          id: "featNewModal", title: "Nueva feature", bodyHtml: bodyHtml, mode: "create",
          primaryButtonId: "feat-form-submit", primaryLabel: "Crear",
          getDirtyState: function () { var t = (document.getElementById("feat-form-title").value || "").trim(); var d = (document.getElementById("feat-form-desc").value || "").trim(); return t.length > 0 || d.length > 0; },
          onSaveBeforeClose: doCreate
        }, function (bsModal) { doCreate().then(function (ok) { if (ok) bsModal.hide(); }); });
      };
    }

    function openFeatureDetailTarget(featureId, meta) {
      if (!featureId) return;
      if (window.targetStackManager) {
        var projectId = meta && meta.projectId ? meta.projectId : (meta && meta.project_id) ? meta.project_id : null;
        window.targetStackManager.openTarget("feature", featureId, { projectId: projectId });
      }
      openFeatureDetailModal(featureId);
    }
    window.openFeatureDetailTarget = openFeatureDetailTarget;

    state.projectId = projectParam;
    var featureMatch = window.location.hash.match(/[?&]feature=([^&]+)/);
    var featureIdFromHash = featureMatch ? decodeURIComponent(featureMatch[1].replace(/\+/g, " ")) : "";
    if (window.targetStackManager) {
      var base = [{ entity_type: "view", entity_id: "features", meta: { projectId: state.projectId || null } }];
      if (featureIdFromHash) {
        base.push({ entity_type: "feature", entity_id: featureIdFromHash, meta: { projectId: state.projectId || null } });
      }
      window.targetStackManager.reset(base);
    }
    if (state.projectId) loadFeatures();
    else {
      window.setContent(renderList(null, null, ""));
      bindFeatures();
    }
    if (featureIdFromHash) {
      setTimeout(function () {
        openFeatureDetailModal(featureIdFromHash);
      }, 150);
    }
  });
})();
