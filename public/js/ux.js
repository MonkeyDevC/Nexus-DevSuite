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
})();
