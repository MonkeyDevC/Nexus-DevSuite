import styles from "./ReportLayout.module.css";

/**
 * Esqueleto para vistas de reporte: filtros, resumen/KPI, gráfico, tabla.
 */
export function ReportLayout({
  filters,
  summary,
  chart,
  table,
  className = "",
  ...rest
}) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      {filters ? <div className={styles.filters}>{filters}</div> : null}
      {summary ? <div className={styles.summary}>{summary}</div> : null}
      {chart ? <div className={styles.chart}>{chart}</div> : null}
      {table ? <div className={styles.table}>{table}</div> : null}
    </div>
  );
}
