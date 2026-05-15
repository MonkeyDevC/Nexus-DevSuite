import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Select } from "../../../../design-system/components/Select/Select.jsx";
import styles from "./BacklogFeaturesToolbar.module.css";

const DEFAULT_FEATURE_STATUS_OPTIONS = ["BACKLOG", "READY", "IN_PROGRESS", "DONE", "CANCELLED"];

export default function BacklogFeaturesToolbar({
  kicker = "Backlog",
  subtitle = "Features del proyecto",
  searchPlaceholder = "Buscar features (Título, Código)…",
  toolbarTestId = "project-backlog-toolbar",
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions = DEFAULT_FEATURE_STATUS_OPTIONS,
  priorityFilter = "",
  onPriorityFilterChange,
  priorityOptions = [],
  onRefresh,
  refreshButtonTestId = "project-backlog-refresh",
  onCreateFeature,
  onCreate,
  createButtonLabel = "+ Nueva Feature",
  createButtonTestId = "project-backlog-create-feature",
  loading = false,
}) {
  const createHandler = typeof onCreate === "function" ? onCreate : onCreateFeature;
  const statusList = Array.isArray(statusOptions) && statusOptions.length > 0 ? statusOptions : DEFAULT_FEATURE_STATUS_OPTIONS;

  return (
    <div className={styles.wrap} data-testid={toolbarTestId}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <div className={styles.kicker}>{kicker}</div>
          <div className={styles.subtitle}>{subtitle}</div>
        </div>
        {typeof createHandler === "function" ? (
          <Button
            type="button"
            variant="primary"
            onClick={createHandler}
            disabled={loading}
            data-testid={createButtonTestId}
          >
            {createButtonLabel}
          </Button>
        ) : null}
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchCol}>
          <Input
            label="Buscar"
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div className={styles.filterCol}>
          <Select label="Estado" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} disabled={loading}>
            <option value="">Todos</option>
            {statusList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
            data-testid={refreshButtonTestId}
          >
            Actualizar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
