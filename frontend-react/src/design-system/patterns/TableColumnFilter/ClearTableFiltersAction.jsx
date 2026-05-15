/**
 * Acción global para limpiar filtros de columnas (no incluye búsqueda salvo que el padre lo haga).
 * @param {object} props
 * @param {boolean} props.hasActiveFilters
 * @param {() => void} props.onClear
 * @param {string} [props.label]
 * @param {string} [props.testId]
 */
export function ClearTableFiltersAction({
  hasActiveFilters,
  onClear,
  label = "Limpiar filtros",
  testId = "table-clear-column-filters",
}) {
  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm"
      disabled={!hasActiveFilters}
      onClick={onClear}
      data-testid={testId}
    >
      {label}
    </button>
  );
}
