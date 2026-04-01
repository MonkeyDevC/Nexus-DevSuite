import styles from "./DataTable.module.css";

/**
 * Tabla de datos estilo admin (tokens DS). Sin Bootstrap.
 * @param {{ key: string, label: string, align?: "start"|"end"|"center" }[]} props.columns
 * @param {Record<string, unknown>[]} props.rows
 * @param {(args: { column: object, row: object, rowIndex: number, value: unknown }) => import("react").ReactNode} [props.renderCell]
 * @param {(row: object, rowIndex: number) => string|number} [props.getRowKey]
 * @param {import("react").ReactNode} [props.emptyContent]
 * @param {boolean} [props.dense]
 * @param {import("react").ReactNode} [props.toolbarStart]
 * @param {import("react").ReactNode} [props.toolbarEnd]
 * @param {string} [props.caption]
 * @param {(args: { column: object }) => import("react").ReactNode} [props.renderHeaderCell]
 */
export function DataTable({
  columns = [],
  rows = [],
  renderCell,
  renderHeaderCell,
  getRowKey,
  emptyContent,
  dense = false,
  toolbarStart,
  toolbarEnd,
  caption,
  className = "",
  wrapClassName = "",
  ...rest
}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const hasToolbar = toolbarStart != null || toolbarEnd != null;

  function cellAlign(align) {
    if (align === "end") return styles.tdEnd;
    if (align === "center") return styles.tdCenter;
    if (align === "start") return styles.tdStart;
    return "";
  }

  function headAlign(align) {
    if (align === "end") return styles.thEnd;
    if (align === "center") return styles.thCenter;
    if (align === "start") return styles.thStart;
    return "";
  }

  const tableClasses = [styles.table, dense ? styles.dense : ""].filter(Boolean).join(" ");

  const inner = (
    <div className={[styles.wrap, wrapClassName].filter(Boolean).join(" ")}>
      <table className={tableClasses}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead className={styles.thead}>
          <tr>
            {safeColumns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={[styles.th, headAlign(c.align)].filter(Boolean).join(" ")}
              >
                {typeof renderHeaderCell === "function" ? renderHeaderCell({ column: c }) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {safeRows.length === 0 ? (
            <tr className={styles.emptyRow}>
              <td colSpan={Math.max(safeColumns.length, 1)} className={styles.td}>
                {emptyContent ?? "Sin filas para mostrar."}
              </td>
            </tr>
          ) : (
            safeRows.map((row, rowIndex) => {
              const key = getRowKey ? getRowKey(row, rowIndex) : row?.id ?? rowIndex;
              return (
                <tr key={key} className={styles.tr}>
                  {safeColumns.map((c) => {
                    const value = row && c.key ? row[c.key] : undefined;
                    const content =
                      typeof renderCell === "function"
                        ? renderCell({ column: c, row, rowIndex, value })
                        : value ?? "—";
                    return (
                      <td
                        key={c.key}
                        className={[styles.td, cellAlign(c.align)].filter(Boolean).join(" ")}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  if (!hasToolbar) {
    return (
      <div className={className} {...rest}>
        {inner}
      </div>
    );
  }

  return (
    <div className={className} {...rest}>
      <div className={styles.toolbar}>
        <div>{toolbarStart}</div>
        <div>{toolbarEnd}</div>
      </div>
      {inner}
    </div>
  );
}
