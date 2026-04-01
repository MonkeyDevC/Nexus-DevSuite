import { Badge } from "../../design-system/components/Badge/Badge.jsx";
import { mapStoryStatusToDsBadgeVariant } from "../../pages/wave1DsMappers.js";
import styles from "./BacklogFeaturesTable.module.css";

function storyCode(row) {
  const n = row.number != null && Number.isFinite(Number(row.number)) ? Number(row.number) : null;
  if (n != null) return `US${n}`;
  const id = row.id != null ? String(row.id) : "";
  return id ? id.slice(0, 8) : "—";
}

export default function BacklogStoriesTable({ rows, onOpenStory, interactionDisabled = false }) {
  if (!rows.length) {
    return <p className={styles.empty}>No hay historias que coincidan.</p>;
  }

  return (
    <div className={styles.wrap} data-testid="feature-overlay-backlog-stories-table">
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Código</th>
            <th className={styles.th}>Título</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th}>Prioridad</th>
            <th className={styles.th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const sid = row.id != null ? String(row.id) : "";
            const title = typeof row.title === "string" && row.title.trim() !== "" ? row.title.trim() : "—";
            const status = row.status != null ? String(row.status) : "—";
            const priority = row.priority != null ? String(row.priority) : "—";
            return (
              <tr key={sid || title} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.code}>{storyCode(row)}</span>
                </td>
                <td className={styles.td}>{title}</td>
                <td className={styles.td}>
                  <Badge variant={mapStoryStatusToDsBadgeVariant(status)}>{status}</Badge>
                </td>
                <td className={styles.td}>{priority}</td>
                <td className={styles.td} style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className={styles.cellBtn}
                    onClick={() => sid && onOpenStory(sid)}
                    disabled={interactionDisabled || !sid}
                    data-testid={`feature-overlay-open-story-${sid.slice(0, 8)}`}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
