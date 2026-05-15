/**
 * Listado de user stories por feature — mismo panel visual que TableFeatures (tabs, búsqueda, tabla, paginación).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../../auth/authorization.js";
import { useAuth } from "../../../../app/context/AuthContext.jsx";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { DataTable } from "../../../../design-system/patterns/DataTable/DataTable.jsx";
import { formatRelativeTimeEs } from "../../../../utils/formatRelativeTimeEs.js";
import { mapStoryPriorityToDsBadgeVariant, mapStoryStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import * as storiesService from "../../storiesService.js";
import { presentationForStoryError } from "../../errorPresentation.js";
import TableFilterSelect from "../../../projects/components/tables/TableFilterSelect.jsx";
import styles from "../../../projects/components/tables/TableProjects.module.css";
import { formatStoryListLabel } from "../../../../shared/workspace/workItemHumanIds.js";

function IconEye() {
  return (
    <svg className={styles.actionIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg className={styles.actionIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg className={styles.actionIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className={styles.actionIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
    </svg>
  );
}

function IconSprint() {
  return (
    <svg className={styles.inlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function formatDate(value) {
  if (value == null || value === "") return "—";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function displayNumber(row) {
  const n = row?.number;
  if (typeof n === "number" && Number.isFinite(n)) return String(n);
  return "—";
}

/** Texto de fila: US-{n} — título (sin duplicar prefijos en el título persistido). */
function displayStoryLabel(row) {
  if (!row) return "";
  return formatStoryListLabel(row.number, row.title != null ? String(row.title) : "");
}

function workflowProgressPct(status) {
  const s = String(status || "").toUpperCase();
  if (s === "DONE") return 100;
  if (s === "IN_REVIEW") return 85;
  if (s === "IN_PROGRESS") return 55;
  if (s === "BLOCKED") return 40;
  if (s === "READY") return 25;
  if (s === "ARCHIVED") return 0;
  return 12;
}

/** Celda "Sprint / Pts": sprint real o —; puntos reales o — */
function formatSprintAndPointsCell(row) {
  if (!row) return { sprintLabel: "—", ptsLabel: "—" };
  const sid = row.sprint_id != null && String(row.sprint_id).trim() !== "" ? String(row.sprint_id).trim() : "";
  const name = row.sprint_name != null ? String(row.sprint_name).trim() : "";
  const sprintLabel = sid ? name || `Sprint (${sid.slice(0, 8)}…)` : "—";
  const sp = row.story_points;
  const ptsLabel =
    sp != null && sp !== "" && Number.isFinite(Number(sp)) ? `${Number(sp)} pts` : "—";
  return { sprintLabel, ptsLabel };
}

const COLUMNS_DATA = [
  { key: "number", label: "#", align: "center" },
  { key: "title", label: "Historia", align: "start" },
  { key: "status", label: "Estado", align: "center" },
  { key: "priority", label: "Prioridad", align: "center" },
  { key: "created_at", label: "Creado" },
  { key: "sprint_info", label: "Sprint / Pts", align: "start" },
  { key: "progress_pct", label: "Progreso", align: "end" },
  { key: "updated_at", label: "Última actualización", align: "start" },
  { key: "__actions", label: "Acciones", align: "end" },
];

const PAGE_SIZES = [5, 10, 25, 50];

const SORT_FIELD_OPTIONS = [
  { value: "updated_at", label: "Última actualización" },
  { value: "created_at", label: "Fecha creación" },
  { value: "title", label: "Título" },
  { value: "status", label: "Estado" },
  { value: "priority", label: "Prioridad" },
  { value: "story_points", label: "Story points" },
];

const EMPTY_CONFIRM_DIALOG = {
  open: false,
  tone: "error",
  title: "",
  description: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  confirmVariant: "danger",
  onConfirm: null,
};

function tabDefs() {
  return [
    { id: "all", label: "Todos", pillClass: styles.pillAll },
    { id: "active", label: "Activas", pillClass: styles.pillSuccess },
    { id: "ARCHIVED", label: "Archivados", pillClass: styles.pillNeutral },
  ];
}

function matchesStatusTab(row, tabId) {
  if (tabId === "all") return true;
  if (tabId === "active") return row.status !== "ARCHIVED";
  if (tabId === "ARCHIVED") return row.status === "ARCHIVED";
  return true;
}

function sortRows(rows, sortField, sortDir) {
  const mult = sortDir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortField === "title") {
      const at = (a.title != null ? String(a.title) : "").trim().toLowerCase();
      const bt = (b.title != null ? String(b.title) : "").trim().toLowerCase();
      return mult * at.localeCompare(bt, "es");
    }
    if (sortField === "status" || sortField === "priority") {
      const as = String(a[sortField] || "").toLowerCase();
      const bs = String(b[sortField] || "").toLowerCase();
      return mult * as.localeCompare(bs, "es");
    }
    if (sortField === "story_points") {
      const na = Number(a.story_points);
      const nb = Number(b.story_points);
      const va = Number.isFinite(na) ? na : -1;
      const vb = Number.isFinite(nb) ? nb : -1;
      return mult * (va - vb);
    }
    if (sortField === "progress_pct") {
      const na = workflowProgressPct(a.status);
      const nb = workflowProgressPct(b.status);
      return mult * (na - nb);
    }
    const da = a[sortField] ? new Date(a[sortField]).getTime() : 0;
    const db = b[sortField] ? new Date(b[sortField]).getTime() : 0;
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return mult;
    if (Number.isNaN(db)) return -mult;
    return mult * (da - db);
  });
  return copy;
}

function downloadStoriesJson(payload, { filenameBase }) {
  const safeBase = (filenameBase || "user-stories").replace(/[^\w\-.\s()]/g, "_").slice(0, 120);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeBase}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {{
 *   stories: object[],
 *   projectId: string,
 *   projectLabel?: string,
 *   featureId: string,
 *   featureLabel?: string,
 *   onOpen: (storyId: string) => void,
 *   onOpenEdit?: (storyId: string) => void,
 *   canCreate?: boolean,
 *   onCreateClick?: () => void,
 *   onActionError?: (message: string) => void,
 *   onSuccessMessage?: (message: string) => void,
 *   onRefresh?: () => Promise<unknown>,
 *   isMaster?: boolean,
 * }} props
 */
export default function TableUserStories({
  stories,
  projectId,
  projectLabel = "proyecto",
  featureId,
  featureLabel = "feature",
  onOpen,
  onOpenEdit,
  canCreate = false,
  onCreateClick,
  onActionError,
  onSuccessMessage,
  onRefresh,
  isMaster = false,
}) {
  const { user } = useAuth();
  const master = isMaster && hasRole(user, ROLE_MASTER);
  const canView = hasPermission(user, "project:read");
  const canWrite = hasPermission(user, "story:write");

  const columns = useMemo(() => COLUMNS_DATA, []);

  const [actionBusyId, setActionBusyId] = useState(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [confirmDialog, setConfirmDialog] = useState(() => ({ ...EMPTY_CONFIRM_DIALOG }));

  const openConfirmDialog = useCallback((partial) => {
    setConfirmDialog({
      ...EMPTY_CONFIRM_DIALOG,
      ...partial,
      open: true,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({ ...EMPTY_CONFIRM_DIALOG });
  }, []);

  const tabs = useMemo(() => tabDefs(), []);

  const counts = useMemo(() => {
    const c = { all: stories.length, active: 0, ARCHIVED: 0 };
    for (const s of stories) {
      if (s.status === "ARCHIVED") c.ARCHIVED += 1;
      else c.active += 1;
    }
    return c;
  }, [stories]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, search, sortField, sortDir, pageSize, stories.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter((row) => {
      if (!matchesStatusTab(row, statusTab)) return false;
      if (!q) return true;
      const label = displayStoryLabel(row).toLowerCase();
      const hay = [
        label,
        row.description,
        row.id,
        String(row.number ?? ""),
        row.status,
        row.priority,
        row.item_type,
        row.refinement_status,
        String(row.story_points ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [stories, statusTab, search]);

  const sorted = useMemo(() => sortRows(filtered, sortField, sortDir), [filtered, sortField, sortDir]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, maxPage);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const startIdx = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(startIdx, startIdx + pageSize);

  const rangeLabel =
    total === 0 ? "0–0 de 0" : `${startIdx + 1}–${Math.min(startIdx + pageSize, total)} de ${total}`;

  const emptyMessage = search.trim()
    ? "No hay historias que coincidan con los filtros."
    : "Sin historias en esta feature.";

  const handleArchiveRow = useCallback(
    (row) => {
      if (!row?.id || row.status === "ARCHIVED") return;
      const label = displayStoryLabel(row);
      openConfirmDialog({
        tone: "warning",
        title: "Archivar historia",
        description: `¿Archivar "${label}"?`,
        confirmLabel: "Archivar",
        cancelLabel: "Cancelar",
        confirmVariant: "primary",
        onConfirm: async () => {
          onActionError?.("");
          setActionBusyId(row.id);
          try {
            await storiesService.updateStoryStatus(row.id, "ARCHIVED");
            onSuccessMessage?.("Historia archivada.");
            await onRefresh?.();
          } catch (error) {
            const code = error && error.code ? String(error.code) : "UNKNOWN_ERROR";
            onActionError?.(presentationForStoryError(code).userMessage);
          } finally {
            setActionBusyId(null);
          }
        },
      });
    },
    [onActionError, onSuccessMessage, onRefresh, openConfirmDialog],
  );

  const handleDeleteRow = useCallback(
    (row) => {
      if (!row?.id) return;
      const label = displayStoryLabel(row);
      openConfirmDialog({
        tone: "error",
        title: "Eliminar historia",
        description: `¿Eliminar "${label}"? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        confirmVariant: "danger",
        onConfirm: async () => {
          onActionError?.("");
          setActionBusyId(row.id);
          try {
            await storiesService.deleteStory(row.id);
            onSuccessMessage?.("Historia eliminada.");
            await onRefresh?.();
          } catch (error) {
            const code = error && error.code ? String(error.code) : "UNKNOWN_ERROR";
            onActionError?.(presentationForStoryError(code).userMessage);
          } finally {
            setActionBusyId(null);
          }
        },
      });
    },
    [onActionError, onSuccessMessage, onRefresh, openConfirmDialog],
  );

  const handleExportJson = useCallback(() => {
    if (!master) return;
    onActionError?.("");
    setExportBusy(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        project_id: projectId,
        project_label: projectLabel,
        feature_id: featureId,
        feature_label: featureLabel,
        stories,
      };
      const base = `user-stories-${featureLabel || featureId}`.slice(0, 80);
      downloadStoriesJson(payload, { filenameBase: base });
      onSuccessMessage?.("Exportación JSON generada.");
    } catch (error) {
      onActionError?.(error && error.message ? error.message : "Error al exportar");
    } finally {
      setExportBusy(false);
    }
  }, [master, stories, projectId, projectLabel, featureId, featureLabel, onActionError, onSuccessMessage]);

  return (
    <div className={styles.shell} data-testid="user-stories-table">
      <div className={styles.topRow}>
        <div className={styles.tabs} role="tablist" aria-label="Filtro por estado de historia">
          {tabs.map((t) => {
            const isActive = statusTab === t.id;
            const count = counts[t.id] ?? 0;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[styles.tab, isActive ? styles.tabActive : styles.tabInactive].join(" ")}
                onClick={() => setStatusTab(t.id)}
              >
                <span>{t.label}</span>
                <span className={[styles.tabPill, isActive ? styles.pillOnActive : t.pillClass].join(" ")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.topActions}>
          {master ? (
            <Button
              type="button"
              variant="secondary"
              disabled={exportBusy}
              data-testid="user-stories-export-json"
              onClick={() => handleExportJson()}
            >
              {exportBusy ? "Exportando…" : "Exportar JSON"}
            </Button>
          ) : null}
          {canCreate ? (
            <Button type="button" variant="primary" data-testid="user-stories-open-create" onClick={() => onCreateClick?.()}>
              Nueva historia
            </Button>
          ) : null}
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por título, descripción, id o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar historias"
          />
        </div>
        <div className={styles.filtersEnd}>
          <label className={styles.perPageLabel} htmlFor="user-stories-sort-field">
            Ordenar
          </label>
          <div className={styles.filterSelectSort}>
            <TableFilterSelect
              id="user-stories-sort-field"
              ariaLabel="Campo de ordenación"
              value={sortField}
              options={SORT_FIELD_OPTIONS}
              onChange={(v) => setSortField(v)}
            />
          </div>
          <label className={styles.srOnly} htmlFor="user-stories-sort-dir">
            Dirección del orden
          </label>
          <div className={styles.filterSelectDir}>
            <TableFilterSelect
              id="user-stories-sort-dir"
              ariaLabel="Dirección del orden"
              value={sortDir}
              options={[
                { value: "desc", label: "Descendente" },
                { value: "asc", label: "Ascendente" },
              ]}
              onChange={(v) => setSortDir(v)}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableIsland}>
        <DataTable
          className={styles.dataTableRoot}
          wrapClassName={styles.dataTableWrap}
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
          emptyContent={emptyMessage}
          renderCell={({ column, row, value }) => {
            if (column.key === "number") {
              return displayNumber(row);
            }
            if (column.key === "title") {
              const nameLabel = displayStoryLabel(row);
              return (
                <Button
                  variant="link"
                  type="button"
                  className={styles.nameLink}
                  data-testid="user-story-list-name-link"
                  onClick={() => onOpen(row.id)}
                >
                  {nameLabel}
                </Button>
              );
            }
            if (column.key === "status") {
              return (
                <Badge variant={mapStoryStatusToDsBadgeVariant(value)} appearance="light">
                  {String(value || "UNKNOWN")}
                </Badge>
              );
            }
            if (column.key === "priority") {
              return (
                <Badge variant={mapStoryPriorityToDsBadgeVariant(row.priority)} appearance="light">
                  {String(row.priority || "—")}
                </Badge>
              );
            }
            if (column.key === "created_at") {
              return formatDate(value);
            }
            if (column.key === "sprint_info") {
              const { sprintLabel, ptsLabel } = formatSprintAndPointsCell(row);
              return (
                <div className={styles.cellWithIcon}>
                  <span className={styles.cellIcon} aria-hidden>
                    <IconSprint />
                  </span>
                  <span>
                    {sprintLabel} · {ptsLabel}
                  </span>
                </div>
              );
            }
            if (column.key === "progress_pct") {
              const pct = workflowProgressPct(row.status);
              return (
                <div className={styles.progressWrap}>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso estimado ${pct} por ciento`}
                  >
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{pct}%</span>
                </div>
              );
            }
            if (column.key === "updated_at") {
              return formatRelativeTimeEs(row.updated_at);
            }
            if (column.key === "__actions") {
              const rowBusy = actionBusyId === row.id;
              const label = displayStoryLabel(row);
              const openEdit = onOpenEdit ?? onOpen;
              return (
                <div className={styles.actionCell}>
                  {canView ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconView}`}
                      title={`Ver: ${label}`}
                      aria-label={`Ver: ${label}`}
                      disabled={rowBusy}
                      onClick={() => onOpen(row.id)}
                    >
                      <IconEye />
                    </button>
                  ) : null}
                  {canWrite ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconEdit}`}
                      title={`Editar: ${label}`}
                      aria-label={`Editar: ${label}`}
                      disabled={rowBusy}
                      onClick={() => openEdit(row.id)}
                    >
                      <IconPencil />
                    </button>
                  ) : null}
                  {canWrite ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconArchive}`}
                      title={`Archivar: ${label}`}
                      aria-label={`Archivar: ${label}`}
                      disabled={rowBusy || row.status === "ARCHIVED"}
                      onClick={() => handleArchiveRow(row)}
                    >
                      <IconArchive />
                    </button>
                  ) : null}
                  {canWrite ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconDelete}`}
                      title={`Eliminar: ${label}`}
                      aria-label={`Eliminar: ${label}`}
                      disabled={rowBusy}
                      onClick={() => handleDeleteRow(row)}
                    >
                      <IconTrash />
                    </button>
                  ) : null}
                </div>
              );
            }
            return value ?? "—";
          }}
        />
      </div>

      <div className={styles.pagerRow}>
        <div className={styles.pagerStart}>
          <span className={styles.perPageLabel}>Mostrar</span>
          <div className={styles.filterSelectPage}>
            <TableFilterSelect
              id="user-stories-page-size"
              ariaLabel="Filas por página"
              value={String(pageSize)}
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              onChange={(v) => setPageSize(Number(v))}
            />
          </div>
          <span className={styles.perPageLabel}>por página</span>
        </div>
        <div className={styles.pagerEnd}>
          <span>{rangeLabel}</span>
          <div className={styles.pagerNav}>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              ‹
            </button>
            <span className={styles.pagerPage}>{safePage}</span>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={safePage >= maxPage}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Página siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={confirmDialog.open}
        tone={confirmDialog.tone}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        confirmVariant={confirmDialog.confirmVariant}
        busy={false}
        onCancel={closeConfirmDialog}
        onConfirm={async () => {
          const fn = confirmDialog.onConfirm;
          closeConfirmDialog();
          if (typeof fn === "function") {
            await Promise.resolve(fn());
          }
        }}
      />
    </div>
  );
}
