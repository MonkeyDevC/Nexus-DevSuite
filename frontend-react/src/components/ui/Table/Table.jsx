/**
 * ----
 * Modulo: Table
 * Descripcion: Tabla reutilizable basada en Bootstrap. UI pura por props; sin logica de dominio.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */

export default function Table({
  columns = [],
  data = [],
  renderCell,
  wrapperClassName = "",
  tableClassName = "",
}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeData = Array.isArray(data) ? data : [];
  const hasColumns = safeColumns.length > 0;

  const wrapCls = wrapperClassName || "table-responsive";
  const tblCls = tableClassName || "table table-striped table-hover align-middle mb-0";

  return (
    <div className={wrapCls}>
      <table className={tblCls}>
        <thead>
          <tr>
            {hasColumns ? safeColumns.map((c) => (
              <th key={c.key || c.label} scope="col">
                {c.label}
              </th>
            )) : <th scope="col">Items</th>}
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={hasColumns ? safeColumns.length : 1} className="text-muted">
                No data available
              </td>
            </tr>
          ) : (
            safeData.map((row, rowIndex) => (
              <tr key={(row && row.id) || rowIndex}>
                {safeColumns.map((c) => {
                  const value = row && c && c.key ? row[c.key] : undefined;
                  const content =
                    typeof renderCell === "function"
                      ? renderCell({ column: c, row, rowIndex, value })
                      : value ?? "—";
                  return <td key={c.key || c.label}>{content}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

