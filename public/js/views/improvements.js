/**
 * Mejoras — GET /improvements (list), POST /improvements, GET /improvements/:id (detalle), PATCH /improvements/:id/status.
 */
(function () {
  var STATUSES = ["DRAFT", "PROPOSED", "APPROVED", "REJECTED", "IMPLEMENTED"];

  window.registerView("improvements", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var improvementId = segs[1];
    if (improvementId) {
      function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }
      async function loadImprovementDetail(iid) {
        window.setContent(window.showLoading());
        var body = await window.fetchApi("/improvements/" + iid);
        if (!body || !body.success || !body.data) {
          window.setContent(window.showError(body && body.error && body.error.message || "Mejora no encontrada."));
          return;
        }
        var imp = body.data;
        var breadcrumbs = [{ label: "Panel", href: "#/dashboard" }, { label: "Mejoras", href: "#/improvements" }, { label: imp.title || "Mejora", href: "" }];
        var html = window.renderBreadcrumbs(breadcrumbs);
        html += '<div class="nexus-card nexus-section-spacing">';
        html += "<h1 class=\"nexus-page-title\">" + esc(imp.title || "Mejora") + "</h1>";
        html += "<p class=\"nexus-text-secondary\">Estado: <span class=\"" + (window.nexusBadgeClass ? window.nexusBadgeClass(imp.status) : "") + "\">" + esc(imp.status || "") + "</span></p>";
        html += "<p class=\"nexus-text-sm\">Creado: " + (imp.created_at ? imp.created_at.slice(0, 19).replace("T", " ") : "—") + "</p>";
        if (imp.description) html += "<p class=\"nexus-text-secondary\">" + esc(imp.description) + "</p>";
        html += '<div class="mt-3"><label class="form-label nexus-text-sm">Estado</label><select id="imp-detail-status" class="form-select form-select-sm nexus-input" style="max-width:200px" aria-label="Estado">';
        STATUSES.forEach(function (st) { html += "<option value=\"" + st + "\"" + (imp.status === st ? " selected" : "") + ">" + st + "</option>"; });
        html += "</select> <button type=\"button\" class=\"btn btn-nexus-primary btn-sm ms-2\" id=\"imp-detail-status-btn\">Aplicar estado</button></div>";
        html += '<div id="imp-detail-error" class="alert alert-danger d-none mt-3"></div>';
        html += ' <a href="#/improvements" class="btn btn-nexus-secondary btn-sm mt-3">Volver</a>';
        html += "</div>";
        window.setContent(html);
        var statusBtn = document.getElementById("imp-detail-status-btn");
        var errEl = document.getElementById("imp-detail-error");
        if (statusBtn) statusBtn.onclick = function () {
          var sel = document.getElementById("imp-detail-status");
          var nextStatus = sel && sel.value ? sel.value : imp.status;
          errEl.classList.add("d-none");
          window.fetchApi("/improvements/" + imp.id + "/status", { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado correctamente."); loadImprovementDetail(imp.id); }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error al cambiar estado."; errEl.classList.remove("d-none"); }
          });
        };
      }
      loadImprovementDetail(improvementId);
      return;
    }

    window.setContent(window.showLoading());
    var state = { page: 1, limit: 10, status: "", sort: "created_at", dir: "desc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      return q;
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Mejoras", href: "" }]);
      html += '<h1 class="nexus-page-title">Mejoras</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      html += (typeof window.renderPageSizeSelector === "function" ? window.renderPageSizeSelector({ selectId: "imp-per-page", currentLimit: state.limit, options: [10, 25, 50] }) : "");
      html += '<label class="mb-0"><span class="nexus-text-sm">Estado</span> <select id="imp-status" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option>';
      STATUSES.forEach(function (s) { html += "<option value=\"" + s + "\">" + s + "</option>"; });
      html += "</select></label>";
      html += '<a href="#" id="imp-btn-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nueva mejora</a></div>';
      html += '<div id="implist">';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">No hay mejoras</p><p class="nexus-text-secondary">Cree una mejora o ajuste el filtro de estado.</p></div>';
      } else {
        html += window.renderNexusTable({
          columns: [{ label: "Título", sortKey: "title" }, { label: "Estado", sortKey: "status" }, { label: "Creado" }, { label: "Acciones" }],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (x) {
            var created = (x.created_at && x.created_at.slice) ? x.created_at.slice(0, 10) : (x.created_at || "—");
            return [
              esc(x.title || x.id),
              "<span class=\"" + (window.nexusBadgeClass ? window.nexusBadgeClass(x.status) : "") + "\">" + esc(x.status || "") + "</span>",
              created,
              window.renderTableActions({ view: { href: "#/improvements/" + (x.id || ""), label: "Ver", ariaLabel: "Ver mejora " + (x.title || x.id || "").slice(0, 40) } })
            ];
          }
        });
        if (meta && meta.totalPages > 1) html += '<div id="imp-pagination" class="mt-2"></div>';
      }
      html += "</div></div>";
      return html;
    }

    function load() {
      window.setContent(window.showLoading());
      window.fetchApi("/improvements" + buildQuery()).then(function (b) {
        if (b && b.success && b.data) {
          var data = b.data;
          var raw = data.data || data.items || (Array.isArray(data) ? data : []);
          currentItems = raw;
          var meta = data.meta || {};
          currentMeta = { page: meta.page || state.page, limit: meta.limit || state.limit, total: meta.total != null ? meta.total : raw.length, totalPages: meta.totalPages != null ? meta.totalPages : 1 };
          window.setContent(renderList(raw, currentMeta));
          bind();
        } else {
          window.setContent(window.showError(b && b.error && b.error.message));
        }
      });
    }

    function bind() {
      var perPageEl = document.getElementById("imp-per-page");
      if (perPageEl) perPageEl.onchange = function () { state.limit = parseInt(perPageEl.value, 10) || 10; state.page = 1; load(); };
      var statusEl = document.getElementById("imp-status");
      if (statusEl) { statusEl.value = state.status; statusEl.onchange = function () { state.status = statusEl.value; state.page = 1; load(); }; }
      var pagEl = document.getElementById("imp-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
        });
      }
      var btnNew = document.getElementById("imp-btn-new");
      if (btnNew) btnNew.onclick = function (e) {
        e.preventDefault();
        var bodyHtml = '<div class="mb-3"><label class="form-label">Título</label><input type="text" id="imp-form-title" class="form-control" placeholder="Título" required></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="imp-form-desc" class="form-control" rows="2" placeholder="Descripción"></textarea></div>';
        bodyHtml += '<div id="imp-form-error" class="alert alert-danger d-none"></div>';
        window.openNexusFormModal({ id: "impNewModal", title: "Nueva mejora", bodyHtml: bodyHtml, primaryButtonId: "imp-form-submit", primaryLabel: "Crear" }, function (bsModal) {
          var title = (document.getElementById("imp-form-title") && document.getElementById("imp-form-title").value || "").trim();
          var desc = (document.getElementById("imp-form-desc") && document.getElementById("imp-form-desc").value || "").trim();
          var errEl = document.getElementById("imp-form-error");
          errEl.classList.add("d-none");
          if (!title) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); return; }
          window.fetchApi("/improvements", { method: "POST", body: JSON.stringify({ title: title, description: desc || null }) }).then(function (r) {
            if (r && r.success && r.data && r.data.id) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Mejora creada correctamente."); bsModal.hide(); window.location.hash = "#/improvements/" + r.data.id; }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
          });
        });
      };
    }

    load();
  });
})();
