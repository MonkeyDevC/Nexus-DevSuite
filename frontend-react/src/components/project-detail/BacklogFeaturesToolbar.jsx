import { Button } from "../../design-system/components/Button/Button.jsx";
import { Input } from "../../design-system/components/Input/Input.jsx";
import { Select } from "../../design-system/components/Select/Select.jsx";
import styles from "./BacklogFeaturesToolbar.module.css";

export default function BacklogFeaturesToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  priorityOptions = [],
  onRefresh,
  onCreateFeature,
  loading = false,
}) {
  return (
    <div className={styles.wrap} data-testid="project-backlog-toolbar">
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <div className={styles.kicker}>Backlog</div>
          <div className={styles.subtitle}>Features del proyecto</div>
        </div>
        {typeof onCreateFeature === "function" ? (
          <Button type="button" variant="primary" onClick={onCreateFeature} disabled={loading} data-testid="project-backlog-create-feature">
            + Nueva Feature
          </Button>
        ) : null}
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchCol}>
          <Input
            label="Buscar"
            type="search"
            placeholder="Buscar features (Título, Código)…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div className={styles.filterCol}>
          <Select label="Estado" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} disabled={loading}>
            <option value="">Todos</option>
            <option value="BACKLOG">BACKLOG</option>
            <option value="READY">READY</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
        </div>

        <div className={styles.filterCol}>
          <Select
            label="Prioridad"
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            disabled={loading}
          >
            <option value="">Todos</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.filterCol}>
          <Select label="Esfuerzo (Puntos)" value="" onChange={() => {}} disabled title="GAP: puntos no disponibles en datos actuales">
            <option value="">Todos</option>
          </Select>
        </div>

        <div className={styles.actionsCol}>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            data-testid="project-backlog-refresh"
          >
            Actualizar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
