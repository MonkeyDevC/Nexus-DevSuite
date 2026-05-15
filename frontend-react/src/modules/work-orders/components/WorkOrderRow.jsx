import WorkOrderTypeBadge from "./WorkOrderTypeBadge.jsx";
import WorkOrderStatusBadge from "./WorkOrderStatusBadge.jsx";
import { formatWorkOrderDisplayId } from "../utils/workOrders.mapper.js";
import styles from "./WorkOrderRow.module.css";

function formatWorkOrderWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

/**
 * @param {{
 *   row: object,
 *   assigneeLabel: string,
 *   assigneeInitials: string,
 *   onActivate: () => void,
 * }} props
 */
export default function WorkOrderRow({ row, assigneeLabel, assigneeInitials, onActivate }) {
  const displayId = formatWorkOrderDisplayId(row);

  return (
    <tr
      className={styles.row}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      tabIndex={0}
      role="button"
      data-testid={`work-order-row-${row.id}`}
    >
      <td className={styles.cellMono}>{displayId}</td>
      <td>
        <WorkOrderTypeBadge kind={row.kind} />
      </td>
      <td className={styles.cellTitle}>{row.title || "—"}</td>
      <td>
        <WorkOrderStatusBadge status={row.status} />
      </td>
      <td>
        {assigneeInitials ? (
          <span className={styles.avatar} title={assigneeLabel || ""}>
            {assigneeInitials}
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        )}
      </td>
      <td className={styles.cellMuted}>{formatWorkOrderWhen(row.updated_at || row.created_at)}</td>
    </tr>
  );
}
