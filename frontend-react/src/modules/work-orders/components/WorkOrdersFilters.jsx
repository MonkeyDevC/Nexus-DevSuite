import styles from "./WorkOrdersFilters.module.css";
import {
  WORK_ORDER_KIND,
  WORK_ORDER_KIND_UI_LABEL,
  WORK_ORDER_STATUS,
  WORK_ORDER_STATUS_LABEL,
} from "../utils/workOrders.constants.js";

/**
 * @param {{
 *   search: string,
 *   onSearchChange: (v: string) => void,
 *   kindFilter: string,
 *   onKindFilterChange: (v: string) => void,
 *   statusFilter: string,
 *   onStatusFilterChange: (v: string) => void,
 * }} props
 */
export default function WorkOrdersFilters({
  search,
  onSearchChange,
  kindFilter,
  onKindFilterChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className={styles.bar} data-testid="work-orders-filters">
      <label className={styles.searchLabel}>
        <span className={styles.visuallyHidden}>Buscar</span>
        <input
          type="search"
          className={styles.search}
          placeholder="Buscar por ID o título…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </label>
      <select className={styles.select} value={kindFilter} onChange={(e) => onKindFilterChange(e.target.value)} aria-label="Tipo de orden">
        <option value="all">Tipo: todos</option>
        <option value={WORK_ORDER_KIND.WORK}>{WORK_ORDER_KIND_UI_LABEL.WORK}</option>
        <option value={WORK_ORDER_KIND.REWORK}>{WORK_ORDER_KIND_UI_LABEL.REWORK}</option>
      </select>
      <select
        className={styles.select}
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        aria-label="Estado"
      >
        <option value="all">Estado: todos</option>
        <option value={WORK_ORDER_STATUS.PENDING}>{WORK_ORDER_STATUS_LABEL.PENDING}</option>
        <option value={WORK_ORDER_STATUS.IN_PROGRESS}>{WORK_ORDER_STATUS_LABEL.IN_PROGRESS}</option>
        <option value={WORK_ORDER_STATUS.IN_REVIEW}>{WORK_ORDER_STATUS_LABEL.IN_REVIEW}</option>
        <option value={WORK_ORDER_STATUS.DONE}>{WORK_ORDER_STATUS_LABEL.DONE}</option>
      </select>
    </div>
  );
}
