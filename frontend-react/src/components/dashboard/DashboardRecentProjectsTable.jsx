/**
 * Tabla compacta de proyectos recientes — mismo “table island” y estilos que Projects (TableProjects).
 */
import { useMemo } from "react";
import { Badge } from "../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../design-system/components/Button/Button.jsx";
import { DataTable } from "../../design-system/patterns/DataTable/DataTable.jsx";
import tableStyles from "../projects/TableProjects.module.css";

function IconCalendar() {
  return (
    <svg className={tableStyles.inlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function mapStatusVariant(status) {
  if (status === "ACTIVE") return "success";
  if (status === "ARCHIVED") return "neutral";
  return "warning";
}

function displayNumber(row) {
  const n = row?.number;
  if (typeof n === "number" && Number.isFinite(n)) return String(n);
  return "—";
}

const COLUMNS = [
  { key: "number", label: "#", align: "center" },
  { key: "name", label: "Proyecto" },
  { key: "status", label: "Estado", align: "center" },
  { key: "current_sprint", label: "Sprint actual", align: "start" },
  { key: "progress_pct", label: "Progreso", align: "end" },
];

/**
 * @param {object[]} props.rows — hasta 5 filas con id, number, name, status, sprintLabel, progressNumeric
 * @param {(id: string) => void} props.onOpen
 */
export default function DashboardRecentProjectsTable({ rows = [], onOpen }) {
  const tableRows = useMemo(
    () =>
      (Array.isArray(rows) ? rows : []).map((r) => ({
        id: r.id,
        number: r.number,
        name: r.name,
        status: r.status,
        current_sprint:
          r.sprintLabel && String(r.sprintLabel).trim() !== "" && r.sprintLabel !== "—"
            ? { name: String(r.sprintLabel) }
            : null,
        progress_pct: Math.min(100, Math.max(0, Number(r.progressNumeric) || 0)),
      })),
    [rows],
  );

  return (
    <div className={tableStyles.tableIsland} data-testid="dashboard-recent-projects-table">
      <DataTable
        dense
        className={tableStyles.dataTableRoot}
        wrapClassName={tableStyles.dataTableWrap}
        caption={`Proyectos · ${tableRows.length} fila(s)`}
        columns={COLUMNS}
        rows={tableRows}
        getRowKey={(row) => String(row.id)}
        emptyContent="No hay proyectos recientes."
        renderCell={({ column, row, value }) => {
          if (column.key === "number") {
            return displayNumber(row);
          }
          if (column.key === "name") {
            return (
              <Button
                variant="link"
                type="button"
                className={tableStyles.nameLink}
                onClick={() => row.id && onOpen?.(row.id)}
              >
                {value || "—"}
              </Button>
            );
          }
          if (column.key === "status") {
            return (
              <Badge variant={mapStatusVariant(value)} appearance="light">
                {String(value || "UNKNOWN")}
              </Badge>
            );
          }
          if (column.key === "current_sprint") {
            const sp = row.current_sprint;
            if (!sp || !sp.name) return "—";
            return (
              <div className={tableStyles.cellWithIcon}>
                <span className={tableStyles.cellIcon} aria-hidden>
                  <IconCalendar />
                </span>
                <span>{sp.name}</span>
              </div>
            );
          }
          if (column.key === "progress_pct") {
            const pct = Math.min(100, Math.max(0, Number(row.progress_pct) || 0));
            return (
              <div className={tableStyles.progressWrap}>
                <div
                  className={tableStyles.progressTrack}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso ${pct} por ciento`}
                >
                  <div className={tableStyles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={tableStyles.progressLabel}>{pct}%</span>
              </div>
            );
          }
          return value ?? "—";
        }}
      />
    </div>
  );
}
