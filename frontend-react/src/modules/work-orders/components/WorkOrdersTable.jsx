import WorkOrderRow from "./WorkOrderRow.jsx";
import styles from "./WorkOrdersTable.module.css";

/**
 * @param {{
 *   rows: object[],
 *   assigneeResolver: (userId: string) => { label: string, initials: string },
 *   onRowOpen: (id: string) => void,
 * }} props
 */
export default function WorkOrdersTable({ rows, assigneeResolver, onRowOpen }) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>ID</th>
            <th className={styles.th}>Tipo</th>
            <th className={styles.th}>Título</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th}>Responsable</th>
            <th className={styles.th}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const a = assigneeResolver(row.assigned_to_user_id);
            return (
              <WorkOrderRow
                key={row.id}
                row={row}
                assigneeLabel={a.label}
                assigneeInitials={a.initials}
                onActivate={() => onRowOpen(row.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
