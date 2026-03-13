/**
 * Incidentes — GET /projects/:id/incidents (list), GET /incidents/:id (detalle), PATCH /incidents/:id, PATCH /incidents/:id/status.
 */
(function () {
  window.registerView("incidents", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var incidentId = segs[1];
    if (incidentId) {
      function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }
      async function loadIncidentDetail(iid) {
        window.setContent(window.showLoading());
        var body = await window.fetchApi("/incidents/" + iid);
        if (!body || !body.success || !body.data) {
          window.setContent(window.showError(body && body.error && body.error.message || "Incidente no encontrado."));
          return;
        }
        var inc = body.data;
        var projectName = "Proyecto";
        if (inc.project_id) {
          try {
            var projRes = await window.fetchApi("/projects/" + inc.project_id);
            if (projRes && projRes.success && projRes.data && projRes.data.name) projectName = projRes.data.name;
          } catch (err) {}
        }
        var breadcrumbs = [
          { label: "Panel", href: "#/dashboard" },
          { label: "Proyectos", href: "#/projects" },
          { label: projectName, href: "#/projects/" + (inc.project_id || "") },
          { label: "Incidentes", href: "#/incidents?project=" + encodeURIComponent(inc.project_id || "") },
          { label: inc.title || "Incidente", href: "" }
        ];
        var html = window.renderBreadcrumbs(breadcrumbs);
        html += '<div class="nexus-card nexus-section-spacing">';
        html += "<h1 class=\"nexus-page-title\">" + esc(inc.title || "Incidente") + "</h1>";
        html += "<p class=\"nexus-text-secondary\">Estado: <span class=\"" + (window.nexusBadgeClass ? window.nexusBadgeClass(inc.status) : "") + "\">" + esc(inc.status || "") + "</span> · Severidad: <span class=\"" + (window.nexusBadgeClass ? window.nexusBadgeClass(inc.severity) : "") + "\">" + esc(inc.severity || "") + "</span></p>";
        html += "<p class=\"nexus-text-sm\">Creado: " + (inc.created_at ? inc.created_at.slice(0, 19).replace("T", " ") : "—") + (inc.closed_at ? " · Cerrado: " + inc.closed_at.slice(0, 19).replace("T", " ") : "") + "</p>";
        if (inc.description) html += "<p class=\"nexus-text-secondary\">" + esc(inc.description) + "</p>";
        html += "<p class=\"nexus-text-sm\">Reportado por: " + esc(inc.reported_by || "—") + " · Asignado a: " + esc(inc.assigned_to || "—") + "</p>";
        if (inc.story_id) html += "<p class=\"nexus-text-sm\">Story relacionada: <a href=\"#/stories?story=" + encodeURIComponent(inc.story_id) + "\">Ver story</a></p>";
        if (inc.root_cause_analysis) html += "<p class=\"nexus-text-sm\"><strong>Causa raíz:</strong> " + esc(inc.root_cause_analysis) + "</p>";
        html += '<div class="mt-3"><label class="form-label nexus-text-sm">Estado</label><select id="inc-detail-status" class="form-select form-select-sm nexus-input" style="max-width:200px" aria-label="Estado">';
        ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].forEach(function (st) { html += "<option value=\"" + st + "\"" + (inc.status === st ? " selected" : "") + ">" + st + "</option>"; });
        html += "</select> <button type=\"button\" class=\"btn btn-nexus-primary btn-sm ms-2\" id=\"inc-detail-status-btn\">Aplicar estado</button></div>";
        html += '<div class="mt-3"><label class="form-label nexus-text-sm">Asignado a</label><select id="inc-detail-assigned" class="form-select form-select-sm nexus-input" style="max-width:280px" aria-label="Asignado a">';
        html += '<option value="">— Sin asignar —</option>';
        var usersRes = await window.fetchApi("/users");
        var users = (usersRes && usersRes.success && usersRes.data && usersRes.data.items) ? usersRes.data.items : [];
        users.forEach(function (u) { html += "<option value=\"" + (u.id || "") + "\"" + (inc.assigned_to === u.id ? " selected" : "") + ">" + esc(u.email || u.name || u.id) + "</option>"; });
        html += "</select></div>";
        html += '<div class="mt-3"><label class="form-label nexus-text-sm">Causa raíz (análisis)</label><textarea id="inc-detail-rootcause" class="form-control form-control-sm" rows="3" placeholder="Opcional; obligatorio para cerrar">' + esc(inc.root_cause_analysis || "") + "</textarea></div>";
        html += '<div id="inc-detail-error" class="alert alert-danger d-none mt-3"></div>';
        html += '<button type="button" class="btn btn-nexus-primary btn-sm mt-3 me-2" id="inc-detail-save">Guardar cambios</button>';
        html += ' <a href="#/incidents?project=' + encodeURIComponent(inc.project_id || "") + '" class="btn btn-nexus-secondary btn-sm mt-3" aria-label="Volver al listado de incidentes">Volver</a>';
        html += "</div>";
        window.setContent(html);
        var statusBtn = document.getElementById("inc-detail-status-btn");
        if (statusBtn) statusBtn.onclick = function () {
          var sel = document.getElementById("inc-detail-status");
          var rootEl = document.getElementById("inc-detail-rootcause");
          var errEl = document.getElementById("inc-detail-error");
          var nextStatus = sel && sel.value ? sel.value : inc.status;
          var payload = { status: nextStatus };
          if (nextStatus === "CLOSED" && rootEl) payload.root_cause_analysis = (rootEl.value || "").trim() || null;
          errEl.classList.add("d-none");
          window.fetchApi("/incidents/" + inc.id + "/status", { method: "PATCH", body: JSON.stringify(payload) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado correctamente."); loadIncidentDetail(inc.id); }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error al cambiar estado."; errEl.classList.remove("d-none"); }
          });
        };
        var saveBtn = document.getElementById("inc-detail-save");
        if (saveBtn) saveBtn.onclick = function () {
          var assignedEl = document.getElementById("inc-detail-assigned");
          var rootEl = document.getElementById("inc-detail-rootcause");
          var errEl = document.getElementById("inc-detail-error");
          var assignedTo = assignedEl && assignedEl.value ? assignedEl.value : null;
          var rootCause = rootEl && rootEl.value ? (rootEl.value || "").trim() : null;
          errEl.classList.add("d-none");
          window.fetchApi("/incidents/" + inc.id, { method: "PATCH", body: JSON.stringify({ assigned_to: assignedTo || null, root_cause_analysis: rootCause }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Cambios guardados correctamente."); loadIncidentDetail(inc.id); }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error al guardar."; errEl.classList.remove("d-none"); }
          });
        };
      }
      loadIncidentDetail(incidentId);
      return;
    }
    window.setContent(window.showLoading());
    var r = await window.fetchApi("/projects");
    var projects = r && r.success && r.data && r.data.items ? r.data.items : [];
    var state = { projectId: "", page: 1, limit: 10, status: "", search: "", sort: "title", dir: "asc" };
    var match = window.location.hash.match(/[?&]project=([^&]+)/);
    if (match) state.projectId = decodeURIComponent(match[1]);
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["title", "description"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }
    function renderList(items, meta) {
      var breadcrumbs = state.projectId
        ? [{ label: "Panel", href: "#/dashboard" }, { label: "Proyectos", href: "#/projects" }, { label: getProjectName(state.projectId), href: "#/projects/" + state.projectId }, { label: "Incidentes", href: "" }]
        : [{ label: "Panel", href: "#/dashboard" }, { label: "Incidentes", href: "" }];
      var html = window.renderBreadcrumbs(breadcrumbs);
      html += '<h1 class="nexus-page-title">Incidentes</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<label class="form-label nexus-text-sm">Proyecto</label><select id="incsel" class="form-select form-select-sm mb-3 nexus-input" style="max-width:320px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option>';
      projects.forEach(function (p) { html += "<option value=\"" + p.id + "\">" + esc(p.name || p.id) + "</option>"; });
      html += "</select>";
      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver los incidentes.</p></div>';
        html += "</div>";
        return html;
      }
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      html += (typeof window.renderPageSizeSelector === "function" ? window.renderPageSizeSelector({ selectId: "inc-per-page", currentLimit: state.limit, options: [10, 25, 50] }) : "");
      html += '<input type="search" id="inc-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por estado</span> <select id="inc-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="RESOLVED">RESOLVED</option><option value="CLOSED">CLOSED</option></select></label>';
      html += '<a href="#" id="incbtn" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo incidente</a></div>';
      html += '<div id="inclist">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay incidentes") + "</p><p class=\"nexus-text-secondary\">Cree un incidente o ajuste los filtros.</p></div>";
      } else {
        html += window.renderNexusTable({
          columns: [
            { label: "Título", sortKey: "title" },
            { label: "Severidad" },
            { label: "Estado", sortKey: "status" },
            { label: "Fecha de creación" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (x) {
            var created = (x.created_at && x.created_at.slice) ? x.created_at.slice(0, 10) : (x.created_at || "—");
            return [
              esc(x.title || x.id),
              "<span class=\"" + window.nexusBadgeClass(x.severity) + "\">" + esc(x.severity || "") + "</span>",
              "<span class=\"" + window.nexusBadgeClass(x.status) + "\">" + esc(x.status || "") + "</span>",
              created,
              window.renderTableActions({ view: { href: "#/incidents/" + (x.id || ""), label: "Ver", ariaLabel: "Ver incidente " + (x.title || x.id || "").slice(0, 40) } })
            ];
          }
        });
        if (meta && meta.totalPages > 1) html += '<div id="inc-pagination" class="mt-2"></div>';
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
      window.fetchApi("/projects/" + state.projectId + "/incidents" + buildQuery()).then(function (b) {
        if (b && b.success && b.data) {
          var data = b.data;
          var raw = data.items || data.data || [];
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var total = data.total != null ? data.total : raw.length;
          var limit = data.limit != null ? data.limit : state.limit;
          var totalPages = state.search ? 1 : (data.totalPages != null ? data.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
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
      if (state.search) currentMeta = { page: 1, limit: currentMeta.limit, total: toShow.length, totalPages: toShow.length ? 1 : 0 };
      window.setContent(renderList(toShow, currentMeta));
      bind();
    }

    function bind() {
      var perPageEl = document.getElementById("inc-per-page");
      if (perPageEl) perPageEl.onchange = function () { state.limit = parseInt(perPageEl.value, 10) || 10; state.page = 1; load(); };
      var sel = document.getElementById("incsel");
      if (sel) {
        sel.value = state.projectId;
        sel.onchange = function () { state.projectId = sel.value; state.page = 1; load(); };
      }
      var st = document.getElementById("inc-status");
      var search = document.getElementById("inc-search");
      if (st) { st.value = state.status; st.onchange = function () { state.status = st.value; state.page = 1; load(); }; }
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; load(); }, 300); };
      }
      var pagEl = document.getElementById("inc-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var btn = document.getElementById("incbtn");
      if (btn) btn.onclick = function (e) {
        e.preventDefault();
        if (!state.projectId) {
          window.openNexusAlertModal({ title: "Nuevo incidente", message: "Seleccione un proyecto." });
          return;
        }
        var bodyHtml = '<div class="mb-3"><label class="form-label">Título</label><input type="text" id="inc-form-title" class="form-control" placeholder="Título" required></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="inc-form-desc" class="form-control" rows="3" placeholder="Descripción del incidente (opcional)" aria-label="Descripción"></textarea></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Severidad</label><select id="inc-form-severity" class="form-select" aria-label="Severidad"><option value="LOW">LOW</option><option value="MEDIUM" selected>MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></select></div>';
        bodyHtml += '<div id="inc-form-error" class="alert alert-danger d-none"></div>';
        window.openNexusFormModal({ id: "incNewModal", title: "Nuevo incidente", bodyHtml: bodyHtml, primaryButtonId: "inc-form-submit", primaryLabel: "Crear" }, function (bsModal) {
          var t = (document.getElementById("inc-form-title").value || "").trim();
          var descEl = document.getElementById("inc-form-desc");
          var description = (descEl && descEl.value) ? descEl.value.trim() : "";
          var sevEl = document.getElementById("inc-form-severity");
          var severity = (sevEl && sevEl.value) ? sevEl.value : "MEDIUM";
          var errEl = document.getElementById("inc-form-error");
          errEl.classList.add("d-none");
          if (!t) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); return; }
          window.fetchApi("/projects/" + state.projectId + "/incidents", { method: "POST", body: JSON.stringify({ title: t, description: description, severity: severity }) }).then(function (b) {
            if (b && b.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Incidente creado correctamente."); bsModal.hide(); load(); }
            else { errEl.textContent = (b && b.error && b.error.message) || "Error."; errEl.classList.remove("d-none"); }
          });
        });
      };
    }

    load();
  });
})();
