/**
 * Documentos — GET /documents (page, limit), GET /documents/:id. Tabla ordenable, búsqueda, paginación, carga, empty state.
 * Listado devuelve data.data y data.meta (total, page, limit, totalPages).
 */
(function () {
  window.registerView("documents", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var docId = segs[1];
    if (docId) {
      window.setContent(window.showLoading());
      var body = await window.fetchApi("/documents/" + docId);
      if (!body || !body.success || !body.data) {
        window.setContent(window.showError(body && body.error && body.error.message));
        return;
      }
      var d = body.data;
      var versRes = await window.fetchApi("/documents/" + docId + "/versions");
      var vers = [];
      if (versRes && versRes.success && versRes.data) {
        var vData = versRes.data;
        vers = vData.data || vData.items || (Array.isArray(vData) ? vData : []);
      }
      var user = await window.getMe();
      var isMaster = typeof window.nexusCanAccessMasterActions === "function" ? window.nexusCanAccessMasterActions(user) : (user && user.role === "MASTER");
      function esc(x) { if (x == null) return ""; var el = document.createElement("div"); el.textContent = x; return el.innerHTML; }
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Documentos", href: "#/documents" }, { label: d.title || d.code, href: "" }]);
      html += '<div class="nexus-panel nexus-section-spacing"><h1 class="nexus-page-title">' + esc(d.title || d.code) + "</h1><p class=\"nexus-text-secondary\">Código: " + esc(d.code) + "</p><p>" + esc(d.description || "") + "</p>";
      if (d.feature_id) html += "<p class=\"nexus-text-sm\">Feature relacionada: <a href=\"#/features/" + encodeURIComponent(d.feature_id) + "\">Ver feature</a></p>";
      if (d.story_id) html += "<p class=\"nexus-text-sm\">Story relacionada: <a href=\"#/stories?story=" + encodeURIComponent(d.story_id) + "\">Ver story</a></p>";
      html += "<h3 class=\"nexus-font-semibold mt-3\">Versiones</h3>";
      html += '<div class="mb-2"><button type="button" class="btn btn-nexus-primary btn-sm" id="doc-new-version">Nueva versión</button></div>';
      html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr><th>Versión</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
      if (vers.length === 0) {
        html += "<tr><td colspan=\"3\" class=\"text-muted text-center py-3\">No hay versiones. Cree la primera con \"Nueva versión\".</td></tr>";
      } else {
        vers.forEach(function (v) {
          html += "<tr><td>" + (v.version_number != null ? v.version_number : v.id) + "</td><td><span class=\"" + window.nexusBadgeClass(v.status) + "\">" + esc(v.status || "") + "</span></td><td>";
          html += '<button type="button" class="btn btn-link btn-sm p-0 doc-view-content" data-version-id="' + esc(v.id) + '" data-version-status="' + esc(v.status || "") + '">Ver contenido</button> ';
          if (isMaster && v.status === "DRAFT") html += '<button type="button" class="btn btn-link btn-sm p-0 doc-approve" data-version-id="' + esc(v.id) + '">Aprobar</button> ';
          if (isMaster) html += '<button type="button" class="btn btn-link btn-sm p-0 doc-archive" data-version-id="' + esc(v.id) + '">Archivar</button>';
          html += "</td></tr>";
        });
      }
      html += "</tbody></table></div>";
      html += '<a href="#/documents" class="btn btn-nexus-secondary btn-sm mt-3">Volver</a></div>';
      window.setContent(html);
      function reloadDetail() { window.location.hash = "#/documents/" + docId; window.dispatchEvent(new HashChangeEvent("hashchange")); }
      document.querySelectorAll("#content .doc-approve").forEach(function (btn) {
        btn.onclick = function () {
          var vid = btn.getAttribute("data-version-id");
          if (!vid) return;
          window.fetchApi("/documents/" + docId + "/versions/" + vid + "/status", { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Versión aprobada correctamente."); reloadDetail(); }
            else window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al aprobar." });
          });
        };
      });
      document.querySelectorAll("#content .doc-archive").forEach(function (btn) {
        btn.onclick = function () {
          var vid = btn.getAttribute("data-version-id");
          if (!vid) return;
          window.fetchApi("/documents/" + docId + "/versions/" + vid + "/status", { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Versión archivada correctamente."); reloadDetail(); }
            else window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al archivar." });
          });
        };
      });
      document.querySelectorAll("#content .doc-view-content").forEach(function (btn) {
        btn.onclick = function () {
          var vid = btn.getAttribute("data-version-id");
          var vStatus = (btn.getAttribute("data-version-status") || "").toUpperCase();
          if (!vid) return;
          window.fetchApi("/documents/" + docId + "/versions/" + vid).then(function (r) {
            if (!r || !r.success || !r.data) {
              window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "No se pudo cargar la versión." });
              return;
            }
            var version = r.data;
            var content = (version.content != null ? version.content : "").toString();
            var canEdit = isMaster && vStatus === "DRAFT";
            var bodyHtml = '<div class="mb-3"><label class="form-label">Contenido</label>';
            if (canEdit) {
              bodyHtml += '<textarea id="doc-version-content-field" class="form-control font-monospace" rows="12" placeholder="Contenido" aria-label="Contenido">' + esc(content) + '</textarea>';
              bodyHtml += '</div><div id="doc-version-content-error" class="alert alert-danger d-none"></div>';
            } else {
              bodyHtml += '<pre id="doc-version-content-readonly" class="border rounded p-3 bg-light text-start" style="max-height:320px;overflow:auto;white-space:pre-wrap;word-break:break-word">' + esc(content || "(vacío)") + '</pre></div>';
            }
            var primaryLabel = canEdit ? "Guardar" : "Cerrar";
            var primaryId = canEdit ? "doc-version-content-save" : "doc-version-content-close";
            window.openNexusFormModal({ id: "docVersionContentModal", title: "Contenido de la versión", bodyHtml: bodyHtml, primaryButtonId: primaryId, primaryLabel: primaryLabel }, function (bsModal) {
              if (canEdit) {
                var errEl = document.getElementById("doc-version-content-error");
                var textarea = document.getElementById("doc-version-content-field");
                var newContent = textarea ? textarea.value : "";
                if (errEl) errEl.classList.add("d-none");
                window.fetchApi("/documents/" + docId + "/versions/" + vid, { method: "PATCH", body: JSON.stringify({ content: newContent }) }).then(function (res) {
                  if (res && res.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Contenido guardado correctamente."); bsModal.hide(); reloadDetail(); }
                  else {
                    if (errEl) { errEl.textContent = (res && res.error && res.error.message) || "Error al guardar."; errEl.classList.remove("d-none"); }
                  }
                });
              } else {
                bsModal.hide();
              }
            });
          }).catch(function () {
            window.openNexusAlertModal({ title: "Error", message: "No se pudo cargar la versión." });
          });
        };
      });
      var btnNewVer = document.getElementById("doc-new-version");
      if (btnNewVer) btnNewVer.onclick = function () {
        var bodyHtml = '<div class="mb-3"><label class="form-label">Motivo del cambio (opcional)</label><input type="text" id="doc-ver-change-reason" class="form-control" placeholder="Motivo del cambio" aria-label="Motivo"></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label">Contenido (opcional)</label><textarea id="doc-ver-content" class="form-control" rows="4" placeholder="Contenido" aria-label="Contenido"></textarea></div><div id="doc-ver-error" class="alert alert-danger d-none"></div>';
        window.openNexusFormModal({ id: "docNewVersionModal", title: "Nueva versión", bodyHtml: bodyHtml, primaryButtonId: "doc-ver-submit", primaryLabel: "Crear" }, function (bsModal) {
          var errEl = document.getElementById("doc-ver-error");
          errEl.classList.add("d-none");
          var changeReason = (document.getElementById("doc-ver-change-reason") && document.getElementById("doc-ver-change-reason").value || "").trim();
          var content = (document.getElementById("doc-ver-content") && document.getElementById("doc-ver-content").value || "").trim();
          window.fetchApi("/documents/" + docId + "/versions", { method: "POST", body: JSON.stringify({ change_reason: changeReason || undefined, content: content || undefined }) }).then(function (r) {
            if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Versión creada correctamente."); bsModal.hide(); reloadDetail(); }
            else { errEl.textContent = (r && r.error && r.error.message) || "Error al crear versión."; errEl.classList.remove("d-none"); }
          });
        });
      };
      return;
    }

    var state = { page: 1, limit: 10, search: "", sort: "title", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];

    function buildQuery() {
      return "?page=" + state.page + "&limit=" + state.limit;
    }
    function getDisplayItems(raw) {
      var f = window.filterBySearch(raw || [], ["title", "code", "description"], state.search);
      return window.sortArray(f, state.sort, state.dir);
    }

    function esc(s) { if (s == null) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function renderList(items, meta) {
      var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Documentos", href: "" }]);
      html += '<h1 class="nexus-page-title">Documentos</h1><div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      html += (typeof window.renderPageSizeSelector === "function" ? window.renderPageSizeSelector({ selectId: "doc-per-page", currentLimit: state.limit, options: [10, 25, 50] }) : "");
      html += '<input type="search" id="doc-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      html += '<label class="mb-0 nexus-text-sm">Buscar por código</label>';
      html += '<input type="text" id="doc-code-search" class="form-control form-control-sm nexus-input" placeholder="Código exacto" style="max-width:180px" aria-label="Código del documento">';
      html += '<button type="button" class="btn btn-nexus-secondary btn-sm" id="doc-code-go">Ir</button>';
      html += '<span id="doc-code-msg" class="nexus-text-sm text-muted ms-1"></span>';
      html += '<a href="#" id="doc-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo documento</a></div>';
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' + (state.search ? "Sin resultados" : "No hay documentos") + "</p><p class=\"nexus-text-secondary\">Cree un documento o ajuste la búsqueda.</p></div>";
      } else {
        html += window.renderNexusTable({
          columns: [
            { label: "Código", sortKey: "code" },
            { label: "Título", sortKey: "title" },
            { label: "Última versión" },
            { label: "Estado" },
            { label: "Acciones" }
          ],
          items: items,
          sortState: { sort: state.sort, dir: state.dir },
          rowRenderer: function (d) {
            var lat = d.latest_version || d.versions ? (d.versions[0] ? d.versions[0].status : "—") : "—";
            var st = d.status || lat;
            return [
              esc(d.code || ""),
              '<a href="#/documents/' + d.id + '">' + esc(d.title || d.id) + "</a>",
              (typeof lat === "object" ? (lat.status || "—") : lat),
              "<span class=\"" + window.nexusBadgeClass(st) + "\">" + (typeof st === "string" ? st : "—") + "</span>",
              window.renderTableActions({ view: { href: "#/documents/" + d.id, ariaLabel: "Ver documento " + (d.title || d.code || d.id || "").slice(0, 40) } })
            ];
          }
        });
        if (meta && meta.totalPages > 1) html += '<div id="doc-pagination" class="mt-2"></div>';
      }
      html += "</div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshFromCurrent();
    }

    function load() {
      window.setContent(window.showLoading());
      window.fetchApi("/documents" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var raw = data.data || data.items || (Array.isArray(data) ? data : []);
          currentItems = raw;
          var toShow = getDisplayItems(raw);
          var meta = data.meta || {};
          var total = meta.total != null ? meta.total : raw.length;
          var limit = meta.limit != null ? meta.limit : state.limit;
          var totalPages = state.search ? 1 : (meta.totalPages != null ? meta.totalPages : (total === 0 ? 0 : Math.ceil(total / limit)));
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
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
      var perPageEl = document.getElementById("doc-per-page");
      if (perPageEl) perPageEl.onchange = function () { state.limit = parseInt(perPageEl.value, 10) || 10; state.page = 1; load(); };
      var search = document.getElementById("doc-search");
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.search = search.value; state.page = 1; load(); }, 300); };
      }
      var pagEl = document.getElementById("doc-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      var codeSearch = document.getElementById("doc-code-search");
      var codeGo = document.getElementById("doc-code-go");
      var codeMsg = document.getElementById("doc-code-msg");
      function doCodeSearch() {
        var code = (codeSearch && codeSearch.value || "").trim();
        if (codeMsg) codeMsg.textContent = "";
        if (!code) {
          if (codeMsg) codeMsg.textContent = "Introduzca un código.";
          return;
        }
        window.fetchApi("/documents/code/" + encodeURIComponent(code)).then(function (r) {
          if (r && r.success && r.data && r.data.id) {
            window.location.hash = "#/documents/" + r.data.id;
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          } else {
            if (codeMsg) codeMsg.textContent = "No se encontró ningún documento con ese código.";
          }
        }).catch(function () {
          if (codeMsg) codeMsg.textContent = "No se encontró ningún documento con ese código.";
        });
      }
      if (codeGo) codeGo.onclick = doCodeSearch;
      if (codeSearch) {
        codeSearch.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); doCodeSearch(); } };
      }
      var btn = document.getElementById("doc-new");
      if (btn) btn.onclick = function (e) {
        e.preventDefault();
        window.fetchApi("/projects").then(function (projRes) {
          var projects = (projRes && projRes.success && projRes.data && projRes.data.items) ? projRes.data.items : [];
          var bodyHtml = '<div class="mb-3"><label class="form-label">Código</label><input type="text" id="doc-form-code" class="form-control" placeholder="Código" required></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Título</label><input type="text" id="doc-form-title" class="form-control" placeholder="Título" required></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="doc-form-desc" class="form-control" rows="2" placeholder="Descripción (opcional)" aria-label="Descripción"></textarea></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label">Proyecto (opcional)</label><select id="doc-form-project" class="form-select" aria-label="Proyecto"><option value="">Sin proyecto</option>';
          projects.forEach(function (p) { bodyHtml += '<option value="' + (p.id || "") + '">' + (typeof window.esc === "function" ? window.esc(p.name || p.id || "") : String(p.name || p.id || "").replace(/</g, "&lt;")) + "</option>"; });
          bodyHtml += "</select></div><div id=\"doc-form-error\" class=\"alert alert-danger d-none\"></div>";
          window.openNexusFormModal({ id: "docNewModal", title: "Nuevo documento", bodyHtml: bodyHtml, primaryButtonId: "doc-form-submit", primaryLabel: "Crear" }, function (bsModal) {
            var code = (document.getElementById("doc-form-code").value || "").trim();
            var title = (document.getElementById("doc-form-title").value || "").trim();
            var descEl = document.getElementById("doc-form-desc");
            var description = (descEl && descEl.value) ? descEl.value.trim() : "";
            var projEl = document.getElementById("doc-form-project");
            var projectId = (projEl && projEl.value) ? projEl.value : "";
            var errEl = document.getElementById("doc-form-error");
            errEl.classList.add("d-none");
            if (!code || !title) { errEl.textContent = "Código y título son obligatorios."; errEl.classList.remove("d-none"); return; }
            var payload = { code: code, title: title, description: description };
            if (projectId) payload.project_id = projectId;
            window.fetchApi("/documents", { method: "POST", body: JSON.stringify(payload) }).then(function (r) {
              if (r && r.success) { if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Documento creado correctamente."); bsModal.hide(); load(); }
              else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
            });
          });
        });
      };
    }

    load();
  });
})();
