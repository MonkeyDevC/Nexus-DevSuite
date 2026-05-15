/**
 * Listado de features por proyecto — mismo panel visual que TableProjects (tabs, búsqueda, tabla, paginación).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../../auth/authorization.js";
import { useAuth } from "../../../../app/context/AuthContext.jsx";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { DataTable } from "../../../../design-system/patterns/DataTable/DataTable.jsx";
import { formatRelativeTimeEs } from "../../../../utils/formatRelativeTimeEs.js";
import { mapFeatureStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import * as featuresService from "../../featuresService.js";
import TableFilterSelect from "../../../projects/components/tables/TableFilterSelect.jsx";
import styles from "../../../projects/components/tables/TableProjects.module.css";
import { formatFeatureListLabel } from "../../../../shared/workspace/workItemHumanIds.js";

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

function IconStories() {
  return (
    <svg className={styles.inlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

/** Texto de fila: FT-{n} — título */
function displayFeatureLabel(row) {
  if (!row) return "";
  return formatFeatureListLabel(row.number, row.title != null ? String(row.title) : "", " — ");
}

const COLUMNS_DATA = [
  { key: "number", label: "#", align: "center" },
  { key: "title", label: "Feature", align: "start" },
  { key: "status", label: "Estado", align: "center" },
  { key: "created_at", label: "Creado" },
  { key: "stories", label: "Historias", align: "start" },
  { key: "progress_pct", label: "Progreso", align: "end" },
  { key: "updated_at", label: "Última actualización", align: "start" },
  { key: "__actions", label: "Acciones", align: "end" },
];

const PAGE_SIZES = [5, 10, 25, 50];

const SORT_FIELD_OPTIONS = [
  { value: "created_at", label: "Fecha creación" },
  { value: "updated_at", label: "Última actualización" },
  { value: "title", label: "Título" },
  { value: "status", label: "Estado" },
  { value: "progress_pct", label: "Progreso" },
  { value: "user_stories_count", label: "Historias (total)" },
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
    if (sortField === "status") {
      const as = String(a.status || "").toLowerCase();
      const bs = String(b.status || "").toLowerCase();
      return mult * as.localeCompare(bs, "es");
    }
    if (sortField === "progress_pct" || sortField === "user_stories_count") {
      const na = Number(a[sortField]) || 0;
      const nb = Number(b[sortField]) || 0;
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

function downloadFeaturesJson(payload, { filenameBase }) {
  const safeBase = (filenameBase || "features").replace(/[^\w\-.\s()]/g, "_").slice(0, 120);
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
 *   features: object[],
 *   projectId: string,
 *   projectLabel?: string,
 *   onOpen: (featureId: string) => void,
 *   onOpenEdit?: (featureId: string) => void,
 *   canCreate?: boolean,
 *   onCreateClick?: () => void,
 *   onActionError?: (message: string) => void,
 *   onSuccessMessage?: (message: string) => void,
 *   onRefresh?: () => Promise<unknown>,
 *   isMaster?: boolean,
 * }} props
 */
export default function TableFeatures({
  features,
  projectId,
  projectLabel = "proyecto",
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
  const canWrite = hasPermission(user, "feature:write");

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
    const c = { all: features.length, active: 0, ARCHIVED: 0 };
    for (const f of features) {
      if (f.status === "ARCHIVED") c.ARCHIVED += 1;
      else c.active += 1;
    }
    return c;
  }, [features]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, search, sortField, sortDir, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((row) => {
      if (!matchesStatusTab(row, statusTab)) return false;
      if (!q) return true;
      const label = displayFeatureLabel(row).toLowerCase();
      const hay = [
        label,
        row.description,
        row.id,
        String(row.number ?? ""),
        row.status,
        String(row.user_stories_count ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [features, statusTab, search]);

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

  const emptyMessage = search.trim() ? "No hay features que coincidan con los filtros." : "Sin features";

  const handleArchiveRow = useCallback(
    (row) => {
      if (!row?.id || row.status === "ARCHIVED") return;
      const label = displayFeatureLabel(row);
      openConfirmDialog({
        tone: "warning",
        title: "Archivar feature",
        description: `¿Archivar "${label}"?`,
        confirmLabel: "Archivar",
        cancelLabel: "Cancelar",
        confirmVariant: "primary",
        onConfirm: async () => {
          onActionError?.("");
          setActionBusyId(row.id);
          try {
            await featuresService.updateFeatureStatus(row.id, "ARCHIVED");
            onSuccessMessage?.("Feature archivada.");
            await onRefresh?.();
          } catch (error) {
            onActionError?.(error && error.message ? error.message : "Error cargando datos");
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
      if (!row?.id || row.status === "ARCHIVED") return;
      const label = displayFeatureLabel(row);
      const storyTotal = Number(row.user_stories_count) || 0;
      if (storyTotal > 0) {
        openConfirmDialog({
          tone: "info",
          title: "No se puede eliminar",
          description: `La feature "${label}" tiene ${storyTotal} historias asociadas. Elimine o reasigne esas historias antes de eliminar la feature.`,
          confirmLabel: "Entendido",
          confirmVariant: "primary",
          cancelLabel: undefined,
          onConfirm: () => {},
        });
        return;
      }
      openConfirmDialog({
        tone: "error",
        title: "Eliminar feature",
        description: `¿Eliminar "${label}"? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        confirmVariant: "danger",
        onConfirm: async () => {
          onActionError?.("");
          setActionBusyId(row.id);
          try {
            await featuresService.deleteFeature(row.id);
            onSuccessMessage?.("Feature eliminada.");
            await onRefresh?.();
          } catch (error) {
            onActionError?.(error && error.message ? error.message : "Error cargando datos");
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
        features,
      };
      const base = `features-${projectLabel || projectId}`.slice(0, 80);
      downloadFeaturesJson(payload, { filenameBase: base });
      onSuccessMessage?.("Exportación JSON generada.");
    } catch (error) {
      onActionError?.(error && error.message ? error.message : "Error cargando datos");
    } finally {
      setExportBusy(false);
    }
  }, [master, features, projectId, projectLabel, onActionError, onSuccessMessage]);

  return (
    <div className={styles.shell} data-testid="features-table">
      <div className={styles.topRow}>
        <div className={styles.tabs} role="tablist" aria-label="Filtro por estado">
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
              data-testid="features-export-json"
              onClick={() => handleExportJson()}
            >
              {exportBusy ? "Exportando…" : "Exportar JSON"}
            </Button>
          ) : null}
          {canCreate ? (
            <Button type="button" variant="primary" data-testid="features-open-create" onClick={() => onCreateClick?.()}>
              Crear feature
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
            aria-label="Buscar features"
          />
        </div>
        <div className={styles.filtersEnd}>
          <label className={styles.perPageLabel} htmlFor="features-sort-field">
            Ordenar
          </label>
          <div className={styles.filterSelectSort}>
            <TableFilterSelect
              id="features-sort-field"
              ariaLabel="Campo de ordenación"
              value={sortField}
              options={SORT_FIELD_OPTIONS}
              onChange={(v) => setSortField(v)}
            />
          </div>
          <label className={styles.srOnly} htmlFor="features-sort-dir">
            Dirección del orden
          </label>
          <div className={styles.filterSelectDir}>
            <TableFilterSelect
              id="features-sort-dir"
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
              const nameLabel = displayFeatureLabel(row);
              return (
                <Button
                  variant="link"
                  type="button"
                  className={styles.nameLink}
                  data-testid="feature-list-name-link"
                  onClick={() => onOpen(row.id)}
                >
                  {nameLabel}
                </Button>
              );
            }
            if (column.key === "status") {
              return (
                <Badge variant={mapFeatureStatusToDsBadgeVariant(value)} appearance="light">
                  {String(value || "UNKNOWN")}
                </Badge>
              );
            }
            if (column.key === "created_at") {
              return formatDate(value);
            }
            if (column.key === "stories") {
              const totalStories = Number(row.user_stories_count);
              const done = Number(row.stories_done);
              const t = Number.isFinite(totalStories) ? totalStories : 0;
              const d = Number.isFinite(done) ? done : 0;
              return (
                <div className={styles.cellWithIcon}>
                  <span className={styles.cellIcon} aria-hidden>
                    <IconStories />
                  </span>
                  <span>
                    {d}/{t} historias
                  </span>
                </div>
              );
            }
            if (column.key === "progress_pct") {
              const pct = Math.min(100, Math.max(0, Number(row.progress_pct) || 0));
              return (
                <div className={styles.progressWrap}>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso ${pct} por ciento`}
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
              const label = displayFeatureLabel(row);
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
                      title={
                        row.status === "ARCHIVED"
                          ? "No se puede eliminar una feature archivada"
                          : `Eliminar: ${label}`
                      }
                      aria-label={`Eliminar: ${label}`}
                      disabled={rowBusy || row.status === "ARCHIVED"}
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
              id="features-page-size"
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
