/**
 * ----
 * Modulo: SprintDetail
 * Descripcion: Detalle sprint (Admin UI System); metricas; lista de historias en DataTable; asignar/quitar historias.
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import ConfirmModal from "../components/ui/ConfirmModal/ConfirmModal.jsx";
import {
  getCachedFeatureProjectId,
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import * as sprintService from "../modules/sprints/sprintsService.js";
import { presentationForSprintError } from "../modules/sprints/errorPresentation.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { StatCard, StatCardGrid } from "../design-system/patterns/StatCard/StatCard.jsx";
import {
  mapSprintApiStatusToDsBadgeVariant,
  mapSprintUiStatusToDsBadgeVariant,
  mapStoryStatusToDsBadgeVariant,
} from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";
const MSG_NOT_FOUND = "Elemento no encontrado";
const MSG_MISMATCH = "Elemento no pertenece a este contexto";
const MSG_INCONSISTENT = "Datos inconsistentes detectados";
const MSG_TOO_MANY_STORIES = "Demasiadas historias para renderizar";
const MSG_PARTIAL_FETCH = "No se pudieron cargar todas las paginas de historias";

const KANBAN_ORDER = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const MAX_STORIES_RENDER = 200;

function mapSprintStatusForUi(apiStatus) {
  const s = apiStatus != null ? String(apiStatus).trim() : "";
  if (s === "IN_PROGRESS") return "ACTIVE";
  if (s === "CLOSED") return "COMPLETED";
  if (s === "PLANNED") return "INACTIVE";
  return "INACTIVE";
}

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pid = raw.id != null ? String(raw.id).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return null;
  const pname = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!pname) return null;
  return { id: pid, name: pname };
}

function storyBelongsToUrlProjectContext(raw, urlProjectId, urlSprintId) {
  if (!raw || typeof raw !== "object") return false;
  const pid = raw.project_id != null ? String(raw.project_id).trim() : "";
  if (pid && isValidNexusUuid(pid)) {
    return pid === urlProjectId;
  }
  const fid = raw.feature_id != null ? String(raw.feature_id).trim() : "";
  if (fid && isValidNexusUuid(fid)) {
    const cachedProj = getCachedFeatureProjectId(fid);
    if (cachedProj) return cachedProj === urlProjectId;
  }
  const sid = raw.sprint_id != null ? String(raw.sprint_id).trim() : "";
  if (sid && sid === urlSprintId) {
    return true;
  }
  return false;
}

function normalizeStorySprint(raw, urlProjectId, urlSprintId) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) return null;

  const rawSprintId = raw.sprint_id != null ? String(raw.sprint_id).trim() : "";
  if (rawSprintId && rawSprintId !== urlSprintId) return null;

  if (!storyBelongsToUrlProjectContext(raw, urlProjectId, urlSprintId)) return null;

  const statusRaw = raw.status != null ? String(raw.status).trim() : "";
  const status = statusRaw || "TODO";

  return { id, title, status };
}

function groupStoriesForTable(rawRows, urlProjectId, urlSprintId) {
  const totalRaw = Array.isArray(rawRows) ? rawRows.length : 0;
  const truncated = totalRaw > MAX_STORIES_RENDER;
  const workRows = truncated ? rawRows.slice(0, MAX_STORIES_RENDER) : rawRows;

  const seenIds = new Set();
  const groups = { TODO: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] };
  let discardedInvalid = 0;

  for (const row of workRows) {
    const normalized = normalizeStorySprint(row, urlProjectId, urlSprintId);
    if (!normalized) {
      discardedInvalid += 1;
      continue;
    }
    if (seenIds.has(normalized.id)) continue;
    seenIds.add(normalized.id);
    const s = normalized.status != null ? String(normalized.status).trim() : "";
    if (s === "DONE") groups.DONE.push(normalized);
    else if (s === "IN_PROGRESS") groups.IN_PROGRESS.push(normalized);
    else if (s === "BLOCKED") groups.BLOCKED.push(normalized);
    else groups.TODO.push(normalized);
  }

  const validCount = seenIds.size;
  const storiesRawEmpty = totalRaw === 0;
  const inconsistentDataset = totalRaw > 0 && validCount === 0;

  const flatRows = [];
  for (const col of KANBAN_ORDER) {
    for (const st of groups[col]) {
      flatRows.push(st);
    }
  }

  return {
    flatRows,
    totalRaw,
    truncated,
    discardedInvalid,
    validCount,
    storiesRawEmpty,
    inconsistentDataset,
  };
}

function errorBannerClass(tone) {
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

function mutationBannerClass(tone) {
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

export default function SprintDetail() {
  const { user } = useAuth();
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const canManageSprint = hasPermission(user, "sprint:manage");
  const [sprint, setSprint] = useState(null);
  const [projectName, setProjectName] = useState("Project");
  const [metrics, setMetrics] = useState(null);
  const [storyRows, setStoryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [alertTone, setAlertTone] = useState("warning");
  const [storiesRawTotal, setStoriesRawTotal] = useState(0);
  const [storiesTruncated, setStoriesTruncated] = useState(false);
  const [storiesIncompleteFetch, setStoriesIncompleteFetch] = useState(false);
  const [storiesDiscardedInvalid, setStoriesDiscardedInvalid] = useState(0);
  const [storiesInconsistentDataset, setStoriesInconsistentDataset] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [readyStories, setReadyStories] = useState([]);
  const [selectedReadyId, setSelectedReadyId] = useState("");

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlSprintId = sprintId != null ? String(sprintId).trim() : "";

  const loadDetail = useCallback(async () => {
    if (!isValidNexusUuid(urlProjectId) || !isValidNexusUuid(urlSprintId)) return;

    setLoading(true);
    setErrorMessage("");
    setAlertTone("warning");
    setMutationError(null);
    setSprint(null);
    setMetrics(null);
    setStoryRows([]);
    setStoriesRawTotal(0);
    setStoriesTruncated(false);
    setStoriesIncompleteFetch(false);
    setStoriesDiscardedInvalid(0);
    setStoriesInconsistentDataset(false);
    setReadyStories([]);
    setSelectedReadyId("");

    try {
      let sp;
      try {
        sp = await sprintService.getSprint(urlSprintId);
      } catch (e) {
        const code = e && e.code;
        if (code === "SPRINT_NOT_FOUND" || code === "NOT_FOUND") {
          setAlertTone("secondary");
          setErrorMessage(MSG_NOT_FOUND);
        } else {
          logDev("[SprintDetail] error sprint", code);
          setErrorMessage(MSG_ERROR);
        }
        return;
      }

      if (String(sp.id) !== String(urlSprintId)) {
        setAlertTone("secondary");
        setErrorMessage(MSG_NOT_FOUND);
        return;
      }
      if (sp.project_id && String(sp.project_id) !== String(urlProjectId)) {
        logDev("[SprintDetail] mismatch proyecto", { urlProjectId, sprintProjectId: sp.project_id });
        setAlertTone("danger");
        setErrorMessage(MSG_MISMATCH);
        return;
      }

      try {
        const m = await sprintService.getSprintSummary(urlSprintId);
        setMetrics({
          stories_count: m.stories_count != null ? Number(m.stories_count) : 0,
          stories_done_count: m.stories_done_count != null ? Number(m.stories_done_count) : 0,
          total_story_points: m.total_story_points != null ? Number(m.total_story_points) : 0,
          completed_story_points: m.completed_story_points != null ? Number(m.completed_story_points) : 0,
        });
      } catch {
        setMetrics(null);
      }

      const cachedProj = getCachedProjectMeta(urlProjectId);
      if (cachedProj) {
        setProjectName(cachedProj.name);
      } else {
        try {
          const pdata = await sprintService.getProject(urlProjectId);
          const np = normalizeProject(pdata);
          if (np && String(np.id) === String(urlProjectId)) {
            setCachedProjectMeta(np.id, np.name);
            setProjectName(np.name);
          }
        } catch {
          /* noop */
        }
      }

      const { rows: rawStories, incomplete: incompleteFetch } = await sprintService.fetchAllSprintStories(
        urlSprintId,
        { limit: 50 }
      );
      const built = groupStoriesForTable(rawStories, urlProjectId, urlSprintId);
      setStoryRows(built.flatRows);
      setStoriesRawTotal(built.totalRaw);
      setStoriesTruncated(built.truncated);
      setStoriesIncompleteFetch(Boolean(incompleteFetch));
      setStoriesDiscardedInvalid(built.discardedInvalid);
      setStoriesInconsistentDataset(built.inconsistentDataset);
      setSprint(sp);

      if (sp.status !== "CLOSED") {
        try {
          const ready = await sprintService.listReadyStoriesWithoutSprint(urlProjectId, { page: 1, limit: 100 });
          setReadyStories(ready);
        } catch {
          setReadyStories([]);
        }
      }
    } catch {
      setErrorMessage(MSG_ERROR);
    } finally {
      setLoading(false);
    }
  }, [urlProjectId, urlSprintId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[SprintDetail] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    if (!isValidNexusUuid(urlSprintId)) {
      logDev("[SprintDetail] sprintId invalido", urlSprintId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [loadDetail, navigate, urlProjectId, urlSprintId]);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      {
        label: "Sprints",
        path: `/projects/${urlProjectId}/sprints`,
      },
      { label: sprint ? sprint.name : "Sprint" },
    ],
    [projectName, sprint, urlProjectId]
  );

  const completionPct =
    metrics && metrics.stories_count > 0
      ? Math.round((metrics.stories_done_count / metrics.stories_count) * 100)
      : null;

  const displayStatus = sprint ? mapSprintStatusForUi(sprint.status) : "INACTIVE";
  const sprintOpen = sprint && sprint.status !== "CLOSED";

  const storyColumns = useMemo(
    () => [
      { key: "title", label: "Historia" },
      { key: "status", label: "Estado", align: "center" },
      { key: "actions", label: "Acciones" },
    ],
    []
  );

  async function assignSelectedStory() {
    if (!selectedReadyId || !sprintOpen) return;
    setBusy(true);
    setMutationError(null);
    try {
      await sprintService.assignSprintToStory(selectedReadyId, urlSprintId);
      setSelectedReadyId("");
      await loadDetail();
    } catch (e) {
      setMutationError(presentationForSprintError(e && e.code));
    } finally {
      setBusy(false);
    }
  }

  async function removeStory(storyId) {
    if (!storyId || !sprintOpen) return;
    setBusy(true);
    setMutationError(null);
    try {
      await sprintService.removeSprintFromStory(storyId);
      await loadDetail();
    } catch (e) {
      setMutationError(presentationForSprintError(e && e.code));
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!confirm || !sprint) {
      setConfirm(null);
      return;
    }
    setBusy(true);
    setMutationError(null);
    try {
      if (confirm.type === "start") {
        await sprintService.startSprint(sprint.id);
      } else if (confirm.type === "close") {
        await sprintService.closeSprint(sprint.id);
      } else if (confirm.type === "delete") {
        await sprintService.deleteSprint(sprint.id);
        navigate(`/projects/${urlProjectId}/sprints`, { replace: true });
        setConfirm(null);
        return;
      }
      setConfirm(null);
      await loadDetail();
    } catch (e) {
      setMutationError(presentationForSprintError(e && e.code));
    } finally {
      setBusy(false);
    }
  }

  const headerDescription = sprint
    ? `${projectName} · API: ${sprint.status || "—"}`
    : undefined;

  return (
    <div className={wave1.stack} data-testid="sprint-detail-root">
      <PageHeader
        title={sprint ? sprint.name : "Sprint"}
        description={loading ? "Cargando detalle…" : errorMessage ? undefined : headerDescription}
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          !loading && sprint && !errorMessage ? (
            <div className={wave1.navRow}>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/sprints`)}>
                Lista sprints
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}`)}>
                Proyecto
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/backlog`)}>
                Backlog
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/features`)}>
                Features
              </Button>
              {sprint.status === "PLANNED" && canManageSprint ? (
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => navigate(`/projects/${urlProjectId}/sprints/${sprint.id}/edit`)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="primary"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        type: "start",
                        title: "Activar sprint",
                        message: "¿Activar este sprint? Solo puede haber un sprint en curso por proyecto.",
                      })
                    }
                  >
                    Iniciar
                  </Button>
                  <Button
                    variant="danger"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        type: "delete",
                        title: "Eliminar sprint",
                        message: "¿Eliminar este sprint planificado? Esta acción no se puede deshacer.",
                      })
                    }
                  >
                    Eliminar
                  </Button>
                </>
              ) : null}
              {sprint.status === "IN_PROGRESS" && canManageSprint ? (
                <Button
                  variant="secondary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setConfirm({
                      type: "close",
                      title: "Cerrar sprint",
                      message: "¿Cerrar el sprint? Las historias no completadas se desasignarán del sprint.",
                    })
                  }
                >
                  Cerrar
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="sprint-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorMessage ? (
        <div
          className={errorBannerClass(alertTone)}
          data-testid="sprint-detail-message"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {!loading && mutationError ? (
        <div className={mutationBannerClass(mutationError.tone)} role="alert">
          {mutationError.userMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && sprint ? (
        <>
          <Card padding="default" data-testid="sprint-detail-header">
            <p className={wave1.meta}>ID: {sprint.id}</p>
            <div className={wave1.statusRow}>
              <span className={wave1.meta}>Estado (UI)</span>
              <Badge variant={mapSprintUiStatusToDsBadgeVariant(displayStatus)}>{displayStatus}</Badge>
            </div>
            {sprint.goal ? <p className={wave1.detailMeta}>{sprint.goal}</p> : null}

            <div className={wave1.timelineRow} data-testid="sprint-timeline">
              <div>
                <span className={wave1.meta}>Inicio</span>
                <div className={wave1.detailMeta}>{sprint.start_date ? sprint.start_date.slice(0, 10) : "—"}</div>
              </div>
              <div className={wave1.meta} aria-hidden>
                →
              </div>
              <div>
                <span className={wave1.meta}>Fin</span>
                <div className={wave1.detailMeta}>{sprint.end_date ? sprint.end_date.slice(0, 10) : "—"}</div>
              </div>
              <div className={wave1.statusRow} style={{ marginBottom: 0 }}>
                <span className={wave1.meta}>Estado API</span>
                <Badge variant={mapSprintApiStatusToDsBadgeVariant(sprint.status)}>{sprint.status}</Badge>
              </div>
            </div>

            {metrics ? (
              <div data-testid="sprint-metrics" className={wave1.blockTopMargin}>
                <StatCardGrid>
                  <StatCard label="Historias" value={String(metrics.stories_count)} variant="neutral" />
                  <StatCard label="Completadas" value={String(metrics.stories_done_count)} variant="primary" />
                  <StatCard label="Story points" value={String(metrics.total_story_points)} variant="neutral" />
                  <StatCard label="SP completados" value={String(metrics.completed_story_points)} variant="primary" />
                </StatCardGrid>
                {completionPct != null ? (
                  <div className={wave1.progressWrap}>
                    <p className={wave1.meta}>Progreso por historias completadas</p>
                    <div className={wave1.progressTrack}>
                      <div
                        className={wave1.progressFill}
                        style={{ width: `${completionPct}%` }}
                        role="progressbar"
                        aria-valuenow={completionPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className={wave1.meta}>{completionPct}%</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          {sprintOpen && canManageSprint && readyStories.length > 0 ? (
            <Card padding="default" data-testid="sprint-assign-panel">
              <FormSection
                title="Asignar historias READY"
                description="Solo historias en READY sin sprint. Sin cambio de estado desde esta pantalla."
              >
                <div className={wave1.navRow}>
                  <select
                    className={wave1.selectInput}
                    value={selectedReadyId}
                    onChange={(ev) => setSelectedReadyId(ev.target.value)}
                    aria-label="Historia a asignar"
                  >
                    <option value="">Seleccionar historia…</option>
                    {readyStories.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    type="button"
                    disabled={busy || !selectedReadyId}
                    onClick={() => assignSelectedStory()}
                  >
                    Asignar al sprint
                  </Button>
                </div>
              </FormSection>
            </Card>
          ) : null}

          <Card padding="default" data-testid="sprint-detail-stories">
            <FormSection
              title="Historias del sprint"
              description="Listado administrativo. Una fase posterior puede añadir tablero u otro workspace."
            >
              {storiesInconsistentDataset ? (
                <div className={`${wave1.banner} ${wave1.bannerDanger}`} role="alert">
                  {MSG_INCONSISTENT}
                </div>
              ) : null}

              {storiesIncompleteFetch ? (
                <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
                  {MSG_PARTIAL_FETCH}
                </div>
              ) : null}

              {storiesTruncated ? (
                <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
                  {MSG_TOO_MANY_STORIES}
                </div>
              ) : null}

              {!storiesInconsistentDataset && storiesDiscardedInvalid > 0 ? (
                <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
                  Se omitieron {storiesDiscardedInvalid} historias por validacion de contexto o datos incompletos.
                </div>
              ) : null}

              <div data-testid="sprint-stories-table" className={wave1.tableSection}>
                {!storiesInconsistentDataset && storiesRawTotal === 0 ? (
                  <EmptyState
                    title="Sin historias en el sprint"
                    description="Asigna historias READY desde el panel superior o vincula trabajo al sprint."
                  />
                ) : !storiesInconsistentDataset && storyRows.length > 0 ? (
                  <DataTable
                    caption={`Historias · ${storyRows.length} fila(s)`}
                    columns={storyColumns}
                    rows={storyRows}
                    getRowKey={(row) => row.id}
                    renderCell={({ column, row, value }) => {
                      if (column.key === "title") {
                        return value ?? "—";
                      }
                      if (column.key === "status") {
                        return <Badge variant={mapStoryStatusToDsBadgeVariant(value)}>{String(value || "—")}</Badge>;
                      }
                      if (column.key === "actions") {
                        if (!sprintOpen || !canManageSprint) {
                          return <span className={wave1.meta}>—</span>;
                        }
                        return (
                          <Button
                            variant="secondary"
                            type="button"
                            disabled={busy}
                            onClick={() => removeStory(row.id)}
                          >
                            Quitar del sprint
                          </Button>
                        );
                      }
                      return value ?? "—";
                    }}
                  />
                ) : null}
              </div>
            </FormSection>
          </Card>

          <div className={`${wave1.navRow} ${wave1.footerNav}`}>
            <Button
              variant="secondary"
              type="button"
              data-testid="sprint-detail-nav-sprints"
              onClick={() => navigate(`/projects/${urlProjectId}/sprints`)}
            >
              Volver a sprints
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${urlProjectId}`)}>
              Volver al proyecto
            </Button>
            <Button
              variant="ghost"
              type="button"
              data-testid="sprint-detail-nav-backlog"
              onClick={() => navigate(`/projects/${urlProjectId}/backlog`)}
            >
              Ir a Backlog
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${urlProjectId}/features`)}>
              Ir a Features
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
              Volver a lista
            </Button>
          </div>
        </>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm && confirm.title}
        message={confirm && confirm.message}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => runConfirm()}
      />
    </div>
  );
}
