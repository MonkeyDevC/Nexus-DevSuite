/**
 * Utilidades UX compartidas — ETAPA 8: ordenación, filtros, búsqueda, paginación, badges, breadcrumbs, empty state.
 * Solo parámetros documentados en API; el resto en cliente.
 */
(function () {
  "use strict";

  /** Mapeo estado → clase Bootstrap badge (convención coherente). */
  window.statusBadgeClass = function (status) {
    if (!status) return "bg-secondary";
    var s = String(status).toUpperCase();
    if (s === "ACTIVE" || s === "RELEASED" || s === "RESOLVED" || s === "APPROVED" || s === "IMPLEMENTED") return "bg-success";
    if (s === "ARCHIVED" || s === "CLOSED" || s === "REJECTED") return "bg-secondary";
    if (s === "IN_PROGRESS" || s === "OPEN" || s === "SUBMITTED") return "bg-warning text-dark";
    if (s === "PLANNED" || s === "DRAFT") return "bg-info text-dark";
    return "bg-secondary";
  };

  /** ETAPA 14–17: estado API → clase design system (nexus-badge nexus-badge-*). Valores exactos API. */
  window.nexusBadgeClass = function (status) {
    if (!status) return "nexus-badge nexus-badge-archived";
    var k = String(status).toUpperCase().replace(/_/g, "-").toLowerCase();
    return "nexus-badge nexus-badge-" + k;
  };

  /**
   * Botón "Eliminar filtro" reutilizable para tablas con filtros.
   * opts: { show: boolean, id: string } — show = true cuando hay filtros activos; id = id del botón para enlazar onclick.
   * Devuelve HTML del botón o "" si show es false.
   */
  window.clearFiltersButtonIcon = '<span class="me-1" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></span>';
  window.renderClearFiltersButton = function (opts) {
    if (!opts || !opts.show || !opts.id) return "";
    var icon = window.clearFiltersButtonIcon || "";
    return '<button type="button" id="' + (opts.id.replace(/"/g, "&quot;")) + '" class="btn btn-outline-secondary btn-sm nexus-clear-filters-btn">' + icon + "Eliminar filtro</button>";
  };

  /** Breadcrumbs: items = [{ label, href? }]. href vacío = texto sin enlace. */
  window.renderBreadcrumbs = function (items) {
    if (!items || !items.length) return "";
    var parts = items.map(function (item, i) {
      var label = item.label || "";
      if (item.href) return '<a href="' + item.href + '">' + label + "</a>";
      return "<span class=\"text-muted\">" + label + "</span>";
    });
    var html = '<nav aria-label="breadcrumb"><ol class="breadcrumb mb-2">';
    for (var j = 0; j < parts.length; j++) {
      html += "<li class=\"breadcrumb-item\">" + parts[j] + "</li>";
    }
    html += "</ol></nav>";
    return html;
  };

  /** Empty state: mensaje e icono opcional (Bootstrap icon name o emoji). */
  window.emptyState = function (message, icon) {
    var iconHtml = icon ? "<p class=\"fs-1 text-muted\">" + (icon.length <= 2 ? icon : "<span class=\"bi bi-" + icon + "\"></span>") + "</p>" : "";
    return '<div class="text-center py-5 text-muted">' + iconHtml + "<p>" + (message || "No hay datos.") + "</p></div>";
  };

  /** Ordenar array por clave; dir "asc" | "desc". */
  window.sortArray = function (arr, key, dir) {
    if (!Array.isArray(arr)) return [];
    var copy = arr.slice();
    copy.sort(function (a, b) {
      var va = a[key];
      var vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return dir === "asc" ? 1 : -1;
      if (vb == null) return dir === "asc" ? -1 : 1;
      if (typeof va === "string") {
        var c = String(va).localeCompare(String(vb));
        return dir === "desc" ? -c : c;
      }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  };

  /** Filtrar por búsqueda de texto en campos (cualquier campo que contenga q). */
  window.filterBySearch = function (arr, fields, q) {
    if (!Array.isArray(arr) || !q || !String(q).trim()) return arr;
    var term = String(q).trim().toLowerCase();
    return arr.filter(function (item) {
      for (var i = 0; i < fields.length; i++) {
        var v = item[fields[i]];
        if (v != null && String(v).toLowerCase().indexOf(term) !== -1) return true;
      }
      return false;
    });
  };

  /** Filtrar por estado (campo status o key). */
  window.filterByStatus = function (arr, statusValue, key) {
    if (!Array.isArray(arr) || statusValue === "" || statusValue == null) return arr;
    var k = key || "status";
    return arr.filter(function (item) { return item[k] === statusValue; });
  };

  /** Paginar array en cliente: { items, total, page, limit, totalPages }. */
  window.paginateClient = function (arr, page, limit) {
    if (!Array.isArray(arr)) return { items: [], total: 0, page: 1, limit: limit || 10, totalPages: 0 };
    var total = arr.length;
    var lim = Math.max(1, parseInt(limit, 10) || 10);
    var totalPages = total === 0 ? 0 : Math.ceil(total / lim);
    var p = Math.max(1, Math.min(page || 1, totalPages || 1));
    var start = (p - 1) * lim;
    return {
      items: arr.slice(start, start + lim),
      total: total,
      page: p,
      limit: lim,
      totalPages: totalPages
    };
  };

  /** Renderizar controles de paginación (API o cliente). meta: { page, limit, total, totalPages }. onPage(pageNum). */
  window.renderPagination = function (meta, onPage) {
    if (!meta || meta.totalPages <= 1) return "";
    var p = meta.page || 1;
    var total = meta.totalPages;
    var html = '<nav><ul class="pagination pagination-sm flex-wrap">';
    html += '<li class="page-item' + (p <= 1 ? " disabled" : "") + '"><a class="page-link" href="#" data-page="' + (p - 1) + '">Anterior</a></li>';
    for (var i = 1; i <= total && i <= 10; i++) {
      html += '<li class="page-item' + (i === p ? " active" : "") + '"><a class="page-link" href="#" data-page="' + i + '">' + i + "</a></li>";
    }
    if (total > 10) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += '<li class="page-item' + (p >= total ? " disabled" : "") + '"><a class="page-link" href="#" data-page="' + (p + 1) + '">Siguiente</a></li>';
    html += "</ul></nav>";
    return html;
  };

  /** Cabecera de tabla ordenable: label, sortKey, currentSort, currentDir ("asc"|"desc"), callback(sortKey). */
  window.sortableTh = function (label, sortKey, currentSort, currentDir, callback) {
    var active = currentSort === sortKey;
    var arrow = active ? (currentDir === "asc" ? " \u2191" : " \u2193") : "";
    var href = 'href="#" data-sort="' + sortKey + '"';
    return '<th scope="col"><a class="text-decoration-none text-dark" ' + href + '>' + label + arrow + "</a></th>";
  };

  /**
   * Punto único: renderiza una tabla Nexus (table-responsive + table table-sm nexus-table).
   * opts: { columns: [ { label, sortKey? } ], items: [], sortState: { sort, dir }, rowRenderer: function(item) => [ cellHtml... ], tableId?, wrapperId?, selectionColumn?: { headerCheckboxId, rowCheckboxClass, getRowId(item), getRowLabel?(item), selectedIds, allChecked } }
   */
  window.renderNexusTable = function (opts) {
    if (!opts || !opts.columns || !opts.rowRenderer) return "";
    var columns = opts.columns;
    var items = opts.items || [];
    var sortState = opts.sortState || { sort: "", dir: "asc" };
    var sel = opts.selectionColumn;
    var tableId = opts.tableId ? " id=\"" + escAttr(opts.tableId) + "\"" : "";
    var wrapperId = opts.wrapperId ? " id=\"" + escAttr(opts.wrapperId) + "\"" : "";
    var html = "<div class=\"table-responsive\"" + wrapperId + "><table class=\"table table-sm nexus-table\"" + tableId + "><thead><tr>";
    if (sel) {
      html += "<th scope=\"col\" class=\"text-center\" style=\"width:2.5rem\"><input type=\"checkbox\" class=\"form-check-input\" id=\"" + escAttr(sel.headerCheckboxId) + "\" aria-label=\"Seleccionar todos\"" + (sel.allChecked ? " checked" : "") + "></th>";
    }
    columns.forEach(function (col) {
      if (col.headerHtml != null) {
        html += "<th scope=\"col\">" + col.headerHtml + "</th>";
      } else if (col.sortKey != null) {
        html += window.sortableTh(col.label, col.sortKey, sortState.sort, sortState.dir);
      } else {
        html += "<th scope=\"col\">" + (col.label || "") + "</th>";
      }
    });
    html += "</tr></thead><tbody>";
    items.forEach(function (item) {
      html += "<tr>";
      if (sel) {
        var rowId = typeof sel.getRowId === "function" ? sel.getRowId(item) : item.id;
        var checked = sel.selectedIds && sel.selectedIds.indexOf(rowId) !== -1;
        var label = (sel.getRowLabel && sel.getRowLabel(item)) || rowId;
        html += "<td class=\"text-center\"><input type=\"checkbox\" class=\"form-check-input " + escAttr(sel.rowCheckboxClass) + "\" data-id=\"" + escAttr(rowId) + "\" aria-label=\"Seleccionar " + escAttr(String(label)) + "\"" + (checked ? " checked" : "") + "></td>";
      }
      var cells = opts.rowRenderer(item);
      if (cells && cells.length) {
        cells.forEach(function (cell) {
          html += "<td>" + (cell != null ? cell : "") + "</td>";
        });
      }
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    return html;
  };

  /**
   * Mensaje estándar para confirmar salida con cambios sin guardar.
   */
  var CONFIRM_UNSAVED_MESSAGE = "Ha realizado cambios. ¿Desea guardar los cambios antes de salir?";

  function applyModalLayer(modalEl, modalZ, backdropZ) {
    if (!modalEl) return;
    modalEl.style.zIndex = String(modalZ);
    var backdrops = document.querySelectorAll(".modal-backdrop");
    if (backdrops && backdrops.length) {
      var last = backdrops[backdrops.length - 1];
      if (last) last.style.zIndex = String(backdropZ);
    }
  }

  /**
   * Punto único: modal tipo form card (tarjeta centrada).
   * opts: { id?, title, bodyHtml, primaryButtonId?, primaryLabel?, mode?, cancelButtonId? }
   * mode: "view" = solo Cerrar | "edit" = Cancelar + Guardar | "create" = Cancelar + Crear (o primaryLabel)
   */
  window.buildNexusFormCardModal = function (opts) {
    var id = opts.id || "nexusFormCardModal";
    var title = opts.title || "";
    var bodyHtml = opts.bodyHtml || "";
    var primaryId = opts.primaryButtonId || "nexus-form-card-submit";
    var primaryLabel = opts.primaryLabel || "Guardar";
    var cancelId = opts.cancelButtonId || "nexus-form-card-cancel";
    var mode = opts.mode || "edit";
    var dialogClass = opts.modalDialogClass ? (" " + opts.modalDialogClass) : "";
    var backdrop = (mode === "edit" || mode === "create") ? " data-bs-backdrop=\"static\" data-bs-keyboard=\"false\"" : "";
    var html = '<div class="modal fade nexus-modal-manage-user" id="' + id + '" tabindex="-1" aria-labelledby="' + id + 'Label" aria-hidden="true"' + backdrop + '>';
    html += '<div class="modal-dialog modal-dialog-centered' + dialogClass + '"><div class="nexus-manage-user-card modal-content">';
    html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title" id="' + id + 'Label">' + title + '</h5><button type="button" class="btn-close nexus-form-modal-close-btn" aria-label="Cerrar" data-nexus-modal-id="' + id + '"></button></div>';
    html += '<div class="modal-body pt-2">' + bodyHtml + '</div>';
    html += '<div class="modal-footer border-0">';
    if (mode === "view") {
      html += '<button type="button" class="btn btn-nexus-primary" id="' + primaryId + '">Cerrar</button>';
    } else {
      html += '<button type="button" class="btn btn-secondary nexus-form-modal-cancel-btn" id="' + cancelId + '" data-nexus-modal-id="' + id + '">Cancelar</button>';
      html += '<button type="button" class="btn btn-nexus-primary" id="' + primaryId + '">' + primaryLabel + '</button>';
    }
    html += "</div></div></div></div>";
    return html;
  };

  /**
   * Intenta cerrar un modal; si hay cambios sin guardar, muestra confirmación.
   * @param {Object} ctx - { modalEl, getDirtyState, onSaveBeforeClose }
   * @param {Function} doClose - función que cierra el modal
   */
  window.nexusFormModalCloseAttempt = function (ctx, doClose) {
    var dirty = ctx.getDirtyState && typeof ctx.getDirtyState === "function" && ctx.getDirtyState(ctx.modalEl);
    if (!dirty) {
      doClose();
      return;
    }
    var html = '<div class="modal fade" id="nexusConfirmUnsaveModal" tabindex="-1">';
    html += '<div class="modal-dialog modal-dialog-centered"><div class="nexus-manage-user-card modal-content">';
    html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title">Cambios sin guardar</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
    html += '<div class="modal-body pt-2"><p class="nexus-text-secondary mb-0">' + CONFIRM_UNSAVED_MESSAGE + '</p></div>';
    html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" id="nexus-confirm-unsave-no">No, salir sin guardar</button><button type="button" class="btn btn-nexus-primary" id="nexus-confirm-unsave-yes">Sí, guardar</button></div>';
    html += "</div></div></div>";
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
    var confirmEl = document.getElementById("nexusConfirmUnsaveModal");
    var bsConfirm = new bootstrap.Modal(confirmEl);
    function normalizeBackdrops() {
      var shownModals = document.querySelectorAll(".modal.show").length;
      var backdrops = document.querySelectorAll(".modal-backdrop");
      var expected = shownModals > 0 ? 1 : 0;
      if (backdrops.length > expected) {
        for (var i = 0; i < backdrops.length - expected; i++) {
          if (backdrops[i] && backdrops[i].parentNode) backdrops[i].parentNode.removeChild(backdrops[i]);
        }
      }
      if (shownModals > 0) document.body.classList.add("modal-open");
      else document.body.classList.remove("modal-open");
    }
    confirmEl.addEventListener("hidden.bs.modal", function () {
      try { var i = bootstrap.Modal.getInstance(confirmEl); if (i) i.dispose(); } catch (e) {}
      if (confirmEl.parentNode) confirmEl.parentNode.removeChild(confirmEl);
      normalizeBackdrops();
    });
    confirmEl.addEventListener("shown.bs.modal", function () {
      applyModalLayer(confirmEl, 2100, 2090);
    });
    document.getElementById("nexus-confirm-unsave-no").onclick = function () {
      bsConfirm.hide();
      setTimeout(doClose, 150);
    };
    document.getElementById("nexus-confirm-unsave-yes").onclick = function () {
      if (ctx.onSaveBeforeClose && typeof ctx.onSaveBeforeClose === "function") {
        var result = ctx.onSaveBeforeClose(ctx.modalEl);
        if (result && typeof result.then === "function") {
          result.then(function (ok) {
            if (ok !== false) { bsConfirm.hide(); setTimeout(doClose, 150); }
          }).catch(function () {});
        } else if (result !== false) {
          bsConfirm.hide();
          setTimeout(doClose, 150);
        }
      } else {
        bsConfirm.hide();
        setTimeout(doClose, 150);
      }
    };
    bsConfirm.show();
  };

  /**
   * Punto único: abre un modal de formulario (form card).
   * opts: { id?, title, bodyHtml, primaryButtonId?, primaryLabel?, mode?, getDirtyState?, onSaveBeforeClose? }
   * mode: "view" = solo Cerrar | "edit" = Cancelar + Guardar | "create" = Cancelar + Crear
   * getDirtyState(modalEl): opcional, retorna true si hay cambios sin guardar.
   * onSaveBeforeClose(modalEl): opcional, guarda antes de cerrar (para confirmación). Retorna Promise o void.
   * onPrimaryClick(bsModal): para view=cierra; para edit=guarda (no cierra); para create=envía formulario.
   */
  window.openNexusFormModal = function (opts, onPrimaryClick) {
    var id = opts.id || "nexusFormCardModal";
    var mode = opts.mode || "edit";
    var existingModal = document.getElementById(id);
    if (existingModal) existingModal.remove();
    var modalHtml = window.buildNexusFormCardModal(opts);
    var wrap = document.createElement("div");
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap.firstElementChild);
    var modalEl = document.getElementById(id);
    var cancelId = opts.cancelButtonId || "nexus-form-card-cancel";
    var primaryId = opts.primaryButtonId || "nexus-form-card-submit";
    function cleanupBackdrop() {
      document.body.classList.remove("nexus-manage-user-modal-open", "modal-open");
      document.querySelectorAll(".modal-backdrop").forEach(function (el) { el.remove(); });
    }
    function doClose() {
      bsModal.hide();
    }
    var ctx = {
      modalEl: modalEl,
      getDirtyState: opts.getDirtyState,
      onSaveBeforeClose: opts.onSaveBeforeClose
    };
    modalEl.addEventListener("shown.bs.modal", function () {
      document.body.classList.add("nexus-manage-user-modal-open");
      ctx.modalEl = modalEl;
      ctx.bsModal = bsModal;
      applyModalLayer(modalEl, 2055, 2050);
    });
    modalEl.addEventListener("hidden.bs.modal", function () {
      cleanupBackdrop();
      try { var inst = bootstrap.Modal.getInstance(modalEl); if (inst) inst.dispose(); } catch (e) {}
      if (modalEl.parentNode) modalEl.remove();
    });
    var bsModal = new bootstrap.Modal(modalEl);
    ctx.bsModal = bsModal;
    document.getElementById(primaryId).onclick = function () {
      if (mode === "view") {
        doClose();
      } else {
        onPrimaryClick(bsModal);
      }
    };
    if (mode === "view") {
      var closeBtnView = modalEl.querySelector(".nexus-form-modal-close-btn");
      if (closeBtnView) closeBtnView.onclick = function () { doClose(); };
    } else {
      var cancelBtn = document.getElementById(cancelId);
      if (cancelBtn) cancelBtn.onclick = function () { window.nexusFormModalCloseAttempt(ctx, doClose); };
      var closeBtn = modalEl.querySelector(".nexus-form-modal-close-btn");
      if (closeBtn) closeBtn.onclick = function () { window.nexusFormModalCloseAttempt(ctx, doClose); };
      modalEl.addEventListener("hidePrevented.bs.modal", function () {
        // Ejecutar en el siguiente tick evita que Bootstrap ignore el hide()
        // cuando el intento de cierre viene del backdrop estatico.
        setTimeout(function () {
          window.nexusFormModalCloseAttempt(ctx, doClose);
        }, 0);
      });
    }
    bsModal.show();
  };

  /**
   * Punto único: modal de confirmación (mensaje + Cancelar + botón principal). onConfirm(closeModal, showError).
   */
  window.openNexusConfirmModal = function (opts, onConfirm) {
    var id = opts.id || "nexusConfirmModal";
    var title = opts.title || "Confirmar";
    var message = opts.message || "";
    var primaryLabel = opts.primaryLabel || "Aceptar";
    var primaryDanger = opts.primaryDanger === true;
    var errId = id + "-error";
    var bodyHtml = '<p class="nexus-text-secondary mb-0">' + message + '</p><div id="' + errId + '" class="alert alert-danger d-none mt-2"></div>';
    var html = '<div class="modal fade nexus-modal-manage-user" id="' + id + '" tabindex="-1">';
    html += '<div class="modal-dialog modal-dialog-centered"><div class="nexus-manage-user-card modal-content">';
    html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title">' + title + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
    html += '<div class="modal-body pt-2">' + bodyHtml + '</div>';
    html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn ' + (primaryDanger ? "btn-danger" : "btn-nexus-primary") + '" id="' + id + '-btn">' + primaryLabel + '</button></div>';
    html += "</div></div></div>";
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
    var modalEl = document.getElementById(id);
    var errEl = document.getElementById(errId);
    function cleanupBackdropConfirm() {
      document.body.classList.remove("nexus-manage-user-modal-open", "modal-open");
      document.querySelectorAll(".modal-backdrop").forEach(function (el) { el.remove(); });
    }
    modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
    modalEl.addEventListener("shown.bs.modal", function () { applyModalLayer(modalEl, 2100, 2090); });
    modalEl.addEventListener("hidden.bs.modal", function () {
      cleanupBackdropConfirm();
      try { var inst = bootstrap.Modal.getInstance(modalEl); if (inst) inst.dispose(); } catch (e) {}
      if (modalEl.parentNode) modalEl.remove();
    });
    var bsModal = new bootstrap.Modal(modalEl);
    document.getElementById(id + "-btn").onclick = function () {
      onConfirm(function () { bsModal.hide(); }, function (msg) { if (errEl) { errEl.textContent = msg; errEl.classList.remove("d-none"); } });
    };
    bsModal.show();
  };

  /**
   * Punto único: modal de aviso (solo mensaje + Cerrar).
   */
  window.openNexusAlertModal = function (opts) {
    var id = opts.id || "nexusAlertModal";
    var title = opts.title || "Aviso";
    var message = opts.message || "";
    var html = '<div class="modal fade nexus-modal-manage-user" id="' + id + '" tabindex="-1">';
    html += '<div class="modal-dialog modal-dialog-centered"><div class="nexus-manage-user-card modal-content">';
    html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title">' + title + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
    html += '<div class="modal-body pt-2"><p class="nexus-text-secondary mb-0">' + message + '</p></div>';
    html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div>';
    html += "</div></div></div>";
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
    var modalEl = document.getElementById(id);
    function cleanupBackdropAlert() {
      document.body.classList.remove("nexus-manage-user-modal-open", "modal-open");
      document.querySelectorAll(".modal-backdrop").forEach(function (el) { el.remove(); });
    }
    modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
    modalEl.addEventListener("shown.bs.modal", function () { applyModalLayer(modalEl, 2100, 2090); });
    modalEl.addEventListener("hidden.bs.modal", function () {
      cleanupBackdropAlert();
      try { var inst = bootstrap.Modal.getInstance(modalEl); if (inst) inst.dispose(); } catch (e) {}
      if (modalEl.parentNode) modalEl.remove();
    });
    var bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  };

  /** Escapar HTML para atributos/texto. */
  function escAttr(s) {
    if (s == null) return "";
    var t = String(s);
    return t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /**
   * Acciones de tabla: grupo de botones Ver (verde) | Editar (azul) | Eliminar (rojo).
   * opts: { otherFirst?, view?, edit?, archive?, delete?, other? }
   * Orden: otherFirst..., view, edit, archive, delete, other...
   */
  window.renderTableActions = function (opts) {
    if (!opts) return "";
    var html = '<div class="nexus-table-actions">';
    if (opts.otherFirst && opts.otherFirst.length) {
      opts.otherFirst.forEach(function (o) {
        var cls = "nexus-action-other" + (o.className ? " " + o.className : "");
        var label = escAttr(o.label || "");
        if (o.href) html += '<a href="' + escAttr(o.href) + '" class="' + cls + '">' + label + "</a>";
        else html += '<a href="#" class="' + cls + '" data-id="' + escAttr(o.id) + '">' + label + "</a>";
      });
    }
    if (opts.view && opts.view.href) {
      var viewLabel = escAttr(opts.view.label || "Ver");
      var viewAria = opts.view.ariaLabel ? ' aria-label="' + escAttr(opts.view.ariaLabel) + '"' : "";
      html += '<a href="' + escAttr(opts.view.href) + '" class="nexus-action-view"' + viewAria + '>' + viewLabel + "</a>";
    }
    if (opts.edit) {
      var e = opts.edit;
      var label = escAttr(e.label || "Editar");
      var cls = "nexus-action-edit" + (e.className ? " " + e.className : "");
      if (e.href) html += '<a href="' + escAttr(e.href) + '" class="' + cls + '">' + label + "</a>";
      else html += '<a href="#" class="' + cls + '" data-id="' + escAttr(e.id) + '">' + label + "</a>";
    }
    if (opts.archive) {
      var a = opts.archive;
      var archiveClass = "nexus-action-archive" + (a.className ? " " + a.className : "");
      var archiveLabel = escAttr(a.label || "Archivar");
      if (a.href) html += '<a href="' + escAttr(a.href) + '" class="' + archiveClass + '">' + archiveLabel + "</a>";
      else if (a.id != null) html += '<a href="#" class="' + archiveClass + '" data-id="' + escAttr(a.id) + '">' + archiveLabel + "</a>";
    }
    if (opts.delete && opts.delete.id != null) {
      var d = opts.delete;
      html += '<a href="#" class="nexus-action-delete' + (d.className ? " " + d.className : "") + '" data-id="' + escAttr(d.id) + '">' + escAttr(d.label || "Eliminar") + "</a>";
    }
    if (opts.other && opts.other.length) {
      opts.other.forEach(function (o) {
        var cls = "nexus-action-other" + (o.className ? " " + o.className : "");
        var label = escAttr(o.label || "");
        if (o.href) html += '<a href="' + escAttr(o.href) + '" class="' + cls + '">' + label + "</a>";
        else html += '<a href="#" class="' + cls + '" data-id="' + escAttr(o.id) + '">' + label + "</a>";
      });
    }
    html += "</div>";
    return html;
  };
})();
