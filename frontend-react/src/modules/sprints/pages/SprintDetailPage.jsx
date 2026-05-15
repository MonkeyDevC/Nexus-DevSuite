/**
 * ----
 * Modulo: SprintDetail
 * Descripcion: Detalle sprint (Admin UI System); metricas; lista de historias en DataTable; asignar/quitar historias.
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import ConfirmModal from "../../../design-system/patterns/ConfirmModal/ConfirmModal.jsx";
import {
  getCachedFeatureProjectId,
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
import { FormSection } from "../../../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../../../design-system/patterns/PageHeader/PageHeader.jsx";
import { mapStoryStatusToDsBadgeVariant } from "../../../shared/wave1/wave1DsMappers.js";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";
import {
  backlogListUrl,
  sprintEditUrl,
  sprintsListUrl,
} from "../../../shared/routing/workspaceNavUrls.js";
import hero from "./SprintDetailHero.module.css";

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

function sprintHeroUiBadgeClass(displayStatus) {
  if (displayStatus === "ACTIVE") return hero.badgeUiActive;
  if (displayStatus === "COMPLETED") return hero.badgeUiCompleted;
  return hero.badgeUiInactive;
}

function sprintHeroApiBadgeClass(apiStatus) {
  const s = apiStatus != null ? String(apiStatus).trim() : "";
  if (s === "IN_PROGRESS") return hero.badgeApiProgress;
  if (s === "CLOSED") return hero.badgeApiClosed;
  return hero.badgeApiPlanned;
}

function IconCalendarHero({ className }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconPencilHero({ className }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconAlertCircleHero({ className }) {
  return (
    <svg className={className} width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

function IconGearHero({ className }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconBookHero({ className }) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconCheckCircleHero({ className }) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  );
}

function IconLayersHero({ className }) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12.83 2.18 8.49 4.91a1 1 0 0 1 0 1.74l-8.49 4.91a2 2 0 0 1-2 0l-8.49-4.91a1 1 0 0 1 0-1.74l8.49-4.91a2 2 0 0 1 2 0Z" />
      <path d="M2.5 12.24v4.52a1 1 0 0 0 .5.87l8.25 4.76a2 2 0 0 0 2 0l8.25-4.76a1 1 0 0 0 .5-.87v-4.52" />
    </svg>
  );
}

function IconLayersCheckHero({ className }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12.83 2.18 8.49 4.91a1 1 0 0 1 0 1.74l-8.49 4.91a2 2 0 0 1-2 0l-8.49-4.91a1 1 0 0 1 0-1.74l8.49-4.91a2 2 0 0 1 2 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 12.24v4.52a1 1 0 0 0 .5.87l8.25 4.76a2 2 0 0 0 2 0l8.25-4.76a1 1 0 0 0 .5-.87v-4.52"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9.5 12.5 1.8 1.8 3.7-3.7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SprintDetailPage() {
  const { user } = useAuth();
  const { sprintId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectFromQuery = searchParams.get("project") != null ? String(searchParams.get("project")).trim() : "";
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

  const urlSprintId = sprintId != null ? String(sprintId).trim() : "";

  const loadDetail = useCallback(async () => {
    if (!isValidNexusUuid(urlSprintId)) return;

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
      const resolvedProjectId = sp.project_id != null ? String(sp.project_id).trim() : "";
      if (!isValidNexusUuid(resolvedProjectId)) {
        setErrorMessage(MSG_ERROR);
        return;
      }
      if (isValidNexusUuid(projectFromQuery) && projectFromQuery !== resolvedProjectId) {
        logDev("[SprintDetail] mismatch proyecto (query vs sprint)", { projectFromQuery, resolvedProjectId });
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

      const cachedProj = getCachedProjectMeta(resolvedProjectId);
      if (cachedProj) {
        setProjectName(cachedProj.name);
      } else {
        try {
          const pdata = await sprintService.getProject(resolvedProjectId);
          const np = normalizeProject(pdata);
          if (np && String(np.id) === String(resolvedProjectId)) {
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
      const built = groupStoriesForTable(rawStories, resolvedProjectId, urlSprintId);
      setStoryRows(built.flatRows);
      setStoriesRawTotal(built.totalRaw);
      setStoriesTruncated(built.truncated);
      setStoriesIncompleteFetch(Boolean(incompleteFetch));
      setStoriesDiscardedInvalid(built.discardedInvalid);
      setStoriesInconsistentDataset(built.inconsistentDataset);
      setSprint(sp);

      if (sp.status !== "CLOSED") {
        try {
          const ready = await sprintService.listReadyStoriesWithoutSprint(resolvedProjectId, { page: 1, limit: 100 });
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
  }, [projectFromQuery, urlSprintId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlSprintId)) {
      logDev("[SprintDetail] sprintId invalido", urlSprintId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadDetail();
    return undefined;
  }, [loadDetail, navigate, urlSprintId]);

  const scopeProjectId =
    sprint?.project_id != null && isValidNexusUuid(String(sprint.project_id).trim())
      ? String(sprint.project_id).trim()
      : "";

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: scopeProjectId ? `/projects/${scopeProjectId}` : undefined },
      {
        label: "Sprints",
        path: scopeProjectId ? sprintsListUrl(scopeProjectId) : undefined,
      },
      { label: sprint ? sprint.name : "Sprint" },
    ],
    [projectName, scopeProjectId, sprint]
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
        navigate(sprintsListUrl(sprint.project_id), { replace: true });
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
              <Button variant="secondary" type="button" onClick={() => navigate(sprintsListUrl(scopeProjectId))}>
                Lista sprints
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${scopeProjectId}`)}>
                Proyecto
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(backlogListUrl(scopeProjectId))}>
                Backlog
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${scopeProjectId}/features`)}>
                Features
              </Button>
              {sprint.status === "PLANNED" && canManageSprint ? (
                <>
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
          <section className={hero.shell} data-testid="sprint-detail-header" aria-label="Resumen del sprint">
            <div className={hero.topBar}>
              {sprint.status === "PLANNED" && canManageSprint ? (
                <button
                  type="button"
                  className={hero.editBtn}
                  disabled={busy}
                  onClick={() => navigate(sprintEditUrl(sprint.id))}
                >
                  <IconPencilHero className={hero.editIcon} />
                  Editar sprint
                </button>
              ) : null}
            </div>

            <div className={hero.headerMain}>
              <div className={hero.datesRow} data-testid="sprint-timeline">
                <div className={hero.dateBlock}>
                  <IconCalendarHero className={hero.dateIcon} />
                  <div>
                    <span className={hero.dateLabel}>Inicio</span>
                    <span className={hero.dateValue}>
                      {sprint.start_date ? sprint.start_date.slice(0, 10) : "—"}
                    </span>
                  </div>
                </div>
                <span className={hero.dateArrow} aria-hidden>
                  →
                </span>
                <div className={hero.dateBlock}>
                  <IconCalendarHero className={hero.dateIcon} />
                  <div>
                    <span className={hero.dateLabel}>Fin</span>
                    <span className={hero.dateValue}>
                      {sprint.end_date ? sprint.end_date.slice(0, 10) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={hero.dividerV} aria-hidden />

              <p className={sprint.goal ? hero.goal : `${hero.goal} ${hero.goalMuted}`}>
                {sprint.goal ? sprint.goal : "Sin objetivo definido."}
              </p>

              <div className={hero.statusCol}>
                <div className={hero.statusRow}>
                  <span className={hero.statusLabel}>
                    <IconAlertCircleHero className={hero.statusIconUi} />
                    Estado (UI)
                  </span>
                  <span className={`${hero.badge} ${sprintHeroUiBadgeClass(displayStatus)}`}>{displayStatus}</span>
                </div>
                <div className={hero.statusRow}>
                  <span className={hero.statusLabel}>
                    <IconGearHero className={hero.statusIconApi} />
                    Estado API
                  </span>
                  <span className={`${hero.badge} ${sprintHeroApiBadgeClass(sprint.status)}`}>
                    {sprint.status || "—"}
                  </span>
                </div>
              </div>
            </div>

            {metrics ? (
              <div data-testid="sprint-metrics">
                <div className={hero.statsGrid}>
                  <div className={hero.statTile}>
                    <IconBookHero className={hero.statIcon} />
                    <div className={hero.statBody}>
                      <span className={hero.statLabel}>Historias</span>
                      <span className={hero.statValue}>{String(metrics.stories_count)}</span>
                    </div>
                  </div>
                  <div className={hero.statTile}>
                    <IconCheckCircleHero className={hero.statIcon} />
                    <div className={hero.statBody}>
                      <span className={hero.statLabel}>Completadas</span>
                      <span className={hero.statValue}>{String(metrics.stories_done_count)}</span>
                    </div>
                  </div>
                  <div className={hero.statTile}>
                    <IconLayersHero className={hero.statIcon} />
                    <div className={hero.statBody}>
                      <span className={hero.statLabel}>Story points</span>
                      <span className={hero.statValue}>{String(metrics.total_story_points)}</span>
                    </div>
                  </div>
                  <div className={hero.statTile}>
                    <IconLayersCheckHero className={hero.statIcon} />
                    <div className={hero.statBody}>
                      <span className={hero.statLabel}>SP completados</span>
                      <span className={hero.statValue}>{String(metrics.completed_story_points)}</span>
                    </div>
                  </div>
                </div>
                {completionPct != null ? (
                  <div className={hero.progressBlock}>
                    <p className={hero.progressLabel}>Progreso por historias completadas</p>
                    <div className={hero.progressTrack}>
                      <div
                        className={hero.progressFill}
                        style={{ width: `${completionPct}%` }}
                        role="progressbar"
                        aria-valuenow={completionPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className={hero.progressPct}>{completionPct}%</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <p className={hero.footerId}>ID: {sprint.id}</p>
          </section>

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

          <section
            className={hero.shell}
            data-testid="sprint-detail-stories"
            aria-labelledby="sprint-stories-heading"
          >
            <h2 id="sprint-stories-heading" className={hero.storiesHeading}>
              Historias del sprint
            </h2>
            <p className={hero.storiesDescription}>
              Listado administrativo. Una fase posterior puede añadir tablero u otro workspace.
            </p>

            <div className={hero.storiesStack}>
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

              <div data-testid="sprint-stories-table" className={hero.storiesTableSection}>
                {!storiesInconsistentDataset && storiesRawTotal === 0 ? (
                  <div className={hero.emptyStories} role="status">
                    <p className={hero.emptyStoriesTitle}>Sin historias en el sprint</p>
                    <p className={hero.emptyStoriesDesc}>
                      Asigna historias READY desde el panel superior o vincula trabajo al sprint.
                    </p>
                  </div>
                ) : !storiesInconsistentDataset && storyRows.length > 0 ? (
                  <DataTable
                    caption={`Historias · ${storyRows.length} fila(s)`}
                    columns={storyColumns}
                    rows={storyRows}
                    getRowKey={(row) => row.id}
                    wrapClassName={hero.tableWrapDark}
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
            </div>
          </section>

          <div className={`${wave1.navRow} ${wave1.footerNav}`}>
            <Button
              variant="secondary"
              type="button"
              data-testid="sprint-detail-nav-sprints"
              onClick={() => navigate(sprintsListUrl(scopeProjectId))}
            >
              Volver al Sprint Backlog
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${scopeProjectId}`)}>
              Volver al proyecto
            </Button>
            <Button
              variant="ghost"
              type="button"
              data-testid="sprint-detail-nav-backlog"
              onClick={() => navigate(backlogListUrl(scopeProjectId))}
            >
              Ir a Backlog
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${scopeProjectId}/features`)}>
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
