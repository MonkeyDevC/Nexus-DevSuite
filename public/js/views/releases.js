/**
 * Releases — GET /releases (page, limit, status), GET /releases/:id, POST (MASTER). Tabla ordenable, filtros, búsqueda, paginación, badges, carga, empty state.
 */
(function () {
  window.registerView("releases", async function () {
    await window.showNav();
    const segs = window.getHashSegments();
    const releaseId = segs[1];
    const user = await window.getMe();
    const isMaster = typeof window.nexusCanAccessMasterActions === "function" ? window.nexusCanAccessMasterActions(user) : (user && user.role === "MASTER");

    if (releaseId) {
      window.setContent(window.showLoading());
      const body = await window.fetchApi("/releases/" + releaseId);
      if (body && body.success && body.data) {
        const r = body.data;
        function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }
        var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Releases", href: "#/releases" }, { label: r.version || r.id, href: "" }]);
        html += '<div class="nexus-panel nexus-section-spacing"><h1 class="nexus-page-title">Release ' + esc(r.version || r.id) + "</h1>";
        var releaseStatuses = ["PLANNED", "IN_PROGRESS", "QA", "RELEASED", "ARCHIVED"];
        var statusSelectHtml = '<label class="nexus-text-sm text-muted">Estado</label><select id="release-detail-status" class="form-select form-select-sm mt-1" style="max-width:160px" aria-label="Estado">';
        releaseStatuses.forEach(function (st) {
          statusSelectHtml += '<option value="' + esc(st) + '"' + (r.status === st ? ' selected' : '') + '>' + esc(st) + '</option>';
        });
        statusSelectHtml += '</select>';
        html += '<div class="mb-3">' + statusSelectHtml + '</div>';
        html += '<div id="release-detail-desc-view" class="mb-3"><p class="nexus-text-secondary mb-0">' + esc(r.description || "") + '</p></div>';
        html += '<div id="release-detail-desc-edit" class="d-none mb-3"><label class="form-label nexus-text-sm">Descripción</label><textarea id="release-detail-desc" class="form-control form-control-sm" rows="3" aria-label="Descripción">' + esc(r.description || "") + '</textarea><button type="button" class="btn btn-nexus-primary btn-sm mt-2" id="release-detail-save-desc">Guardar descripción</button> <button type="button" class="btn btn-nexus-secondary btn-sm mt-2" id="release-detail-cancel-desc">Cancelar</button></div>';
        if (isMaster) html += '<div class="mb-3"><button type="button" class="btn btn-nexus-secondary btn-sm me-2" id="release-detail-btn-edit-desc">Editar descripción</button><button type="button" class="btn btn-nexus-primary btn-sm" id="release-detail-btn-hotfix">Crear hotfix</button></div>';
        html += '<h3 class="nexus-font-semibold mt-3">Features del release</h3>';
        var feats = r.features || [];
        html += '<div class="mb-2"><select id="release-detail-project" class="form-select form-select-sm d-inline-block" style="max-width:260px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option></select> <select id="release-detail-feature" class="form-select form-select-sm d-inline-block ms-2" style="max-width:260px" aria-label="Feature"><option value="">Seleccionar feature</option></select> <button type="button" class="btn btn-nexus-primary btn-sm ms-2" id="release-detail-assign-feature">Asignar feature</button></div>';
        html += '<ul class="list-unstyled" id="release-detail-features-list">';
        feats.forEach(function (f) {
          var href = (f.id) ? "#/features/" + f.id : "#/features?project=" + (f.project_id || "");
          html += "<li><a href=\"" + href + "\" class=\"release-feature-link\" data-feature-id=\"" + esc(f.id || "") + "\" data-project-id=\"" + esc(f.project_id || "") + "\">" + esc(f.title || f.id) + "</a></li>";
        });
        html += '</ul>';
        if (feats.length === 0) html += '<p class="nexus-text-sm text-muted">No hay features asignadas.</p>';
        html += '<a href="#/releases" class="btn btn-nexus-secondary btn-sm mt-3" aria-label="Volver al listado de releases">Volver</a></div>';
        window.setContent(html);
        var statusEl = document.getElementById("release-detail-status");
        if (statusEl) statusEl.onchange = function () {
          var val = (statusEl.value || "").trim();
          if (!val) return;
          window.fetchApi("/releases/" + releaseId + "/status", { method: "PATCH", body: JSON.stringify({ status: val }) }).then(function (res) {
            if (res && res.success) { statusEl.value = val; }
            else window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "Error al cambiar estado." });
          });
        };
        var btnEditDesc = document.getElementById("release-detail-btn-edit-desc");
        var descView = document.getElementById("release-detail-desc-view");
        var descEdit = document.getElementById("release-detail-desc-edit");
        var descArea = document.getElementById("release-detail-desc");
        var btnSaveDesc = document.getElementById("release-detail-save-desc");
        var btnCancelDesc = document.getElementById("release-detail-cancel-desc");
        if (btnEditDesc && descView && descEdit) btnEditDesc.onclick = function () { descView.classList.add("d-none"); descEdit.classList.remove("d-none"); if (descArea) descArea.value = (r.description || ""); };
        if (btnCancelDesc && descView && descEdit) btnCancelDesc.onclick = function () { descEdit.classList.add("d-none"); descView.classList.remove("d-none"); };
        if (btnSaveDesc && descArea) btnSaveDesc.onclick = function () {
          var desc = (descArea.value || "").trim();
          window.fetchApi("/releases/" + releaseId, { method: "PATCH", body: JSON.stringify({ description: desc }) }).then(function (res) {
            if (res && res.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Descripción guardada correctamente."); r.description = desc; descView.querySelector("p").textContent = desc || ""; descEdit.classList.add("d-none"); descView.classList.remove("d-none"); }
            else window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "Error al guardar." });
          });
        };
        var btnHotfix = document.getElementById("release-detail-btn-hotfix");
        if (btnHotfix) btnHotfix.onclick = function () {
          btnHotfix.disabled = true;
          window.fetchApi("/releases/" + releaseId + "/hotfix", { method: "POST", body: JSON.stringify({}) }).then(function (res) {
            btnHotfix.disabled = false;
            if (res && res.success && res.data && res.data.id) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Hotfix creado correctamente."); window.location.hash = "#/releases/" + res.data.id; window.dispatchEvent(new HashChangeEvent("hashchange")); }
            else window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "Solo se puede crear hotfix desde una release en estado RELEASED." });
          });
        };
        var projSel = document.getElementById("release-detail-project");
        var featSel = document.getElementById("release-detail-feature");
        var btnAssignFeat = document.getElementById("release-detail-assign-feature");
        var featuresListEl = document.getElementById("release-detail-features-list");
        function formatProjectListLabel(project) {
          if (!project) return "—";
          var pid = (project.number != null && project.number !== "") ? ("P" + String(project.number)) : ((project.id || "").slice(0, 8) || "—");
          var name = (project.name && String(project.name).trim()) ? String(project.name).trim() : (project.id || "—");
          return pid + " - " + name;
        }
        window.fetchApi("/projects").then(function (projRes) {
          var projList = (projRes && projRes.success && projRes.data && projRes.data.items) ? projRes.data.items : [];
          if (!projSel) return;
          projList.forEach(function (p) { var opt = document.createElement("option"); opt.value = p.id; opt.textContent = formatProjectListLabel(p); projSel.appendChild(opt); });
          projSel.onchange = function () {
            featSel.innerHTML = '<option value="">Seleccionar feature</option>';
            var pid = projSel.value;
            if (!pid) return;
            window.fetchApi("/projects/" + pid + "/features?limit=100").then(function (featRes) {
              var items = (featRes && featRes.success && featRes.data) ? (featRes.data.items || featRes.data.data || featRes.data) : [];
              if (!Array.isArray(items)) items = [];
              items.forEach(function (f) { var opt = document.createElement("option"); opt.value = f.id; opt.textContent = (f.title || f.id || "").slice(0, 60); featSel.appendChild(opt); });
            });
          };
        });
        if (btnAssignFeat && featSel) btnAssignFeat.onclick = function () {
          var fid = featSel.value;
          if (!fid) { window.openNexusAlertModal({ title: "Asignar feature", message: "Seleccione una feature." }); return; }
          btnAssignFeat.disabled = true;
          window.fetchApi("/releases/" + releaseId + "/features/" + fid, { method: "POST", body: JSON.stringify({}) }).then(function (res) {
            btnAssignFeat.disabled = false;
              if (res && res.success) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Feature asociada correctamente.");
              var li = document.createElement("li");
              var projId = projSel && projSel.value ? projSel.value : "";
              var label = (featSel.options[featSel.selectedIndex] && featSel.options[featSel.selectedIndex].textContent) || fid;
              if (projId) {
                li.innerHTML = '<a href="#/features?project=' + projId + '" class="release-feature-link" data-feature-id="' + esc(fid) + '" data-project-id="' + esc(projId) + '">' + esc(label) + '</a>';
              } else {
                li.textContent = esc(label);
              }
              if (featuresListEl) featuresListEl.appendChild(li);
              featSel.value = "";
            } else window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "Error al asignar feature." });
          });
        };
        var root = document.getElementById("content");
        if (root) {
          root.addEventListener("click", function (e) {
            var a = e.target && e.target.closest ? e.target.closest("a.release-feature-link") : null;
            if (!a) return;
            e.preventDefault();
            var fid = a.getAttribute("data-feature-id") || "";
            var pid = a.getAttribute("data-project-id") || "";
            if (!fid) return;
            if (window.targetStackManager) {
              window.targetStackManager.openTarget("feature", fid, { projectId: pid || null });
            }
            if (typeof window.openFeatureDetailTarget === "function") {
              window.openFeatureDetailTarget(fid, { projectId: pid || null });
            } else {
              var href = a.getAttribute("href") || "#/features";
              window.location.hash = href;
            }
          });
        }
      } else {
        window.setContent(window.showError(body && body.error && body.error.message));
      }
      return;
    }

    var state = { page: 1, limit: 10, status: "", search: "", sort: "version", dir: "asc", selectionMode: false, selectedIds: [] };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["version", "description"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Releases", href: "" }]);
      html += '<h1 class="nexus-page-title">Releases</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="releases-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="releases-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="PLANNED">PLANNED</option><option value="RELEASED">RELEASED</option><option value="ARCHIVED">ARCHIVED</option></select></label>';
      var perPageOpts = [10, 25, 50, 100];
      html += '<label class="mb-0"><span class="nexus-text-sm">Ver por página</span> <select id="releases-per-page" class="form-select form-select-sm d-inline-block" style="width:auto" aria-label="Releases por página">';
      perPageOpts.forEach(function (n) { html += '<option value="' + n + '"' + (state.limit === n ? ' selected' : '') + '>' + n + '</option>'; });
      html += '</select></label>';
      if (isMaster) {
        html += '<div class="d-flex align-items-center gap-2 ms-auto">';
        if (state.selectionMode) {
          html += '<span class="nexus-text-sm text-muted" id="releases-selection-count">' + (state.selectedIds.length ? state.selectedIds.length + " seleccionado(s)" : "Seleccione releases") + "</span>";
          html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="releases-btn-cancel-selection">Cancelar selección</button>';
          html += '<button type="button" class="btn btn-outline-danger btn-sm" id="releases-btn-bulk-delete-confirm" ' + (state.selectedIds.length === 0 ? " disabled" : "") + ">Eliminación múltiple</button>";
        } else {
          html += '<button type="button" class="btn btn-outline-danger btn-sm" id="releases-btn-bulk-delete">Eliminación múltiple</button>';
          html += '<a href="#" id="releases-btn-new" class="btn btn-nexus-primary btn-sm">+ Nuevo release</a>';
        }
        html += "</div>";
      }
      html += "</div>";
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay releases") + "</p><p class=\"nexus-text-secondary\">Cree un release o ajuste los filtros.</p></div>";
      } else {
        var allChecked = items.length > 0 && items.every(function (r) { return state.selectedIds.indexOf(r.id) !== -1; });
        html += window.renderNexusTable({
          columns: [
            { label: "Versión", sortKey: "version" },
            { label: "Estado", sortKey: "status" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          selectionColumn: state.selectionMode && isMaster ? {
            headerCheckboxId: "releases-select-all",
            rowCheckboxClass: "release-row-checkbox",
            getRowId: function (r) { return r.id; },
            getRowLabel: function (r) { return r.version || r.id; },
            selectedIds: state.selectedIds,
            allChecked: allChecked
          } : null,
          rowRenderer: function (r) {
            return [
              '<a href="#/releases/' + r.id + '">' + esc(r.version || r.id) + "</a>",
              "<span class=\"" + window.nexusBadgeClass(r.status) + "\">" + esc(r.status || "") + "</span>",
              window.renderTableActions({
                view: { href: "#/releases/" + r.id, ariaLabel: "Ver release " + (r.version || r.id || "").slice(0, 40) },
                delete: isMaster ? { id: r.id, className: "btn-delete-release" } : null
              })
            ];
          }
        });
        if (meta && meta.totalPages > 1) html += '<div id="releases-pagination" class="mt-2"></div>';
      }
      html += "</div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function confirmBulkDeleteReleases(ids, onSuccess) {
      var x = ids.length;
      window.openNexusConfirmModal({
        title: "Eliminación múltiple",
        message: "¿Desea eliminar " + x + " release(s) y desasociar sus features?",
        primaryLabel: "Eliminar",
        primaryDanger: true
      }, function (closeModal, showError) {
        window.fetchApi("/releases/bulk-delete", { method: "POST", body: JSON.stringify({ ids: ids }) }).then(function (r) {
          if (r && r.success) {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Releases eliminados correctamente.");
            closeModal();
            state.selectionMode = false;
            state.selectedIds = [];
            if (typeof onSuccess === "function") onSuccess();
            else runList();
          } else {
            showError((r && r.error && r.error.message) || "Error al eliminar los releases.");
          }
        });
      });
    }

    function runList() {
      window.setContent(window.showLoading());
      window.fetchApi("/releases" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var raw = data.items || (Array.isArray(data) ? data : []);
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var total = data.total != null ? data.total : raw.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages = state.search ? 1 : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
          if (toShow.length === 0 && state.page > 1) {
            state.page = state.page - 1;
            runList();
            return;
          }
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
      var st = document.getElementById("releases-status");
      var search = document.getElementById("releases-search");
      var perPage = document.getElementById("releases-per-page");
      if (st) { st.value = state.status; st.onchange = function () { state.status = st.value; state.page = 1; runList(); }; }
      if (perPage) { perPage.value = state.limit; perPage.onchange = function () { state.limit = parseInt(perPage.value, 10) || 10; state.page = 1; runList(); }; }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; runList(); }, 300); };
      }
      var pagEl = document.getElementById("releases-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; runList(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; runList(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btnBulkDelete = document.getElementById("releases-btn-bulk-delete");
      if (btnBulkDelete) btnBulkDelete.onclick = function () {
        state.selectionMode = true;
        state.selectedIds = [];
        refreshFromCurrent();
      };
      var btnCancelSelection = document.getElementById("releases-btn-cancel-selection");
      if (btnCancelSelection) btnCancelSelection.onclick = function () {
        state.selectionMode = false;
        state.selectedIds = [];
        refreshFromCurrent();
      };
      var btnBulkDeleteConfirm = document.getElementById("releases-btn-bulk-delete-confirm");
      if (btnBulkDeleteConfirm) btnBulkDeleteConfirm.onclick = function () {
        if (state.selectedIds.length === 0) {
          window.openNexusAlertModal({ title: "Eliminación múltiple", message: "Seleccione al menos un release." });
          return;
        }
        confirmBulkDeleteReleases(state.selectedIds.slice(), runList);
      };
      var selectAll = document.getElementById("releases-select-all");
      if (selectAll) selectAll.onclick = function () {
        var toShow = getDisplayItems(currentItems);
        var visibleIds = toShow.map(function (r) { return r.id; });
        if (selectAll.checked) {
          visibleIds.forEach(function (id) { if (state.selectedIds.indexOf(id) === -1) state.selectedIds.push(id); });
        } else {
          state.selectedIds = state.selectedIds.filter(function (id) { return visibleIds.indexOf(id) === -1; });
        }
        refreshFromCurrent();
      };
      document.querySelectorAll("#content .release-row-checkbox").forEach(function (cb) {
        cb.onclick = function () {
          var id = cb.getAttribute("data-id");
          var idx = state.selectedIds.indexOf(id);
          if (idx === -1) state.selectedIds.push(id);
          else state.selectedIds.splice(idx, 1);
          refreshFromCurrent();
        };
      });
      document.querySelectorAll("#content .btn-delete-release").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var id = a.getAttribute("data-id");
          window.openNexusConfirmModal({
            title: "Eliminar release",
            message: "¿Está seguro de eliminar este release? Las features quedarán desasociadas.",
            primaryLabel: "Eliminar",
            primaryDanger: true
          }, function (closeModal, showError) {
            window.fetchApi("/releases/" + id, { method: "DELETE" }).then(function (r) {
              if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Release eliminado correctamente."); closeModal(); runList(); }
              else showError((r && r.error && r.error.message) || "Error al eliminar.");
            });
          });
        };
      });
      var btnNew = document.getElementById("releases-btn-new");
      if (btnNew) btnNew.onclick = function (e) {
        e.preventDefault();
        var bodyHtml = '<div class="mb-3"><label class="form-label">Versión (ej. 1.0.0)</label><input type="text" id="rel-form-version" class="form-control" placeholder="1.0.0" required></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="rel-form-desc" class="form-control" rows="2" placeholder="Descripción"></textarea></div><div id="rel-form-error" class="alert alert-danger d-none"></div>';
        function doCreate() {
          var version = (document.getElementById("rel-form-version").value || "").trim();
          var desc = (document.getElementById("rel-form-desc").value || "").trim();
          var errEl = document.getElementById("rel-form-error");
          errEl.classList.add("d-none");
          if (!version) { errEl.textContent = "La versión es obligatoria."; errEl.classList.remove("d-none"); return Promise.resolve(false); }
          return window.fetchApi("/releases", { method: "POST", body: JSON.stringify({ version: version, description: desc }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Release creado correctamente."); runList(); return true; }
            errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); return false;
          });
        }
        window.openNexusFormModal({
          id: "relNewModal", title: "Nuevo release", bodyHtml: bodyHtml, mode: "create",
          primaryButtonId: "rel-form-submit", primaryLabel: "Crear",
          getDirtyState: function () { var v = (document.getElementById("rel-form-version").value || "").trim(); var d = (document.getElementById("rel-form-desc").value || "").trim(); return v.length > 0 || d.length > 0; },
          onSaveBeforeClose: doCreate
        }, function (bsModal) { doCreate().then(function (ok) { if (ok) bsModal.hide(); }); });
      };
    }

    runList();
  });
})();
