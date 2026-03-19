/**
 * Componente reutilizable: selector "Ver por página" para listados con paginación.
 * Uso: incluir HTML con renderPageSizeSelector() y en bind() asignar onchange al select
 * para actualizar state.limit, state.page = 1 y recargar datos.
 */
(function () {
  var DEFAULT_OPTIONS = [10, 25, 50];

  /**
   * @param {{ selectId: string, currentLimit: number, options?: number[], labelText?: string, ariaLabel?: string }} opts
   * @returns {string} HTML del label + select
   */
  window.renderPageSizeSelector = function (opts) {
    var selectId = opts.selectId || "page-size-select";
    var currentLimit = opts.currentLimit != null ? opts.currentLimit : 10;
    var options = opts.options || DEFAULT_OPTIONS;
    var labelText = opts.labelText != null ? opts.labelText : "Ver por página";
    var ariaLabel = opts.ariaLabel != null ? opts.ariaLabel : "Filas por página";
    var html = '<label class="mb-0"><span class="nexus-text-sm">' + (labelText.replace(/</g, "&lt;")) + '</span> ';
    html += '<select id="' + selectId.replace(/"/g, "&quot;") + '" class="form-select form-select-sm d-inline-block nexus-page-size-select" style="width:auto;min-width:64px" aria-label="' + (ariaLabel.replace(/"/g, "&quot;")) + '">';
    options.forEach(function (n) {
      html += '<option value="' + n + '"' + (currentLimit === n ? ' selected' : '') + '>' + n + '</option>';
    });
    html += '</select></label>';
    return html;
  };
})();
