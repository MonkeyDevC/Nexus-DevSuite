/**
 * ----
 * Modulo: Sprint Backlog
 * Descripcion: Lista y seguimiento de sprints del proyecto — tabla enriquecida, métricas vía getSprintSummary, toolbar y filtros.
 * ----
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Pencil, Play, Trash2 } from "lucide-react";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import ConfirmModal from "../../../design-system/patterns/ConfirmModal/ConfirmModal.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../../../shared/cache/domainWorkCache.js";
import * as sprintService from "../sprintsService.js";
import { presentationForSprintError } from "../errorPresentation.js";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission } from "../../../auth/authorization.js";
import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Card } from "../../../design-system/components/Card/Card.jsx";
import { DataTable } from "../../../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../../../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../../../design-system/patterns/PageHeader/PageHeader.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import { Select } from "../../../design-system/components/Select/Select.jsx";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";
import { backlogListUrl, sprintDetailUrl, sprintEditUrl } from "../../../shared/routing/workspaceNavUrls.js";
import { listProjects } from "../../projects/services/projectApiClient.js";
import SprintCreateOverlay from "../components/SprintCreateOverlay.jsx";
import { formatDateAsIsoLocal } from "../sprintDateUtils.js";
import {
  buildSprintRowViewModels,
  filterAndSortSprintRows,
  mapSprintSummaryToMetrics,
  normalizeSprintStatusApi,
} from "../sprintHistoryDerived.js";
import styles from "./sprintsPageHistory.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";
const SUMMARY_CONCURRENCY = 6;

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pid = raw.id != null ? String(raw.id).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return null;
  const pname = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!pname) return null;
  return { id: pid, name: pname, status: raw.status != null ? String(raw.status) : "UNKNOWN" };
}

function mutationBannerClass(tone) {
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

/** @param {import("../sprintHistoryDerived.js").SprintRowViewModel} row */
function badgeForHistoryRow(row) {
  if (row.statusBadgeLabel === "PLANNED") {
    return (
      <Badge variant="neutral" appearance="light">
        PLANNED
      </Badge>
    );
  }
  if (row.statusBadgeLabel === "IN_PROGRESS") {
    return (
      <Badge variant="success" appearance="light">
        IN_PROGRESS
      </Badge>
    );
  }
  return (
    <Badge variant="success" appearance="solid">
      COMPLETED
    </Badge>
  );
}

function formatStoriesLine(total, points) {
  if (total <= 0 && points <= 0) return "—";
  const pts = points > 0 ? ` (${Math.round(points)} pts)` : "";
  return `${total} ${total === 1 ? "historia" : "historias"}${pts}`;
}

export default function SprintsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateSprint = hasPermission(user, "sprint:create");
  const canManageSprint = hasPermission(user, "sprint:manage");
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mutationError, setMutationError] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [createOverlayOpen, setCreateOverlayOpen] = useState(false);
  const [metricsState, setMetricsState] = useState(
    /** @type {import("../sprintHistoryDerived.js").SprintMetricsState} */ ({})
  );
  const [projectsOptions, setProjectsOptions] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDatePreset, setFilterDatePreset] = useState("all");

  const loadGenerationRef = useRef(0);
  const previousUrlProjectIdRef = useRef(/** @type {string|null} */ (null));
  const fromQuery = searchParams.get("project") != null ? String(searchParams.get("project")).trim() : "";
  const urlProjectId = isValidNexusUuid(fromQuery) ? fromQuery : "";

  const nowRef = useRef(new Date());
  nowRef.current = new Date();

  const viewModelsAll = useMemo(
    () => buildSprintRowViewModels(sprints, metricsState, { now: nowRef.current }),
    [sprints, metricsState]
  );

  const filteredRows = useMemo(() => {
    const todayIso = formatDateAsIsoLocal(new Date()) || "";
    return filterAndSortSprintRows(
      viewModelsAll,
      {
        search: filterSearch,
        status: filterStatus,
        datePreset: filterDatePreset === "intersects_today" ? "intersects_today" : "all",
      },
      { todayIso }
    );
  }, [viewModelsAll, filterSearch, filterStatus, filterDatePreset]);

  /** Hay al menos un sprint IN_PROGRESS en la lista base (regla sprint activo único en UX). */
  const hasActiveSprintInProject = useMemo(
    () => sprints.some((s) => normalizeSprintStatusApi(s?.status) === "IN_PROGRESS"),
    [sprints]
  );

  const inProgressSprintCount = useMemo(
    () => sprints.filter((s) => normalizeSprintStatusApi(s?.status) === "IN_PROGRESS").length,
    [sprints]
  );

  useEffect(() => {
    const prev = previousUrlProjectIdRef.current;
    previousUrlProjectIdRef.current = urlProjectId;
    if (prev != null && prev !== urlProjectId) {
      setFilterSearch("");
      setFilterStatus("");
      setFilterDatePreset("all");
    }
  }, [urlProjectId]);

  const runSummaries = useCallback(async (sprintIds, generation) => {
    const ids = Array.isArray(sprintIds) ? sprintIds.map(String).filter(Boolean) : [];
    if (ids.length === 0) return;

    let cursor = 0;
    async function worker() {
      for (;;) {
        if (generation !== loadGenerationRef.current) return;
        const idx = cursor;
        cursor += 1;
        if (idx >= ids.length) return;
        const id = ids[idx];
        try {
          const raw = await sprintService.getSprintSummary(id);
          if (generation !== loadGenerationRef.current) return;
          const data = mapSprintSummaryToMetrics(raw);
          if (!data) {
            setMetricsState((prev) => ({
              ...prev,
              [id]: { status: "error", errorMessage: "Resumen inválido" },
            }));
          } else {
            setMetricsState((prev) => ({
              ...prev,
              [id]: { status: "success", data },
            }));
          }
        } catch (e) {
          if (generation !== loadGenerationRef.current) return;
          const msg = e && e.message ? String(e.message) : "Error";
          setMetricsState((prev) => ({
            ...prev,
            [id]: { status: "error", errorMessage: msg },
          }));
        }
      }
    }

    const n = Math.min(SUMMARY_CONCURRENCY, Math.max(1, ids.length));
    await Promise.all(Array.from({ length: n }, () => worker()));
  }, []);

  const load = useCallback(async () => {
    if (!isValidNexusUuid(urlProjectId)) return;
    const gen = ++loadGenerationRef.current;
    setLoading(true);
    setErrorMessage("");
    setMutationError(null);
    setProject(null);
    setSprints([]);
    setMetricsState({});

    try {
      const { items } = await sprintService.listSprints(urlProjectId, { page: 1, limit: 50 });
      if (gen !== loadGenerationRef.current) return;

      const list = Array.isArray(items) ? items : [];
      setSprints(list);

      const nextMetrics = {};
      for (const sp of list) {
        if (sp && sp.id) nextMetrics[String(sp.id)] = { status: "loading" };
      }
      setMetricsState(nextMetrics);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const pdata = await sprintService.getProject(urlProjectId);
        if (gen !== loadGenerationRef.current) return;
        const np = normalizeProject(pdata);
        if (!np || String(np.id) !== String(urlProjectId)) {
          setErrorMessage(MSG_ERROR);
          setSprints([]);
          setMetricsState({});
          return;
        }
        setCachedProjectMeta(np.id, np.name);
        setProject(np);
      }

      void runSummaries(
        list.map((s) => s.id).filter(Boolean),
        gen
      );
    } catch (e) {
      logDev("[Sprints] load error", e && e.code);
      if (gen === loadGenerationRef.current) setErrorMessage(MSG_ERROR);
    } finally {
      if (gen === loadGenerationRef.current) setLoading(false);
    }
  }, [urlProjectId, runSummaries]);

  const onRefreshSprints = useCallback(async () => {
    if (!isValidNexusUuid(urlProjectId)) return;
    const gen = ++loadGenerationRef.current;
    setRefreshBusy(true);
    setErrorMessage("");
    setMutationError(null);
    setMetricsState({});

    try {
      const { items } = await sprintService.listSprints(urlProjectId, { page: 1, limit: 50 });
      if (gen !== loadGenerationRef.current) return;

      const list = Array.isArray(items) ? items : [];
      setSprints(list);

      const nextMetrics = {};
      for (const sp of list) {
        if (sp && sp.id) nextMetrics[String(sp.id)] = { status: "loading" };
      }
      setMetricsState(nextMetrics);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const pdata = await sprintService.getProject(urlProjectId);
        if (gen !== loadGenerationRef.current) return;
        const np = normalizeProject(pdata);
        if (np && String(np.id) === String(urlProjectId)) {
          setCachedProjectMeta(np.id, np.name);
          setProject(np);
        }
      }

      await runSummaries(
        list.map((s) => s.id).filter(Boolean),
        gen
      );
    } catch (e) {
      logDev("[Sprints] refresh error", e && e.code);
      if (gen === loadGenerationRef.current) setErrorMessage(MSG_ERROR);
    } finally {
      if (gen === loadGenerationRef.current) setRefreshBusy(false);
    }
  }, [urlProjectId, runSummaries]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Sprints] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    void load();
    return undefined;
  }, [load, navigate, urlProjectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listProjects();
        if (!cancelled) setProjectsOptions(Array.isArray(rows) ? rows : []);
      } catch (e) {
        logDev("[Sprints] listProjects", e && e.code);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", label: "Sprint" },
      { key: "status", label: "Estado", align: "center" },
      { key: "period", label: "Periodo" },
      { key: "duration", label: "Duración" },
      { key: "progress", label: "Progreso" },
      { key: "storiesTotal", label: "Historias totales" },
      { key: "storiesDone", label: "Historias completadas" },
      { key: "actions", label: "Acciones", align: "end" },
    ],
    []
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Proyectos", path: "/projects" },
      {
        label: project ? project.name : "Proyecto",
        path: project ? `/projects/${project.id}` : undefined,
      },
      { label: "Sprint Backlog" },
    ],
    [project]
  );

  const sprintCreateBreadcrumbs = useMemo(
    () => [...breadcrumbItems, { label: "Nuevo sprint" }],
    [breadcrumbItems]
  );

  async function runConfirmedAction() {
    if (!confirm || !confirm.row) {
      setConfirm(null);
      return;
    }
    const row = confirm.row;
    const kind = confirm.type;
    setConfirm(null);
    setMutationError(null);
    setBusyId(row.id);
    try {
      if (kind === "start") {
        await sprintService.startSprint(row.id);
      } else if (kind === "close") {
        await sprintService.closeSprint(row.id);
      } else if (kind === "delete") {
        await sprintService.deleteSprint(row.id);
      }
      await load();
    } catch (e) {
      setMutationError(presentationForSprintError(e && e.code));
    } finally {
      setBusyId("");
    }
  }

  const metricsLoading = useMemo(() => {
    const ids = sprints.map((s) => s.id).filter(Boolean);
    if (ids.length === 0) return false;
    return ids.some((id) => {
      const e = metricsState[id];
      return !e || e.status === "loading" || e.status === "idle";
    });
  }, [sprints, metricsState]);

  const projectSelectOptions = useMemo(() => {
    const byId = new Map();
    for (const p of projectsOptions) {
      if (p && p.id) byId.set(String(p.id), p);
    }
    if (project && project.id && !byId.has(String(project.id))) {
      byId.set(String(project.id), project);
    }
    return Array.from(byId.values());
  }, [projectsOptions, project]);

  function renderProgressCell(row) {
    if (row.suppressProgress) {
      if (row.metricsStatus === "error") {
        return <span className={styles.metricsError}>{row.metricsErrorMessage || "Error"}</span>;
      }
      if (row.metricsStatus === "loading" || row.metricsStatus === "idle") {
        return (
          <div className={styles.progressWrap} aria-busy="true">
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${styles.progressFillMuted} ${styles.progressIndeterminate}`}
                style={{ width: "40%" }}
              />
            </div>
            <span className={styles.progressPct}>…</span>
          </div>
        );
      }
      if (!row.dateValidation.ok) {
        return <span className={styles.metricsMuted}>—</span>;
      }
    }
    if (row.metricsStatus === "success" && row.metrics && row.metrics.storiesTotal === 0) {
      return <span className={styles.metricsMuted}>Sin historias</span>;
    }
    const pct = row.metrics ? row.metrics.progressPercent : 0;
    return (
      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressPct}>{pct}%</span>
      </div>
    );
  }

  const toolbar = !loading && !errorMessage && project && (
    <div className={styles.toolbarRow}>
      <div className={[styles.toolbarField, styles.toolbarFieldSearch].join(" ")}>
        <Input
          label="Buscar"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Nombre del sprint…"
          data-testid="sprints-filter-search"
        />
      </div>
      <div className={styles.toolbarField}>
        <Select
          label="Proyecto"
          value={urlProjectId}
          onChange={(e) => {
            const v = e.target.value;
            if (v && isValidNexusUuid(v)) navigate(`/sprints?project=${encodeURIComponent(v)}`);
          }}
          data-testid="sprints-project-select"
        >
          {projectSelectOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className={styles.toolbarField}>
        <Select
          label="Estado"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          data-testid="sprints-filter-status"
        >
          <option value="">Todos</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="PLANNED">PLANNED</option>
          <option value="CLOSED">COMPLETED</option>
        </Select>
      </div>
      <div className={styles.toolbarField}>
        <Select
          label="Fecha"
          value={filterDatePreset === "intersects_today" ? "intersects_today" : "all"}
          onChange={(e) => setFilterDatePreset(e.target.value === "intersects_today" ? "intersects_today" : "all")}
          data-testid="sprints-filter-date"
        >
          <option value="all">Todas</option>
          <option value="intersects_today">Cruzan hoy</option>
        </Select>
      </div>
      <span className={styles.toolbarMeta} data-testid="sprints-count-meta">
        {filteredRows.length} visibles · {sprints.length} totales
        {metricsLoading ? " · Métricas…" : ""}
      </span>
      <Button
        type="button"
        variant="secondary"
        onClick={() => onRefreshSprints()}
        disabled={refreshBusy || loading}
        data-testid="sprints-refresh"
      >
        {refreshBusy ? "Refrescando…" : "Refrescar"}
      </Button>
    </div>
  );

  return (
    <div className={wave1.stack} data-testid="sprints-root">
      <PageHeader
        title="Sprint Backlog"
        description={
          project
            ? `${project.name} · ${sprints.length} sprint(s) — seguimiento del proyecto`
            : "Sprints del proyecto y su estado."
        }
        breadcrumb={
          <div data-testid="breadcrumb-sprints">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        }
        actions={
          !loading && project ? (
            <div className={wave1.navRow}>
              {canCreateSprint ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => setCreateOverlayOpen(true)}
                  data-testid="sprints-open-create-overlay"
                >
                  Nuevo sprint
                </Button>
              ) : null}
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}`)}>
                Proyecto
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(backlogListUrl(project.id))}>
                Backlog
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}/features`)}>
                Features
              </Button>
              <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
                Lista proyectos
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="sprints-loading">
          {MSG_LOADING}
        </div>
      ) : (
        <span data-testid="sprints-loaded-marker" hidden />
      )}

      {!loading && errorMessage ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} data-testid="sprints-error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {!loading && mutationError ? (
        <div className={mutationBannerClass(mutationError.tone)} role="alert">
          {mutationError.userMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && project && inProgressSprintCount > 1 ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="status" data-testid="sprints-multi-active-banner">
          Hay más de un sprint en curso para este proyecto. Revisa los datos o el flujo de negocio.
        </div>
      ) : null}

      {!loading && !errorMessage && project ? (
        <Card padding="default">
          {toolbar}

          <div data-testid="sprints-table" className={wave1.tableSection}>
            {sprints.length === 0 ? (
              <EmptyState
                title="Aún no hay sprints en este proyecto"
                description="Crea el primer sprint para planificar el trabajo del equipo."
                actions={
                  canCreateSprint ? (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => setCreateOverlayOpen(true)}
                      data-testid="sprints-empty-create-overlay"
                    >
                      Crear primer sprint
                    </Button>
                  ) : null
                }
              />
            ) : filteredRows.length === 0 ? (
              <>
                <div className={styles.emptyFiltered} data-testid="sprints-empty-filtered" role="status">
                  No hay sprints que coincidan con los filtros. Ajusta búsqueda, estado o fecha.
                </div>
                <DataTable
                  caption="Sprint Backlog · 0 visibles"
                  columns={columns}
                  rows={[]}
                  getRowKey={(row) => row.id}
                  emptyContent="Sin filas."
                />
              </>
            ) : (
              <DataTable
                caption={`Sprint Backlog · ${filteredRows.length} visible(s)`}
                columns={columns}
                rows={filteredRows}
                getRowKey={(row) => row.id}
                onRowClick={(row) => {
                  if (row && row.id) navigate(sprintDetailUrl(row.id, urlProjectId));
                }}
                getRowAriaLabel={(row) => `Ver sprint ${row.name || row.id}`}
                renderCell={({ column, row }) => {
                  if (column.key === "name") {
                    return <span className={styles.sprintNameCell}>{row.name || "—"}</span>;
                  }
                  if (column.key === "status") {
                    return badgeForHistoryRow(row);
                  }
                  if (column.key === "period") {
                    return row.periodLabel ?? "—";
                  }
                  if (column.key === "duration") {
                    return row.durationDays != null ? `${row.durationDays} día(s)` : "—";
                  }
                  if (column.key === "progress") {
                    return renderProgressCell(row);
                  }
                  if (column.key === "storiesTotal") {
                    if (row.metricsStatus === "loading" || row.metricsStatus === "idle") {
                      return <span className={styles.metricsMuted}>…</span>;
                    }
                    if (row.metricsStatus === "error") return "—";
                    return formatStoriesLine(row.metrics?.storiesTotal ?? 0, row.metrics?.pointsTotal ?? 0);
                  }
                  if (column.key === "storiesDone") {
                    if (row.metricsStatus === "loading" || row.metricsStatus === "idle") {
                      return <span className={styles.metricsMuted}>…</span>;
                    }
                    if (row.metricsStatus === "error") return "—";
                    return formatStoriesLine(row.metrics?.storiesDone ?? 0, row.metrics?.pointsDone ?? 0);
                  }
                  if (column.key === "actions") {
                    const st = row.statusApi;
                    const disabled = busyId === row.id;
                    const detailUrl = sprintDetailUrl(row.id, urlProjectId);
                    const editUrl = sprintEditUrl(row.id, urlProjectId);
                    const startBlocked = hasActiveSprintInProject;
                    return (
                      <div
                        className={styles.iconActions}
                        onClick={(ev) => ev.stopPropagation()}
                        onKeyDown={(ev) => ev.stopPropagation()}
                        role="presentation"
                      >
                        <button
                          type="button"
                          className={styles.iconBtn}
                          title="Ver detalle del sprint"
                          aria-label="Ver sprint"
                          disabled={disabled}
                          onClick={() => navigate(detailUrl)}
                        >
                          <Eye size={18} strokeWidth={2} aria-hidden />
                        </button>
                        {st === "PLANNED" && canManageSprint ? (
                          <>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title={
                                startBlocked
                                  ? "Ya hay un sprint en curso en este proyecto"
                                  : "Activar sprint"
                              }
                              aria-label="Activar sprint"
                              disabled={disabled || startBlocked}
                              onClick={() =>
                                setConfirm({
                                  type: "start",
                                  row,
                                  title: "Activar sprint",
                                  message:
                                    "¿Activar este sprint? Solo puede haber un sprint en curso por proyecto.",
                                })
                              }
                            >
                              <Play size={18} strokeWidth={2} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Editar sprint"
                              aria-label="Editar sprint"
                              disabled={disabled}
                              onClick={() => navigate(editUrl)}
                            >
                              <Pencil size={18} strokeWidth={2} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Eliminar sprint"
                              aria-label="Eliminar sprint planificado"
                              disabled={disabled}
                              onClick={() =>
                                setConfirm({
                                  type: "delete",
                                  row,
                                  title: "Eliminar sprint",
                                  message:
                                    "¿Eliminar este sprint planificado? Esta acción no se puede deshacer.",
                                })
                              }
                            >
                              <Trash2 size={18} strokeWidth={2} aria-hidden />
                            </button>
                          </>
                        ) : null}
                        {st === "IN_PROGRESS" && canManageSprint ? (
                          <>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Editar sprint"
                              aria-label="Editar sprint"
                              disabled={disabled}
                              onClick={() => navigate(editUrl)}
                            >
                              <Pencil size={18} strokeWidth={2} aria-hidden />
                            </button>
                            <Button
                              variant="secondary"
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                setConfirm({
                                  type: "close",
                                  row,
                                  title: "Cerrar sprint",
                                  message:
                                    "¿Cerrar el sprint? Las historias no completadas se desasignarán del sprint.",
                                })
                              }
                            >
                              Cerrar
                            </Button>
                          </>
                        ) : null}
                        {st === "CLOSED" && canManageSprint ? (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Editar sprint"
                            aria-label="Editar sprint"
                            disabled={disabled}
                            onClick={() => navigate(editUrl)}
                          >
                            <Pencil size={18} strokeWidth={2} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    );
                  }
                  return "—";
                }}
              />
            )}
          </div>
        </Card>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm && confirm.title}
        message={confirm && confirm.message}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          runConfirmedAction();
        }}
      />

      {createOverlayOpen && project && !errorMessage ? (
        <SprintCreateOverlay
          project={project}
          sprints={sprints}
          breadcrumbItems={sprintCreateBreadcrumbs}
          onClose={() => setCreateOverlayOpen(false)}
          onCreated={() => {
            setCreateOverlayOpen(false);
            load();
          }}
          disabled={!canCreateSprint}
        />
      ) : null}
    </div>
  );
}
