/**
 * ----
 * Modulo: TableProjects
 * Descripcion: Listado proyectos estilo panel admin (mock invoice / TailAdmin).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-27
 * ----
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../../auth/authorization.js";
import { useAuth } from "../../../../app/context/AuthContext.jsx";
import { useProjectContext } from "../../context/ProjectContext.jsx";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { DataTable } from "../../../../design-system/patterns/DataTable/DataTable.jsx";
import {
  buildProjectsExportSnapshot,
  buildProjectsExportSnapshotForProjects,
  downloadProjectsJson,
  importProjectsFromJsonFile,
} from "../../services/projectsExportImport.js";
import { formatRelativeTimeEs } from "../../../../utils/formatRelativeTimeEs.js";
import TableFilterSelect from "./TableFilterSelect.jsx";
import styles from "./TableProjects.module.css";

function IconUsers() {
  return (
    <svg className={styles.inlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className={styles.inlineIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

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

function mapStatusVariant(status) {
  if (status === "ACTIVE") return "success";
  if (status === "ARCHIVED") return "neutral";
  return "warning";
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

/** Nombre para UI / orden / búsqueda: sin espacios extremos (datos legacy pueden traer leading space). */
function displayProjectName(name) {
  if (name == null) return "";
  return String(name).trim();
}

const COLUMN_CHK = { key: "__chk", label: "" };

const COLUMNS_DATA = [
  { key: "number", label: "#", align: "center" },
  { key: "name", label: "Proyecto", align: "start" },
  { key: "status", label: "Estado", align: "center" },
  { key: "created_at", label: "Creado" },
  { key: "team_member_count", label: "Equipo", align: "start" },
  { key: "current_sprint", label: "Sprint actual", align: "start" },
  { key: "progress_pct", label: "Progreso", align: "end" },
  { key: "last_activity_at", label: "Última actualización", align: "start" },
  { key: "__actions", label: "Acciones", align: "end" },
];

const PAGE_SIZES = [5, 10, 25, 50];

const SORT_FIELD_OPTIONS = [
  { value: "created_at", label: "Fecha creación" },
  { value: "last_activity_at", label: "Última actualización (proyecto e hijos)" },
  { value: "updated_at", label: "Última modificación proyecto" },
  { value: "name", label: "Nombre" },
  { value: "team_member_count", label: "Equipo (miembros)" },
  { value: "progress_pct", label: "Progreso" },
  { value: "current_sprint_name", label: "Sprint actual" },
];

function tabDefs(otherCount) {
  const base = [
    { id: "all", label: "Todos", pillClass: styles.pillAll },
    { id: "ACTIVE", label: "Activos", pillClass: styles.pillSuccess },
    { id: "ARCHIVED", label: "Archivados", pillClass: styles.pillNeutral },
  ];
  if (otherCount > 0) {
    base.push({ id: "OTHER", label: "Otros", pillClass: styles.pillWarning });
  }
  return base;
}

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

function matchesStatusTab(row, tabId) {
  if (tabId === "all") return true;
  if (tabId === "ACTIVE") return row.status === "ACTIVE";
  if (tabId === "ARCHIVED") return row.status === "ARCHIVED";
  if (tabId === "OTHER") return row.status !== "ACTIVE" && row.status !== "ARCHIVED";
  return true;
}

function sortRows(rows, sortField, sortDir) {
  const mult = sortDir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortField === "name") {
      const an = displayProjectName(a.name).toLowerCase();
      const bn = displayProjectName(b.name).toLowerCase();
      return mult * an.localeCompare(bn, "es");
    }
    if (sortField === "current_sprint_name") {
      const an = displayProjectName(a.current_sprint?.name).toLowerCase();
      const bn = displayProjectName(b.current_sprint?.name).toLowerCase();
      return mult * an.localeCompare(bn, "es");
    }
    if (sortField === "team_member_count" || sortField === "progress_pct") {
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

function SelectAllHeader({ pageIds, selectedIds, onTogglePage }) {
  const ref = useRef(null);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className={styles.checkbox}
      checked={allSelected}
      onChange={() => onTogglePage(pageIds, !allSelected)}
      aria-label="Seleccionar todos en esta página"
    />
  );
}

/**
 * @param {{
 *   projects: object[],
 *   onOpen: (id: string) => void,
 *   canCreate?: boolean,
 *   onCreateClick?: () => void,
 *   onActionError?: (message: string) => void,
 *   onSuccessMessage?: (message: string) => void,
 *   onRefreshProjects?: () => Promise<unknown>,
 *   isMaster?: boolean,
 * }} props
 */
export default function TableProjects({
  projects,
  onOpen,
  canCreate = false,
  onCreateClick,
  onActionError,
  onSuccessMessage,
  onRefreshProjects,
  isMaster = false,
}) {
  const { user } = useAuth();
  const { archiveProject, deleteProject, bulkDeleteProjects } = useProjectContext();
  const canViewProject = hasPermission(user, "project:read");
  const canEditProject = hasPermission(user, "project:update");
  const master = isMaster && hasRole(user, ROLE_MASTER);
  const canArchiveProject = master;
  const canDeleteProject = master;
  const columns = useMemo(() => (master ? [COLUMN_CHK, ...COLUMNS_DATA] : COLUMNS_DATA), [master]);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const importInputRef = useRef(null);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("last_activity_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
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

  const otherCount = useMemo(
    () => projects.filter((p) => p.status !== "ACTIVE" && p.status !== "ARCHIVED").length,
    [projects],
  );

  const tabs = useMemo(() => tabDefs(otherCount), [otherCount]);

  const counts = useMemo(() => {
    const c = { all: projects.length, ACTIVE: 0, ARCHIVED: 0, OTHER: 0 };
    for (const p of projects) {
      if (p.status === "ACTIVE") c.ACTIVE += 1;
      else if (p.status === "ARCHIVED") c.ARCHIVED += 1;
      else c.OTHER += 1;
    }
    return c;
  }, [projects]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, search, sortField, sortDir, pageSize]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === statusTab)) {
      setStatusTab("all");
    }
  }, [tabs, statusTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((row) => {
      if (!matchesStatusTab(row, statusTab)) return false;
      if (!q) return true;
      const hay = [
        displayProjectName(row.name),
        row.description,
        row.id,
        row.organization_id,
        String(row.number ?? ""),
        row.status,
        displayProjectName(row.current_sprint?.name),
        String(row.team_member_count ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, statusTab, search]);

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
  const pageIds = pageRows.map((r) => r.id).filter(Boolean);

  const toggleOne = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const togglePage = useCallback((ids, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const handleArchiveRow = useCallback(
    (row) => {
      if (!row?.id || row.status !== "ACTIVE") return;
      const label = displayProjectName(row.name) || "este proyecto";
      openConfirmDialog({
        tone: "warning",
        title: "Archivar proyecto",
        description: `¿Está seguro de que desea archivar el proyecto "${label}"?`,
        confirmLabel: "Archivar",
        cancelLabel: "Cancelar",
        confirmVariant: "primary",
        onConfirm: async () => {
          onActionError?.("");
          setActionBusyId(row.id);
          try {
            await archiveProject(row.id, row.version);
          } catch (error) {
            onActionError?.(error && error.message ? error.message : "Error cargando datos");
          } finally {
            setActionBusyId(null);
          }
        },
      });
    },
    [archiveProject, onActionError, openConfirmDialog],
  );

  const handleDeleteRow = useCallback(
    (row) => {
      if (!row?.id) return;
      const label = displayProjectName(row.name) || "este proyecto";
      openConfirmDialog({
        tone: "error",
        title: "Eliminar proyecto",
        description: `¿Eliminar el proyecto "${label}" y todos sus datos asociados (features, historias, etc.)? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        confirmVariant: "danger",
        onConfirm: async () => {
          onActionError?.("");
          setActionBusyId(row.id);
          try {
            await deleteProject(row.id, row.version);
          } catch (error) {
            onActionError?.(error && error.message ? error.message : "Error cargando datos");
          } finally {
            setActionBusyId(null);
          }
        },
      });
    },
    [deleteProject, onActionError, openConfirmDialog],
  );

  const handleBulkDelete = useCallback(() => {
    if (!master) return;
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    openConfirmDialog({
      tone: "error",
      title: "Eliminar proyectos",
      description: `¿Desea eliminar ${ids.length} proyecto(s) y sus datos asociados (features, historias, sprints, etc.)? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      confirmVariant: "danger",
      onConfirm: async () => {
        onActionError?.("");
        setBulkBusy(true);
        try {
          const result = await bulkDeleteProjects(ids);
          setSelectedIds(new Set());
          onSuccessMessage?.(`Se eliminaron ${result.deleted} proyecto(s).`);
        } catch (error) {
          onActionError?.(error && error.message ? error.message : "Error cargando datos");
        } finally {
          setBulkBusy(false);
        }
      },
    });
  }, [master, selectedIds, bulkDeleteProjects, onActionError, onSuccessMessage, openConfirmDialog]);

  const handleExportJson = useCallback(async () => {
    if (!master) return;
    const ids = [...selectedIds];
    if (ids.length === 0) {
      onActionError?.("Selecciona al menos un proyecto para exportar.");
      return;
    }
    onActionError?.("");
    setExportBusy(true);
    try {
      const selectedProjects = (Array.isArray(projects) ? projects : []).filter((p) => p && p.id && selectedIds.has(p.id));
      const filenameBase =
        selectedProjects.length === 1 && displayProjectName(selectedProjects[0]?.name)
          ? displayProjectName(selectedProjects[0].name)
          : `Proyectos (${ids.length})`;
      const snapshot =
        selectedProjects.length > 0
          ? await buildProjectsExportSnapshotForProjects(selectedProjects)
          : await buildProjectsExportSnapshot();
      downloadProjectsJson(snapshot, { filenameBase });
      onSuccessMessage?.(`Exportación JSON generada (${ids.length} proyecto(s)).`);
    } catch (error) {
      onActionError?.(error && error.message ? error.message : "Error cargando datos");
    } finally {
      setExportBusy(false);
    }
  }, [master, selectedIds, projects, onActionError, onSuccessMessage]);

  const handleImportFile = useCallback(
    async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file || !master) return;
      onActionError?.("");
      setImportBusy(true);
      try {
        const summary = await importProjectsFromJsonFile(file);
        await onRefreshProjects?.();
        onSuccessMessage?.(
          `Importación completada. Proyectos: ${summary.projects_created}, Features: ${summary.features_created}, Historias: ${summary.stories_created}.`,
        );
      } catch (error) {
        onActionError?.(error && error.message ? error.message : "Error cargando datos");
      } finally {
        setImportBusy(false);
      }
    },
    [master, onActionError, onSuccessMessage, onRefreshProjects],
  );

  const rangeLabel =
    total === 0 ? "0–0 de 0" : `${startIdx + 1}–${Math.min(startIdx + pageSize, total)} de ${total}`;

  return (
    <div className={styles.shell} data-testid="projects-table-wrapper">
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
                <span
                  className={[
                    styles.tabPill,
                    isActive ? styles.pillOnActive : t.pillClass,
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.topActions}>
          {master ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={exportBusy || importBusy}
                data-testid="projects-export-json"
                onClick={() => handleExportJson()}
              >
                {exportBusy ? "Exportando…" : "Exportar JSON"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={exportBusy || importBusy}
                data-testid="projects-import-json"
                onClick={() => importInputRef.current?.click()}
              >
                {importBusy ? "Importando…" : "Importar JSON"}
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                aria-hidden
                tabIndex={-1}
                onChange={handleImportFile}
              />
            </>
          ) : null}
          {canCreate ? (
            <Button
              type="button"
              variant="primary"
              data-testid="projects-open-create"
              onClick={() => onCreateClick?.()}
            >
              Crear proyecto
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
            placeholder="Buscar por nombre, descripción, id o tenant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar proyectos"
          />
        </div>
        <div className={styles.filtersEnd}>
          <label className={styles.perPageLabel} htmlFor="projects-sort-field">
            Ordenar
          </label>
          <div className={styles.filterSelectSort}>
            <TableFilterSelect
              id="projects-sort-field"
              ariaLabel="Campo de ordenación"
              value={sortField}
              options={SORT_FIELD_OPTIONS}
              onChange={(v) => setSortField(v)}
            />
          </div>
          <label className={styles.srOnly} htmlFor="projects-sort-dir">
            Dirección del orden
          </label>
          <div className={styles.filterSelectDir}>
            <TableFilterSelect
              id="projects-sort-dir"
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

      {master && selectedIds.size > 0 ? (
        <div className={styles.bulkBar} role="region" aria-label="Acciones de selección múltiple">
          <span className={styles.bulkBarLabel}>{selectedIds.size} seleccionado(s)</span>
          <Button
            type="button"
            variant="danger"
            disabled={bulkBusy}
            data-testid="projects-bulk-delete-btn"
            onClick={handleBulkDelete}
          >
            {bulkBusy ? "Eliminando…" : "Eliminar seleccionados"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => setSelectedIds(new Set())}
          >
            Limpiar selección
          </Button>
        </div>
      ) : null}

      <div className={styles.tableIsland}>
        <DataTable
          className={styles.dataTableRoot}
          wrapClassName={styles.dataTableWrap}
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
          emptyContent="No hay proyectos que coincidan con los filtros."
          renderHeaderCell={({ column }) => {
            if (column.key === "__chk") {
              return <SelectAllHeader pageIds={pageIds} selectedIds={selectedIds} onTogglePage={togglePage} />;
            }
            return column.label;
          }}
          renderCell={({ column, row, value }) => {
            if (column.key === "__chk") {
              return (
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedIds.has(row.id)}
                  onChange={(e) => toggleOne(row.id, e.target.checked)}
                  aria-label={`Seleccionar ${displayProjectName(row.name) || "proyecto"}`}
                />
              );
            }
            if (column.key === "number") {
              return displayNumber(row);
            }
            if (column.key === "name") {
              const nameLabel = displayProjectName(value) || "—";
              return (
                <Button
                  variant="link"
                  type="button"
                  className={styles.nameLink}
                  data-testid="project-list-name-link"
                  onClick={() => onOpen(row.id)}
                >
                  {nameLabel}
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
            if (column.key === "created_at") {
              return formatDate(value);
            }
            if (column.key === "team_member_count") {
              const n = Number(row.team_member_count);
              const c = Number.isFinite(n) && n >= 0 ? n : 0;
              return (
                <div className={styles.cellWithIcon}>
                  <span className={styles.cellIcon} aria-hidden>
                    <IconUsers />
                  </span>
                  <span>
                    {c} {c === 1 ? "miembro" : "miembros"}
                  </span>
                </div>
              );
            }
            if (column.key === "current_sprint") {
              const sp = row.current_sprint;
              const sprintLabel = sp ? displayProjectName(sp.name) : "";
              if (!sprintLabel) {
                return "—";
              }
              return (
                <div className={styles.cellWithIcon}>
                  <span className={styles.cellIcon} aria-hidden>
                    <IconCalendar />
                  </span>
                  <span>{sprintLabel}</span>
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
                    aria-label={`Progreso del proyecto ${pct} por ciento`}
                  >
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{pct}%</span>
                </div>
              );
            }
            if (column.key === "last_activity_at") {
              return formatRelativeTimeEs(row.last_activity_at || row.updated_at);
            }
            if (column.key === "__actions") {
              const rowBusy = actionBusyId === row.id;
              const pName = displayProjectName(row.name) || "proyecto";
              return (
                <div className={styles.actionCell}>
                  {canViewProject ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconView}`}
                      title={`Ver proyecto: ${pName}`}
                      aria-label={`Ver proyecto: ${pName}`}
                      disabled={rowBusy}
                      onClick={() => onOpen(row.id)}
                    >
                      <IconEye />
                    </button>
                  ) : null}
                  {canEditProject ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconEdit}`}
                      title={`Editar proyecto: ${pName}`}
                      aria-label={`Editar proyecto: ${pName}`}
                      disabled={rowBusy}
                      onClick={() => onOpen(row.id)}
                    >
                      <IconPencil />
                    </button>
                  ) : null}
                  {canArchiveProject ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconArchive}`}
                      title={`Archivar proyecto: ${pName}`}
                      aria-label={`Archivar proyecto: ${pName}`}
                      disabled={rowBusy || row.status !== "ACTIVE"}
                      onClick={() => handleArchiveRow(row)}
                    >
                      <IconArchive />
                    </button>
                  ) : null}
                  {canDeleteProject ? (
                    <button
                      type="button"
                      className={`${styles.actionIconBtn} ${styles.actionIconDelete}`}
                      title={`Eliminar proyecto: ${pName}`}
                      aria-label={`Eliminar proyecto: ${pName}`}
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
              id="projects-page-size"
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
