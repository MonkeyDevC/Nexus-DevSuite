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
   * Punto único: modal tipo form card (tarjeta centrada, mismo estilo que Editar usuario / Crear proyecto).
   * opts: { id?, title, bodyHtml, primaryButtonId?, primaryLabel? }
   */
  window.buildNexusFormCardModal = function (opts) {
    var id = opts.id || "nexusFormCardModal";
    var title = opts.title || "";
    var bodyHtml = opts.bodyHtml || "";
    var primaryId = opts.primaryButtonId || "nexus-form-card-submit";
    var primaryLabel = opts.primaryLabel || "Guardar";
    var dialogClass = opts.modalDialogClass ? (" " + opts.modalDialogClass) : "";
    var html = '<div class="modal fade nexus-modal-manage-user" id="' + id + '" tabindex="-1" aria-labelledby="' + id + 'Label" aria-hidden="true">';
    html += '<div class="modal-dialog modal-dialog-centered' + dialogClass + '"><div class="nexus-manage-user-card modal-content">';
    html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title" id="' + id + 'Label">' + title + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
    html += '<div class="modal-body pt-2">' + bodyHtml + '</div>';
    html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-nexus-primary" id="' + primaryId + '">' + primaryLabel + '</button></div>';
    html += "</div></div></div>";
    return html;
  };

  /**
   * Punto único: abre un modal de formulario (form card), lo muestra y enlaza el botón principal.
   * opts: mismo que buildNexusFormCardModal. onPrimaryClick(bsModal) se llama al pulsar el botón; el cierre y limpieza del DOM se hace en hidden.bs.modal.
   */
  window.openNexusFormModal = function (opts, onPrimaryClick) {
    var id = opts.id || "nexusFormCardModal";
    var modalHtml = window.buildNexusFormCardModal(opts);
    var wrap = document.createElement("div");
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap.firstElementChild);
    var modalEl = document.getElementById(id);
    function cleanupBackdrop() {
      document.body.classList.remove("nexus-manage-user-modal-open", "modal-open");
      document.querySelectorAll(".modal-backdrop").forEach(function (el) { el.remove(); });
    }
    modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
    modalEl.addEventListener("hidden.bs.modal", function () {
      cleanupBackdrop();
      try { var inst = bootstrap.Modal.getInstance(modalEl); if (inst) inst.dispose(); } catch (e) {}
      if (modalEl.parentNode) modalEl.remove();
    });
    var bsModal = new bootstrap.Modal(modalEl);
    var primaryId = opts.primaryButtonId || "nexus-form-card-submit";
    document.getElementById(primaryId).onclick = function () { onPrimaryClick(bsModal); };
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
      html += '<a href="' + escAttr(opts.view.href) + '" class="nexus-action-view">' + escAttr(opts.view.label || "Ver") + "</a>";
    }
    if (opts.edit) {
      var e = opts.edit;
      var label = escAttr(e.label || "Editar");
      var cls = "nexus-action-edit" + (e.className ? " " + e.className : "");
      if (e.href) html += '<a href="' + escAttr(e.href) + '" class="' + cls + '">' + label + "</a>";
      else html += '<a href="#" class="' + cls + '" data-id="' + escAttr(e.id) + '">' + label + "</a>";
    }
    if (opts.archive && opts.archive.href) {
      html += '<a href="' + escAttr(opts.archive.href) + '" class="nexus-action-archive">' + escAttr(opts.archive.label || "Archivar") + "</a>";
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
