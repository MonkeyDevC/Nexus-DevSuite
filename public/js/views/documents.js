/**
 * ----
 * Vista: Documentos (#/documents)
 * Descripción: Contenido de plataforma (GET/POST/PATCH/DELETE /documentation) con panel maestro-detalle;
 *              documentos ISO (control documental) en #/documents/iso. Compatibilidad: #/documents/:uuid resuelve plataforma o ISO.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */
(function () {
  var CONTENT_MAX = 500000;
  var HUB_FILTER_STORAGE_KEY = "nexus_documents_hub_filters_v1";

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function newDedupKey() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function docApi(path, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers || {});
    var m = (options.method || "GET").toUpperCase();
    if (m !== "GET" && m !== "HEAD" && !options.headers["x-dedup-key"]) {
      options.headers["x-dedup-key"] = newDedupKey();
    }
    return window.fetchApi(path, options);
  }

  /**
   * Mensaje seguro para UI según código contractual (documentación / APEX).
   */
  function userMessageForDocumentationResponse(r) {
    if (!r || r.success) return "";
    var c = r.error && r.error.code;
    var m = r.error && r.error.message;
    if (c === "DEDUP_KEY_REQUIRED") return "Falta cabecera de idempotencia. Recargue la página e intente de nuevo.";
    if (c === "DOCUMENTATION_NOT_FOUND") return "El documento no existe o ya no está disponible.";
    if (c === "DOCUMENTATION_CONFLICT") return "Ya hay contenido activo para ese tipo y alcance. Archive el existente o cambie tipo/alcance.";
    if (c === "DOCUMENTATION_PATCH_EMPTY") return "Indique al menos un campo a modificar.";
    if (c === "DOCUMENTATION_CONTENT_TOO_LARGE") return "El texto supera el máximo permitido (" + CONTENT_MAX + " caracteres).";
    if (c === "VALIDATION_ERROR") return m || "Revise los datos introducidos.";
    if (c === "IDEMPOTENCY_IN_PROGRESS") return "La misma operación se está procesando. Espere unos segundos y reintente.";
    if (c === "IDEMPOTENCY_KEY_REUSED") return "La clave de deduplicación no coincide con el cuerpo enviado anteriormente.";
    if (c === "SCOPE_LOCK_CONFLICT") return "Otro proceso está bloqueando este recurso. Reintente en breve.";
    if (c === "AUTH_UNAUTHORIZED") return "Sesión expirada o no válida. Vuelva a iniciar sesión.";
    if (c === "AUTH_FORBIDDEN") return "No tiene permisos para esta acción.";
    if (c === "TENANT_REQUIRED") return "No se pudo determinar la organización. Verifique la configuración.";
    if (c === "NOT_FOUND" || c === "DOCUMENT_NOT_FOUND") return "Recurso no encontrado.";
    if (c && String(c).indexOf("CONFLICT") !== -1 && c !== "DOCUMENTATION_CONFLICT")
      return m || "Conflicto: el recurso no está en el estado esperado. Reintente.";
    return m || "No se pudo completar la operación.";
  }

  function hubFiltersLoad() {
    try {
      var raw = sessionStorage.getItem(HUB_FILTER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function hubFiltersSave(obj) {
    try {
      sessionStorage.setItem(HUB_FILTER_STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  function renderDocumentsHubSkeleton() {
    return (
      '<div class="nexus-panel nexus-section-spacing">' +
      '<div class="nexus-skeleton-bar w-50 mb-3"></div>' +
      '<div class="row g-0 border rounded overflow-hidden" style="min-height:380px">' +
      '<div class="col-12 col-lg-4 border-bottom border-lg-end p-3 bg-light">' +
      '<div class="nexus-skeleton-bar w-100 mb-2"></div><div class="nexus-skeleton-bar w-75 mb-2"></div>' +
      '<div class="nexus-skeleton-bar w-100 mb-2"></div><div class="nexus-skeleton-bar w-100 mb-2"></div>' +
      '<div class="nexus-skeleton-bar w-100 mb-2"></div></div>' +
      '<div class="col-12 col-lg-8 p-4">' +
      '<div class="nexus-skeleton-bar w-75 mb-3"></div><div class="nexus-skeleton-bar w-100 mb-2"></div>' +
      '<div class="nexus-skeleton-bar w-100 mb-2"></div><div class="nexus-skeleton-bar w-50 mb-2"></div></div></div>' +
      '<p class="text-muted small mt-2 mb-0" role="status" aria-live="polite">Cargando documentos…</p></div>'
    );
  }

  function sanitizePreviewHtml(html) {
    var s = String(html || "");
    s = s.replace(/<\/(?:script|iframe|object|embed|style)\b[^>]*>/gi, "");
    s = s.replace(/<(?:script|iframe|object|embed|style)\b[^>]*>[\s\S]*?<\/(?:script|iframe|object|embed|style)>/gi, "");
    s = s.replace(/<(?:script|iframe|object|embed|style)\b[^>]*\/?>/gi, "");
    s = s.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    s = s.replace(/\s(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' href="#"');
    s = s.replace(/\s(?:href|src)\s*=\s*(?:"data:text\/html[^"]*"|'data:text\/html[^']*')/gi, ' href="#"');
    var wrap = document.createElement("div");
    wrap.innerHTML = s;
    wrap.querySelectorAll("script").forEach(function (n) {
      n.remove();
    });
    wrap.querySelectorAll("style").forEach(function (n) {
      n.remove();
    });
    wrap.querySelectorAll("[href]").forEach(function (el) {
      var h = (el.getAttribute("href") || "").trim().toLowerCase();
      if (h.indexOf("javascript:") === 0 || h.indexOf("data:") === 0) el.removeAttribute("href");
    });
    wrap.querySelectorAll("[src]").forEach(function (el) {
      var u = (el.getAttribute("src") || "").trim().toLowerCase();
      if (u.indexOf("javascript:") === 0 || u.indexOf("data:text/html") === 0) el.removeAttribute("src");
    });
    return wrap.innerHTML;
  }

  function parseInlineMd(t) {
    return (t || "").split(/\*\*/).map(function (part, i) {
      return i % 2 === 1 ? "<strong>" + esc(part) + "</strong>" : esc(part);
    }).join("");
  }

  function markdownToSafeHtml(md) {
    if (!md || !String(md).trim()) return '<p class="text-muted mb-0">(sin contenido)</p>';
    var blocks = String(md).split(/\n{2,}/);
    var out = [];
    blocks.forEach(function (block) {
      var b = block.trim();
      if (!b) return;
      var lines = b.split("\n");
      if (lines.length === 1 && /^#{1,6}\s/.test(lines[0])) {
        var m = lines[0].match(/^(#{1,6})\s+(.*)$/);
        var level = m ? m[1].length : 1;
        var tag = "h" + Math.min(6, Math.max(1, level));
        out.push("<" + tag + ">" + parseInlineMd(m[2]) + "</" + tag + ">");
        return;
      }
      out.push("<p>" + lines.map(parseInlineMd).join("<br>") + "</p>");
    });
    return out.join("");
  }

  function renderDocBody(doc) {
    var fmt = (doc.format || "html").toLowerCase();
    var c = doc.content != null ? String(doc.content) : "";
    if (fmt === "markdown") return '<div class="nexus-doc-viewer-md">' + markdownToSafeHtml(c) + "</div>";
    return '<div class="nexus-doc-viewer-html border rounded p-3 bg-white">' + sanitizePreviewHtml(c) + "</div>";
  }

  function parseDocumentsRoute(segs) {
    if (!segs || !segs.length || segs[0] !== "documents") return { kind: "platform-hub", sel: null };
    var a = segs[1];
    if (!a) return { kind: "platform-hub", sel: null };
    if (a === "create") return { kind: "platform-create" };
    if (a === "iso") {
      return segs[2] ? { kind: "iso-detail", id: segs[2] } : { kind: "iso-list" };
    }
    if (/^[0-9a-f-]{36}$/i.test(a)) {
      if (segs[2] === "edit") return { kind: "platform-edit", id: a };
      return { kind: "platform-resolve", id: a };
    }
    return { kind: "platform-hub", sel: null };
  }

  var DOC_TYPES_ALLOWED = ["functional", "technical"];
  var DOC_STATUS_ALLOWED = ["ACTIVE", "ARCHIVED"];

  function renderPlatformFormPage(opts) {
    var mode = opts.mode;
    var id = opts.id;
    var isEdit = mode === "edit";
    var title = isEdit ? "Editar contenido" : "Nuevo contenido";
    var html =
      window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "Documentos", href: "#/documents" },
        { label: title, href: "" }
      ]) +
      '<div class="nexus-panel nexus-section-spacing nexus-documents-form">' +
      '<h1 class="nexus-page-title" id="platform-form-h1">' +
      esc(title) +
      "</h1>" +
      '<p class="nexus-text-secondary"><a href="#/documents">Volver al listado</a></p>' +
      '<div class="row g-3">' +
      '<div class="col-lg-7">' +
      '<div class="mb-3"><label for="pf-title" class="form-label">Título <span class="text-danger" aria-hidden="true">*</span></label>' +
      '<input type="text" id="pf-title" class="form-control" maxlength="255" required aria-required="true" placeholder="Título del documento" autocomplete="off"></div>' +
      '<div class="mb-3"><label for="pf-type" class="form-label">Tipo</label>' +
      '<select id="pf-type" class="form-select" aria-label="Tipo documental">' +
      '<option value="functional">Funcional</option><option value="technical">Técnico</option></select></div>' +
      '<div class="mb-3"><label for="pf-format" class="form-label">Formato</label>' +
      '<select id="pf-format" class="form-select" aria-label="Formato">' +
      '<option value="html">HTML</option><option value="markdown">Markdown</option></select></div>' +
      '<div class="mb-3"><label for="pf-status" class="form-label">Estado</label>' +
      '<select id="pf-status" class="form-select" aria-label="Estado">' +
      '<option value="ACTIVE">ACTIVE</option><option value="ARCHIVED">ARCHIVED</option></select></div>' +
      '<div class="mb-3"><label for="pf-content" class="form-label">Contenido <span class="text-danger">*</span></label>' +
      '<textarea id="pf-content" class="form-control font-monospace" rows="14" required aria-required="true" placeholder="Contenido (máx. ' +
      CONTENT_MAX +
      ' caracteres)"></textarea>' +
      '<div class="form-text"><span id="pf-char-count">0</span> / ' +
      CONTENT_MAX +
      " caracteres</div></div>" +
      '<div id="pf-error" class="alert alert-danger d-none" role="alert"></div>' +
      '<button type="button" class="btn btn-nexus-primary" id="pf-submit">' +
      (isEdit ? "Guardar cambios" : "Crear") +
      "</button> " +
      '<a class="btn btn-nexus-secondary" href="#/documents">Cancelar</a></div>' +
      '<div class="col-lg-5"><div class="sticky-top pt-2"><h2 class="h6 nexus-font-semibold">Vista previa</h2>' +
      '<div id="pf-preview" class="border rounded p-3 bg-light small" style="max-height:480px;overflow:auto">—</div></div></div></div></div>';
    window.setContent(html);

    function updatePreview() {
      var fmt = (document.getElementById("pf-format") && document.getElementById("pf-format").value) || "html";
      var raw = (document.getElementById("pf-content") && document.getElementById("pf-content").value) || "";
      var prev = document.getElementById("pf-preview");
      if (!prev) return;
      if (fmt === "markdown") prev.innerHTML = markdownToSafeHtml(raw);
      else prev.innerHTML = sanitizePreviewHtml(raw) || '<p class="text-muted">(vacío)</p>';
    }

    function bindCounters() {
      var ta = document.getElementById("pf-content");
      var cc = document.getElementById("pf-char-count");
      if (!ta || !cc) return;
      function sync() {
        cc.textContent = String(ta.value.length);
        if (ta.value.length > CONTENT_MAX) cc.classList.add("text-danger");
        else cc.classList.remove("text-danger");
        updatePreview();
      }
      ta.addEventListener("input", sync);
      var fs = document.getElementById("pf-format");
      if (fs) fs.addEventListener("change", updatePreview);
      sync();
    }

    function showErr(msg) {
      var e = document.getElementById("pf-error");
      if (!e) return;
      e.textContent = msg || "Error";
      e.classList.remove("d-none");
    }
    function hideErr() {
      var e = document.getElementById("pf-error");
      if (e) e.classList.add("d-none");
    }

    if (isEdit) {
      docApi("/documentation/" + encodeURIComponent(id)).then(function (body) {
        if (!body || !body.success || !body.data) {
          showErr(userMessageForDocumentationResponse(body) || "No se pudo cargar.");
          return;
        }
        var d = body.data;
        var t = document.getElementById("pf-title");
        var ty = document.getElementById("pf-type");
        var f = document.getElementById("pf-format");
        var st = document.getElementById("pf-status");
        var c = document.getElementById("pf-content");
        if (t) t.value = d.title || "";
        if (ty) ty.value = d.type || "functional";
        if (f) f.value = d.format || "html";
        if (st) st.value = d.status || "ACTIVE";
        if (c) c.value = d.content != null ? String(d.content) : "";
        bindCounters();
      });
    } else bindCounters();

    var submitInFlight = false;
    var btnSubmit = document.getElementById("pf-submit");
    var submitLabelDefault = btnSubmit ? btnSubmit.textContent : "";
    btnSubmit.onclick = function () {
      if (submitInFlight) return;
      hideErr();
      var title = (document.getElementById("pf-title").value || "").trim();
      var type = document.getElementById("pf-type").value;
      var format = document.getElementById("pf-format").value;
      var status = document.getElementById("pf-status").value;
      var content = document.getElementById("pf-content").value;
      if (!title) {
        showErr("El título es obligatorio.");
        var ti = document.getElementById("pf-title");
        if (ti) {
          ti.focus();
          ti.classList.add("is-invalid");
        }
        return;
      }
      document.getElementById("pf-title").classList.remove("is-invalid");
      if (DOC_TYPES_ALLOWED.indexOf(type) === -1) {
        showErr("Seleccione un tipo de documento válido.");
        return;
      }
      if (DOC_STATUS_ALLOWED.indexOf(status) === -1) {
        showErr("Seleccione un estado válido.");
        return;
      }
      if (!content || !String(content).trim()) {
        showErr("El contenido es obligatorio.");
        return;
      }
      if (content.length > CONTENT_MAX) {
        showErr("El contenido supera el máximo permitido (" + CONTENT_MAX + " caracteres).");
        return;
      }
      var btn = document.getElementById("pf-submit");
      submitInFlight = true;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Guardando…";
      function releaseSubmit() {
        submitInFlight = false;
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        btn.textContent = submitLabelDefault;
      }
      if (isEdit) {
        docApi("/documentation/" + encodeURIComponent(id), {
          method: "PATCH",
          body: JSON.stringify({ title: title, content: content, format: format, type: type, status: status })
        }).then(function (r) {
          releaseSubmit();
          if (r && r.success) {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Contenido actualizado.");
            window.location.hash = "#/documents/" + id;
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          } else {
            var um = userMessageForDocumentationResponse(r);
            showErr(um || "No se pudo guardar.");
            if (typeof window.showErrorMessage === "function") window.showErrorMessage(um || window.getApiErrorMessage(r));
          }
        });
      } else {
        docApi("/documentation", {
          method: "POST",
          body: JSON.stringify({
            type: type,
            format: format,
            content: content,
            title: title
          })
        }).then(function (r) {
          releaseSubmit();
          if (r && r.success && r.data && r.data.id) {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Contenido creado.");
            window.location.hash = "#/documents/" + r.data.id;
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          } else {
            var um2 = userMessageForDocumentationResponse(r);
            showErr(um2 || "No se pudo crear.");
            if (typeof window.showErrorMessage === "function") window.showErrorMessage(um2 || window.getApiErrorMessage(r));
          }
        });
      }
    };
  }

  function renderHubDetailLoadErrorPanel(selectedId, message) {
    return (
      '<div class="hub-detail-error nexus-panel">' +
      '<div class="alert alert-warning" role="alert">' +
      esc(message || "No se pudo cargar el documento.") +
      "</div>" +
      '<button type="button" class="btn btn-nexus-primary btn-sm" id="hub-detail-retry">Reintentar</button> ' +
      '<a class="btn btn-nexus-secondary btn-sm" href="#/documents">Quitar selección</a></div>'
    );
  }

  async function renderPlatformHub(selectedId) {
    window.setContent(renderDocumentsHubSkeleton());
    var listPromise = docApi("/documentation?limit=100&page=1&include_archived=true");
    var detailPromise = selectedId
      ? docApi("/documentation/" + encodeURIComponent(selectedId))
      : Promise.resolve({ success: true, data: null });
    var listRes;
    var dr;
    try {
      var pair = await Promise.all([listPromise, detailPromise]);
      listRes = pair[0];
      dr = pair[1];
    } catch (_) {
      listRes = { success: false, error: { message: "Error de carga." } };
      dr = { success: false };
    }
    if (!listRes || !listRes.success) {
      var errMsg = userMessageForDocumentationResponse(listRes) || "Error al cargar contenidos.";
      window.setContent(
        '<div class="nexus-panel nexus-section-spacing">' +
          window.showError(errMsg) +
          '<button type="button" class="btn btn-nexus-primary mt-2" id="doc-hub-retry">Reintentar</button> ' +
          '<a class="btn btn-nexus-secondary mt-2" href="#/documents/iso">Ir a documentos ISO</a></div>'
      );
      var rb = document.getElementById("doc-hub-retry");
      if (rb)
        rb.onclick = function () {
          window.location.hash = "#/documents";
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        };
      return;
    }
    var payload = listRes.data || {};
    var items = payload.data || [];
    var meta = payload.meta || {};
    var detailDoc = null;
    var detailLoadFailed = false;
    if (selectedId) {
      if (dr && dr.success && dr.data) detailDoc = dr.data;
      else detailLoadFailed = true;
    }

    var html =
      window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "Documentos", href: "" }
      ]) +
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '<h1 class="nexus-page-title mb-0 flex-grow-1">Documentos</h1>' +
      '<a href="#/documents/create" class="btn btn-nexus-primary btn-sm">+ Crear contenido</a>' +
      '<a href="#/documents/iso" class="btn btn-outline-secondary btn-sm">Documentos ISO</a></div>' +
      '<p class="nexus-text-secondary small mb-3">Contenido de plataforma (guías y referencia). El control documental ISO está en <a href="#/documents/iso">Documentos ISO</a>.</p>' +
      '<div class="row g-0 border rounded overflow-hidden nexus-documents-split" style="min-height:420px">' +
      '<div class="col-12 col-lg-4 border-bottom border-lg-bottom-0 border-lg-end bg-light d-flex flex-column" style="max-height:70vh">' +
      '<div class="p-3 border-bottom flex-shrink-0">' +
      '<label for="hub-search" class="form-label small mb-1">Buscar</label>' +
      '<input type="search" id="hub-search" class="form-control form-control-sm" placeholder="Título o contenido…" aria-label="Filtrar listado">' +
      '<div class="row g-2 mt-2">' +
      '<div class="col-6"><label class="form-label small mb-0" for="hub-filter-type">Tipo</label>' +
      '<select id="hub-filter-type" class="form-select form-select-sm" aria-label="Filtrar por tipo">' +
      '<option value="">Todos</option><option value="functional">Funcional</option><option value="technical">Técnico</option></select></div>' +
      '<div class="col-6"><label class="form-label small mb-0" for="hub-filter-status">Estado</label>' +
      '<select id="hub-filter-status" class="form-select form-select-sm" aria-label="Filtrar por estado">' +
      '<option value="">Activos</option><option value="ACTIVE">ACTIVE</option><option value="ARCHIVED">ARCHIVED</option><option value="__all__">Todos</option></select></div></div>' +
      '<p class="small text-muted mb-0 mt-2">' +
      (meta.total != null ? meta.total : items.length) +
      " registro(s)</p></div>" +
      '<div class="list-group list-group-flush overflow-auto flex-grow-1" id="hub-list" role="list"></div></div>' +
      '<div class="col-12 col-lg-8"><div id="hub-detail" class="p-3 p-lg-4 h-100 overflow-auto" style="min-height:280px">';

    if (detailLoadFailed && selectedId) {
      html += renderHubDetailLoadErrorPanel(selectedId, userMessageForDocumentationResponse(dr));
    } else if (!selectedId || !detailDoc) {
      html +=
        '<div class="nexus-empty-state py-5"><p class="nexus-empty-state-title">Seleccione un documento</p>' +
        '<p class="nexus-text-secondary">Elija un elemento de la lista o cree uno nuevo.</p>' +
        '<a href="#/documents/create" class="btn btn-nexus-primary btn-sm">Crear documento</a></div>';
    } else {
      html += renderHubDetailPanel(detailDoc);
    }
    html += "</div></div></div>";
    window.setContent(html);

    function filterItems() {
      var q = ((document.getElementById("hub-search") && document.getElementById("hub-search").value) || "").toLowerCase().trim();
      var ft = (document.getElementById("hub-filter-type") && document.getElementById("hub-filter-type").value) || "";
      var fs = (document.getElementById("hub-filter-status") && document.getElementById("hub-filter-status").value) || "";
      return items.filter(function (it) {
        if (ft && it.type !== ft) return false;
        if (fs === "ACTIVE" || fs === "ARCHIVED") {
          if (it.status !== fs) return false;
        } else if (fs === "" && it.status !== "ACTIVE") {
          return false;
        }
        if (!q) return true;
        var t = (it.title || "") + " " + (it.content || "");
        return t.toLowerCase().indexOf(q) !== -1;
      });
    }

    function renderListRows(filtered) {
      var el = document.getElementById("hub-list");
      if (!el) return;
      if (!filtered.length) {
        var noData = !items || items.length === 0;
        el.innerHTML = noData
          ? '<div class="list-group-item text-muted text-center py-4" role="status">No hay documentos aún. <a href="#/documents/create">Crear documento</a></div>'
          : '<div class="list-group-item text-muted text-center py-4" role="status">Sin resultados con los filtros actuales. <a href="#/documents/create">Crear contenido</a></div>';
        return;
      }
      el.innerHTML = filtered
        .map(function (it) {
          var active = selectedId && it.id === selectedId ? " active" : "";
          var badge = '<span class="badge ' + window.nexusBadgeClass(it.status) + ' ms-1">' + esc(it.status || "") + "</span>";
          return (
            '<a href="#/documents/' +
            encodeURIComponent(it.id) +
            '" class="list-group-item list-group-item-action' +
            active +
            '" role="listitem" data-doc-id="' +
            esc(it.id) +
            '">' +
            '<div class="d-flex justify-content-between align-items-start gap-2">' +
            "<div><strong>" +
            esc(it.title || "(sin título)") +
            "</strong><br>" +
            '<span class="small text-muted">' +
            esc(it.type || "") +
            " · " +
            esc(it.format || "") +
            "</span></div>" +
            badge +
            "</div></a>"
          );
        })
        .join("");
    }

    var savedF = hubFiltersLoad();
    var hs = document.getElementById("hub-search");
    var hft = document.getElementById("hub-filter-type");
    var hfs = document.getElementById("hub-filter-status");
    if (hs && savedF.q != null) hs.value = savedF.q;
    if (hft && savedF.type != null) hft.value = savedF.type;
    if (hfs && savedF.status != null) hfs.value = savedF.status;

    function persistHubFilters() {
      hubFiltersSave({
        q: (hs && hs.value) || "",
        type: (hft && hft.value) || "",
        status: (hfs && hfs.value) || ""
      });
    }

    renderListRows(filterItems());
    var debounceT;
    function onFilterImmediate() {
      persistHubFilters();
      renderListRows(filterItems());
    }
    function onFilterDebounced() {
      clearTimeout(debounceT);
      debounceT = setTimeout(onFilterImmediate, 280);
    }
    if (hs) hs.addEventListener("input", onFilterDebounced);
    if (hft) hft.addEventListener("change", onFilterImmediate);
    if (hfs) hfs.addEventListener("change", onFilterImmediate);

    var retryDetail = document.getElementById("hub-detail-retry");
    if (retryDetail && selectedId)
      retryDetail.onclick = function () {
        window.location.hash = "#/documents/" + encodeURIComponent(selectedId);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      };

    bindHubDetailActions(detailDoc, selectedId);
  }

  function renderHubDetailPanel(d) {
    return (
      '<article aria-label="Detalle documento">' +
      '<div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">' +
      "<div><h2 class=\"h4 mb-1\">" +
      esc(d.title || "(sin título)") +
      '</h2><p class="small text-muted mb-0">' +
      esc(d.type || "") +
      " · " +
      esc(d.format || "") +
      " · " +
      esc(d.status || "") +
      "</p></div>" +
      '<div class="btn-group flex-shrink-0">' +
      '<a href="#/documents/' +
      encodeURIComponent(d.id) +
      '/edit" class="btn btn-sm btn-nexus-secondary">Editar</a>' +
      '<button type="button" class="btn btn-sm btn-outline-danger" id="hub-btn-del">Eliminar</button></div></div>' +
      '<section class="nexus-doc-body" aria-label="Contenido">' +
      renderDocBody(d) +
      "</section></article>"
    );
  }

  function bindHubDetailActions(detailDoc, selectedId) {
    if (!detailDoc || !selectedId) return;
    var del = document.getElementById("hub-btn-del");
    if (!del) return;
    var lastDelOpen = 0;
    var deleteSubmitBusy = false;
    del.onclick = function () {
      if (typeof window.openNexusConfirmModal !== "function") return;
      var now = Date.now();
      if (now - lastDelOpen < 700) return;
      lastDelOpen = now;
      window.openNexusConfirmModal(
        { title: "Eliminar contenido", message: "Esta acción no se puede deshacer.", primaryLabel: "Eliminar", primaryDanger: true },
        function (closeModal, showError) {
          if (deleteSubmitBusy) return;
          deleteSubmitBusy = true;
          docApi("/documentation/" + encodeURIComponent(selectedId), { method: "DELETE" }).then(function (r) {
            deleteSubmitBusy = false;
            if (r && r.success) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Eliminado correctamente.");
              closeModal();
              window.location.hash = "#/documents";
              window.dispatchEvent(new HashChangeEvent("hashchange"));
            } else {
              var delMsg = userMessageForDocumentationResponse(r) || window.getApiErrorMessage(r);
              showError(delMsg);
            }
          });
        }
      );
    };
  }

  function renderIsoListView() {
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

    function renderList(items, meta) {
      var h =
        window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Documentos", href: "#/documents" },
          { label: "Documentos ISO", href: "" }
        ]) +
        '<h1 class="nexus-page-title">Documentos ISO</h1><p class="nexus-text-secondary"><a href="#/documents">← Volver a contenido de plataforma</a></p><div class="nexus-panel nexus-section-spacing">';
      h += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3">';
      h += typeof window.renderPageSizeSelector === "function" ? window.renderPageSizeSelector({ selectId: "doc-per-page", currentLimit: state.limit, options: [10, 25, 50] }) : "";
      h +=
        '<input type="search" id="doc-search" class="form-control form-control-sm nexus-input" placeholder="Buscar..." style="max-width:220px" aria-label="Buscar">';
      h += '<label class="mb-0 nexus-text-sm">Código</label>';
      h +=
        '<input type="text" id="doc-code-search" class="form-control form-control-sm nexus-input" placeholder="Código exacto" style="max-width:180px" aria-label="Código del documento">';
      h += '<button type="button" class="btn btn-nexus-secondary btn-sm" id="doc-code-go">Ir</button>';
      h += '<span id="doc-code-msg" class="nexus-text-sm text-muted ms-1"></span>';
      h += '<a href="#" id="doc-new" class="btn btn-nexus-primary btn-sm ms-auto">+ Nuevo documento ISO</a></div>';
      if (!items || items.length === 0) {
        h +=
          '<div class="nexus-empty-state"><p class="nexus-empty-state-title">' +
          (state.search ? "Sin resultados" : "No hay documentos") +
          '</p><p class="nexus-text-secondary">Cree un documento o ajuste la búsqueda.</p></div>';
      } else {
        h += window.renderNexusTable({
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
              '<a href="#/documents/iso/' + d.id + '">' + esc(d.title || d.id) + "</a>",
              typeof lat === "object" ? lat.status || "—" : lat,
              '<span class="' + window.nexusBadgeClass(st) + '">' + (typeof st === "string" ? st : "—") + "</span>",
              window.renderTableActions({
                view: { href: "#/documents/iso/" + d.id, ariaLabel: "Ver documento " + (d.title || d.code || d.id || "").slice(0, 40) }
              })
            ];
          }
        });
        if (meta && meta.totalPages > 1) h += '<div id="doc-pagination" class="mt-2"></div>';
      }
      h += "</div>";
      return h;
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
          var totalPages = state.search ? 1 : meta.totalPages != null ? meta.totalPages : total === 0 ? 0 : Math.ceil(total / limit);
          currentMeta = { page: state.page, limit: limit, total: state.search ? toShow.length : total, totalPages: totalPages };
          window.setContent(renderList(toShow, currentMeta));
          bindIsoList();
        } else window.setContent(window.showError(body && body.error && body.error.message));
      });
    }

    function refreshFromCurrent() {
      var toShow = getDisplayItems(currentItems);
      if (!currentMeta) currentMeta = { page: 1, limit: state.limit, total: currentItems.length, totalPages: 1 };
      if (state.search) currentMeta = { page: 1, limit: currentMeta.limit, total: toShow.length, totalPages: toShow.length ? 1 : 0 };
      window.setContent(renderList(toShow, currentMeta));
      bindIsoList();
    }

    function bindIsoList() {
      var perPageEl = document.getElementById("doc-per-page");
      if (perPageEl)
        perPageEl.onchange = function () {
          state.limit = parseInt(perPageEl.value, 10) || 10;
          state.page = 1;
          load();
        };
      var search = document.getElementById("doc-search");
      if (search) {
        search.value = state.search;
        var t;
        search.oninput = function () {
          clearTimeout(t);
          t = setTimeout(function () {
            state.search = search.value;
            state.page = 1;
            load();
          }, 300);
        };
      }
      var pagEl = document.getElementById("doc-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) {
          state.page = p;
          load();
        });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page"))
            a.onclick = function (e) {
              e.preventDefault();
              var p = parseInt(a.getAttribute("data-page"), 10);
              if (p >= 1 && p <= currentMeta.totalPages) {
                state.page = p;
                load();
              }
            };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          setSort(a.getAttribute("data-sort"));
        };
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
            window.location.hash = "#/documents/iso/" + r.data.id;
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          } else if (codeMsg) codeMsg.textContent = "No se encontró ningún documento con ese código.";
        });
      }
      if (codeGo) codeGo.onclick = doCodeSearch;
      if (codeSearch) codeSearch.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doCodeSearch();
        }
      };
      var btn = document.getElementById("doc-new");
      if (btn)
        btn.onclick = function (e) {
          e.preventDefault();
          window.fetchApi("/projects").then(function (projRes) {
            var projects = projRes && projRes.success && projRes.data && projRes.data.items ? projRes.data.items : [];
            function formatProjectListLabel(project) {
              if (!project) return "—";
              var pid = project.number != null && project.number !== "" ? "P" + String(project.number) : (project.id || "").slice(0, 8) || "—";
              var name = project.name && String(project.name).trim() ? String(project.name).trim() : project.id || "—";
              return pid + " - " + name;
            }
            var bodyHtml = '<div class="mb-3"><label class="form-label">Código</label><input type="text" id="doc-form-code" class="form-control" placeholder="Código" required></div>';
            bodyHtml += '<div class="mb-3"><label class="form-label">Título</label><input type="text" id="doc-form-title" class="form-control" placeholder="Título" required></div>';
            bodyHtml +=
              '<div class="mb-3"><label class="form-label">Descripción</label><textarea id="doc-form-desc" class="form-control" rows="2" placeholder="Descripción (opcional)" aria-label="Descripción"></textarea></div>';
            bodyHtml +=
              '<div class="mb-3"><label class="form-label">Proyecto (opcional)</label><select id="doc-form-project" class="form-select" aria-label="Proyecto"><option value="">Sin proyecto</option>';
            projects.forEach(function (p) {
              bodyHtml += '<option value="' + (p.id || "") + '">' + esc(formatProjectListLabel(p)) + "</option>";
            });
            bodyHtml += '</select></div><div id="doc-form-error" class="alert alert-danger d-none"></div>';
            function doCreate() {
              var code = (document.getElementById("doc-form-code").value || "").trim();
              var title = (document.getElementById("doc-form-title").value || "").trim();
              var descEl = document.getElementById("doc-form-desc");
              var description = descEl && descEl.value ? descEl.value.trim() : "";
              var projEl = document.getElementById("doc-form-project");
              var projectId = projEl && projEl.value ? projEl.value : "";
              var errEl = document.getElementById("doc-form-error");
              errEl.classList.add("d-none");
              if (!code || !title) {
                errEl.textContent = "Código y título son obligatorios.";
                errEl.classList.remove("d-none");
                return Promise.resolve(false);
              }
              var payload = { code: code, title: title, description: description };
              if (projectId) payload.project_id = projectId;
              return window.fetchApi("/documents", { method: "POST", body: JSON.stringify(payload) }).then(function (r) {
                if (r && r.success) {
                  if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Documento creado correctamente.");
                  load();
                  return true;
                }
                errEl.textContent = (r && r.error && r.error.message) || "Error.";
                errEl.classList.remove("d-none");
                return false;
              });
            }
            window.openNexusFormModal(
              {
                id: "docNewModal",
                title: "Nuevo documento ISO",
                bodyHtml: bodyHtml,
                mode: "create",
                primaryButtonId: "doc-form-submit",
                primaryLabel: "Crear",
                getDirtyState: function () {
                  var c = (document.getElementById("doc-form-code").value || "").trim();
                  var t = (document.getElementById("doc-form-title").value || "").trim();
                  var d = document.getElementById("doc-form-desc");
                  return c.length > 0 || t.length > 0 || (d && d.value && d.value.trim().length > 0);
                },
                onSaveBeforeClose: doCreate
              },
              function (bsModal) {
                doCreate().then(function (ok) {
                  if (ok) bsModal.hide();
                });
              }
            );
          });
        };
    }

    load();
  }

  function renderIsoDetailView(docId) {
    window.setContent(window.showLoading());
    window.fetchApi("/documents/" + docId).then(function (body) {
      if (!body || !body.success || !body.data) {
        window.setContent(window.showError(body && body.error && body.error.message));
        return;
      }
      var d = body.data;
      window.fetchApi("/documents/" + docId + "/versions").then(function (versRes) {
        var vers = [];
        if (versRes && versRes.success && versRes.data) {
          var vData = versRes.data;
          vers = vData.data || vData.items || (Array.isArray(vData) ? vData : []);
        }
        window.getMe().then(function (user) {
          var isMaster =
            typeof window.nexusCanAccessMasterActions === "function" ? window.nexusCanAccessMasterActions(user) : user && user.role === "MASTER";
          var html =
            window.renderBreadcrumbs([
              { label: "Panel", href: "#/dashboard" },
              { label: "Documentos", href: "#/documents" },
              { label: "ISO", href: "#/documents/iso" },
              { label: d.title || d.code, href: "" }
            ]) +
            '<div class="nexus-panel nexus-section-spacing"><h1 class="nexus-page-title">' +
            esc(d.title || d.code) +
            '</h1><p class="nexus-text-secondary">Código: ' +
            esc(d.code) +
            "</p><p>" +
            esc(d.description || "") +
            "</p>";
          if (d.feature_id) html += '<p class="nexus-text-sm">Feature: <a href="#/features/' + encodeURIComponent(d.feature_id) + '">Ver</a></p>';
          if (d.story_id) html += '<p class="nexus-text-sm">Story: <a href="#/stories?story=' + encodeURIComponent(d.story_id) + '">Ver</a></p>';
          html += '<h2 class="h5 mt-3">Versiones</h2><div class="mb-2"><button type="button" class="btn btn-nexus-primary btn-sm" id="doc-new-version">Nueva versión</button></div>';
          html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr><th>Versión</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
          if (vers.length === 0) {
            html += '<tr><td colspan="3" class="text-muted text-center py-3">No hay versiones.</td></tr>';
          } else {
            vers.forEach(function (v) {
              html += "<tr><td>" + (v.version_number != null ? v.version_number : v.id) + '</td><td><span class="' + window.nexusBadgeClass(v.status) + '">' + esc(v.status || "") + '</span></td><td>';
              html +=
                '<button type="button" class="btn btn-link btn-sm p-0 doc-view-content" data-version-id="' +
                esc(v.id) +
                '" data-version-status="' +
                esc(v.status || "") +
                '">Ver contenido</button> ';
              if (isMaster && v.status === "DRAFT") html += '<button type="button" class="btn btn-link btn-sm p-0 doc-approve" data-version-id="' + esc(v.id) + '">Aprobar</button> ';
              if (isMaster) html += '<button type="button" class="btn btn-link btn-sm p-0 doc-archive" data-version-id="' + esc(v.id) + '">Archivar</button>';
              html += "</td></tr>";
            });
          }
          html += '</tbody></table></div><a href="#/documents/iso" class="btn btn-nexus-secondary btn-sm mt-3">Volver</a></div>';
          window.setContent(html);

          function reloadDetail() {
            window.location.hash = "#/documents/iso/" + docId;
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          }

          document.querySelectorAll("#content .doc-approve").forEach(function (btn) {
            btn.onclick = function () {
              var vid = btn.getAttribute("data-version-id");
              if (!vid) return;
              window.fetchApi("/documents/" + docId + "/versions/" + vid + "/status", { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) }).then(function (r) {
                if (r && r.success) {
                  if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Versión aprobada.");
                  reloadDetail();
                } else window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error." });
              });
            };
          });
          document.querySelectorAll("#content .doc-archive").forEach(function (btn) {
            btn.onclick = function () {
              var vid = btn.getAttribute("data-version-id");
              if (!vid) return;
              window.fetchApi("/documents/" + docId + "/versions/" + vid + "/status", { method: "PATCH", body: JSON.stringify({ status: "ARCHIVED" }) }).then(function (r) {
                if (r && r.success) {
                  if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Versión archivada.");
                  reloadDetail();
                } else window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error." });
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
                  window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "No se pudo cargar." });
                  return;
                }
                var version = r.data;
                var content = version.content != null ? version.content : "";
                var canEdit = isMaster && vStatus === "DRAFT";
                var bodyHtml = '<div class="mb-3"><label class="form-label">Contenido</label>';
                if (canEdit) {
                  bodyHtml +=
                    '<textarea id="doc-version-content-field" class="form-control font-monospace" rows="12" aria-label="Contenido">' +
                    esc(content) +
                    "</textarea>";
                  bodyHtml += '</div><div id="doc-version-content-error" class="alert alert-danger d-none"></div>';
                } else {
                  bodyHtml +=
                    '<pre id="doc-version-content-readonly" class="border rounded p-3 bg-light text-start" style="max-height:320px;overflow:auto;white-space:pre-wrap;word-break:break-word">' +
                    esc(content || "(vacío)") +
                    "</pre></div>";
                }
                var primaryLabel = canEdit ? "Guardar" : "Cerrar";
                var primaryId = canEdit ? "doc-version-content-save" : "doc-version-content-close";
                var initialContent = (content || "").toString();
                function doSave() {
                  var textarea = document.getElementById("doc-version-content-field");
                  var newContent = textarea ? textarea.value : "";
                  var errEl = document.getElementById("doc-version-content-error");
                  if (errEl) errEl.classList.add("d-none");
                  return window
                    .fetchApi("/documents/" + docId + "/versions/" + vid, { method: "PATCH", body: JSON.stringify({ content: newContent }) })
                    .then(function (res) {
                      if (res && res.success) {
                        if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Guardado.");
                        reloadDetail();
                        return true;
                      }
                      if (errEl) {
                        errEl.textContent = (res && res.error && res.error.message) || "Error.";
                        errEl.classList.remove("d-none");
                      }
                      return false;
                    });
                }
                window.openNexusFormModal(
                  {
                    id: "docVersionContentModal",
                    title: "Contenido de la versión",
                    bodyHtml: bodyHtml,
                    mode: canEdit ? "edit" : "view",
                    primaryButtonId: primaryId,
                    primaryLabel: primaryLabel,
                    getDirtyState: canEdit
                      ? function () {
                          var ta = document.getElementById("doc-version-content-field");
                          return ta && ta.value !== initialContent;
                        }
                      : undefined,
                    onSaveBeforeClose: canEdit ? doSave : undefined
                  },
                  function (bsModal) {
                    if (canEdit) doSave().then(function (ok) { if (ok) bsModal.hide(); });
                    else bsModal.hide();
                  }
                );
              });
            };
          });
          var btnNewVer = document.getElementById("doc-new-version");
          if (btnNewVer)
            btnNewVer.onclick = function () {
              var bodyHtml =
                '<div class="mb-3"><label class="form-label">Motivo del cambio (opcional)</label><input type="text" id="doc-ver-change-reason" class="form-control" placeholder="Motivo" aria-label="Motivo"></div>';
              bodyHtml +=
                '<div class="mb-3"><label class="form-label">Contenido (opcional)</label><textarea id="doc-ver-content" class="form-control" rows="4" placeholder="Contenido" aria-label="Contenido"></textarea></div><div id="doc-ver-error" class="alert alert-danger d-none"></div>';
              function doCreate() {
                var errEl = document.getElementById("doc-ver-error");
                errEl.classList.add("d-none");
                var changeReason = (document.getElementById("doc-ver-change-reason") && document.getElementById("doc-ver-change-reason").value || "").trim();
                var content = (document.getElementById("doc-ver-content") && document.getElementById("doc-ver-content").value || "").trim();
                return window
                  .fetchApi("/documents/" + docId + "/versions", {
                    method: "POST",
                    body: JSON.stringify({ change_reason: changeReason || undefined, content: content || undefined })
                  })
                  .then(function (r) {
                    if (r && r.success) {
                      if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Versión creada.");
                      reloadDetail();
                      return true;
                    }
                    errEl.textContent = (r && r.error && r.error.message) || "Error.";
                    errEl.classList.remove("d-none");
                    return false;
                  });
              }
              window.openNexusFormModal(
                {
                  id: "docNewVersionModal",
                  title: "Nueva versión",
                  bodyHtml: bodyHtml,
                  mode: "create",
                  primaryButtonId: "doc-ver-submit",
                  primaryLabel: "Crear",
                  getDirtyState: function () {
                    var r = (document.getElementById("doc-ver-change-reason") && document.getElementById("doc-ver-change-reason").value || "").trim();
                    var c = (document.getElementById("doc-ver-content") && document.getElementById("doc-ver-content").value || "").trim();
                    return r.length > 0 || c.length > 0;
                  },
                  onSaveBeforeClose: doCreate
                },
                function (bsModal) {
                  doCreate().then(function (ok) {
                    if (ok) bsModal.hide();
                  });
                }
              );
            };
        });
      });
    });
  }

  window.registerView("documents", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var route = parseDocumentsRoute(segs);

    if (route.kind === "iso-list") {
      renderIsoListView();
      return;
    }
    if (route.kind === "iso-detail") {
      renderIsoDetailView(route.id);
      return;
    }
    if (route.kind === "platform-create") {
      renderPlatformFormPage({ mode: "create" });
      return;
    }
    if (route.kind === "platform-edit") {
      renderPlatformFormPage({ mode: "edit", id: route.id });
      return;
    }
    if (route.kind === "platform-resolve") {
      var plat = await docApi("/documentation/" + encodeURIComponent(route.id));
      if (plat && plat.success && plat.data) {
        renderPlatformHub(route.id);
        return;
      }
      var iso = await window.fetchApi("/documents/" + encodeURIComponent(route.id));
      if (iso && iso.success && iso.data) {
        window.location.hash = "#/documents/iso/" + route.id;
        return;
      }
      var resolveMsg =
        userMessageForDocumentationResponse(plat) ||
        (iso && !iso.success && window.getApiErrorMessage(iso)) ||
        "No se encontró el recurso.";
      window.setContent(
        '<div class="nexus-panel nexus-section-spacing">' +
          window.showError(resolveMsg) +
          ' <a href="#/documents" class="btn btn-nexus-primary btn-sm">Volver</a></div>'
      );
      return;
    }
    renderPlatformHub(null);
  });
})();
