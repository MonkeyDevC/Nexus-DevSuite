/**
 * Detalle de historia en ruta dedicada — mismo shell/tarjeta que el overlay en Feature (StoryDetailCard).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmModal from "../../../design-system/patterns/ConfirmModal/ConfirmModal.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import {
  getCachedFeatureProjectId,
  isValidNexusUuid,
  logDev,
  setCachedFeatureProjectId,
  setCachedProjectMeta,
} from "../../../shared/cache/domainWorkCache.js";
import { listUsersNormalized } from "../../admin/adminService.js";
import { getProjectById } from "../../projects/index.js";
import * as featuresService from "../../features/featuresService.js";
import * as storiesService from "../storiesService.js";
import { presentationForStoryError } from "../errorPresentation.js";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission } from "../../../auth/authorization.js";
import StoryDetailCard from "../../projects/components/workspace/StoryDetailCard.jsx";
import {
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_VISTA,
  STORY_DETAIL_TAB_WORK_ORDERS,
} from "../../projects/components/workspace/projectDetailConstants.js";
import { backlogListUrl } from "../../../shared/routing/workspaceNavUrls.js";
import {
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_USER_STORIES,
  STORY_DETAIL_FROM_BACKLOG,
  STORY_DETAIL_FROM_FEATURE,
  STORY_DETAIL_FROM_PROJECT,
  STORY_DETAIL_FEATURE_FILTER_QUERY,
} from "../../../shared/routing/storyDetailRouteContext.js";
import pageStyles from "./StoryDetailPage.module.css";

const MSG_LOADING = "Cargando…";
const MSG_NOT_FOUND = "Elemento no encontrado";
const MSG_MISMATCH = "Elemento no pertenece a este contexto";

function normalizeFeature(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) return null;
  const project_id = raw.project_id != null ? String(raw.project_id).trim() : "";
  if (!project_id || !isValidNexusUuid(project_id)) return null;
  return { id, title, project_id };
}

export default function StoryDetailPage() {
  const { user } = useAuth();
  const { projectId, storyId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWriteStory = hasPermission(user, "story:write");

  const [story, setStory] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [parentFeature, setParentFeature] = useState(null);
  const [assignmentUsers, setAssignmentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [workOrdersRefreshNonce, setWorkOrdersRefreshNonce] = useState(0);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlStoryId = storyId != null ? String(storyId).trim() : "";

  const createWorkOrderPanelOpen = searchParams.get("createWorkOrder") === "1";
  const workOrderParam = searchParams.get("workOrder");
  const tabQuery = (searchParams.get("tab") || "").trim().toLowerCase();

  const initialStoryTab = useMemo(() => {
    if (createWorkOrderPanelOpen || (workOrderParam != null && String(workOrderParam).trim() !== "")) {
      return STORY_DETAIL_TAB_WORK_ORDERS;
    }
    if (tabQuery === "edicion" && canWriteStory) return PROJECT_DETAIL_TAB_EDICION;
    return PROJECT_DETAIL_TAB_VISTA;
  }, [createWorkOrderPanelOpen, workOrderParam, tabQuery, canWriteStory]);

  const openCreateWorkOrderInUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("createWorkOrder", "1");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const closeCreateWorkOrderInUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("createWorkOrder");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openWorkOrderInUrl = useCallback(
    (woId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("workOrder", String(woId));
          next.delete("createWorkOrder");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const loadStory = useCallback(async () => {
    setLoading(true);
    setErrorPresentation(null);
    setStory(null);
    setProjectData(null);
    setParentFeature(null);
    try {
      const raw = await storiesService.getStory(urlStoryId);
      const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
      if (!title || String(raw.id) !== String(urlStoryId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }

      let effectiveProjectId = "";
      let featureIdForLoad = "";
      if (raw.feature_id != null) {
        const fid = String(raw.feature_id).trim();
        if (isValidNexusUuid(fid)) {
          featureIdForLoad = fid;
          const cached = getCachedFeatureProjectId(fid);
          if (cached) effectiveProjectId = String(cached).trim();
          else {
            const feat = await featuresService.getFeature(fid);
            const nf = normalizeFeature(feat);
            if (nf && nf.project_id) {
              effectiveProjectId = nf.project_id;
              setCachedFeatureProjectId(fid, effectiveProjectId);
            }
          }
        }
      }

      if (!effectiveProjectId || !isValidNexusUuid(effectiveProjectId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }
      if (String(effectiveProjectId) !== String(urlProjectId)) {
        setErrorPresentation({ tone: "danger", userMessage: MSG_MISMATCH });
        return;
      }

      const [project, featureRaw] = await Promise.all([
        getProjectById(urlProjectId),
        isValidNexusUuid(featureIdForLoad) ? featuresService.getFeature(featureIdForLoad) : Promise.resolve(null),
      ]);

      if (!project || String(project.id) !== String(urlProjectId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }

      const nf = normalizeFeature(featureRaw);
      if (!nf || String(nf.project_id) !== String(urlProjectId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }

      setStory(raw);
      setProjectData(project);
      setParentFeature(featureRaw);
      setCachedProjectMeta(project.id, project.name);
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForStoryError(code));
    } finally {
      setLoading(false);
    }
  }, [urlProjectId, urlStoryId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId) || !isValidNexusUuid(urlStoryId)) {
      logDev("[StoryDetail] fallback navegacion: params UUID invalidos", { urlProjectId, urlStoryId });
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadStory();
    return undefined;
  }, [navigate, urlProjectId, urlStoryId, loadStory]);

  useEffect(() => {
    let cancelled = false;
    listUsersNormalized({ page: 1, limit: 200 })
      .then((r) => {
        if (!cancelled) setAssignmentUsers(Array.isArray(r.items) ? r.items : []);
      })
      .catch(() => {
        if (!cancelled) setAssignmentUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateAfterClose = useCallback(() => {
    const fromParam = searchParams.get(STORY_DETAIL_FROM_QUERY) || "";
    const featureFilter = searchParams.get(STORY_DETAIL_FEATURE_FILTER_QUERY) || "";
    const fid = story?.feature_id != null ? String(story.feature_id).trim() : "";

    if (fromParam === STORY_DETAIL_FROM_USER_STORIES) {
      const f = featureFilter || fid;
      if (f && isValidNexusUuid(f)) {
        navigate(`/projects/${urlProjectId}/user-stories?${STORY_DETAIL_FEATURE_FILTER_QUERY}=${encodeURIComponent(f)}`);
      } else {
        navigate(`/projects/${urlProjectId}/user-stories`);
      }
      return;
    }
    if (fromParam === STORY_DETAIL_FROM_BACKLOG) {
      navigate(backlogListUrl(urlProjectId));
      return;
    }
    if (fromParam === STORY_DETAIL_FROM_PROJECT) {
      navigate(`/projects/${urlProjectId}`);
      return;
    }
    if (fromParam === STORY_DETAIL_FROM_FEATURE && parentFeature?.id && isValidNexusUuid(String(parentFeature.id))) {
      navigate(`/projects/${urlProjectId}/features/${String(parentFeature.id).trim()}`);
      return;
    }
    if (fid && isValidNexusUuid(fid)) {
      navigate(`/projects/${urlProjectId}/features/${fid}`);
      return;
    }
    navigate(`/projects/${urlProjectId}`);
  }, [searchParams, story, navigate, urlProjectId, parentFeature]);

  async function handleDeleteConfirmed() {
    setConfirmDeleteOpen(false);
    setDeleteBusy(true);
    setErrorPresentation(null);
    try {
      const fromParam = searchParams.get(STORY_DETAIL_FROM_QUERY) || "";
      const featureFilter = searchParams.get(STORY_DETAIL_FEATURE_FILTER_QUERY) || "";
      const fid = story && story.feature_id ? String(story.feature_id) : null;
      await storiesService.deleteStory(urlStoryId);

      if (fromParam === STORY_DETAIL_FROM_USER_STORIES) {
        const f = featureFilter || fid || "";
        if (f && isValidNexusUuid(f)) {
          await navigate(`/projects/${urlProjectId}/user-stories?${STORY_DETAIL_FEATURE_FILTER_QUERY}=${encodeURIComponent(f)}`, {
            replace: true,
          });
        } else {
          await navigate(`/projects/${urlProjectId}/user-stories`, { replace: true });
        }
        return;
      }
      if (fromParam === STORY_DETAIL_FROM_BACKLOG) {
        await navigate(backlogListUrl(urlProjectId), { replace: true });
        return;
      }
      if (fromParam === STORY_DETAIL_FROM_PROJECT) {
        await navigate(`/projects/${urlProjectId}`, { replace: true });
        return;
      }
      if (fid && isValidNexusUuid(fid)) {
        await navigate(`/projects/${urlProjectId}/features/${fid}`, { replace: true });
      } else {
        await navigate(`/projects/${urlProjectId}/features`, { replace: true });
      }
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForStoryError(code));
    } finally {
      setDeleteBusy(false);
    }
  }

  const featurePagePath = useMemo(() => {
    if (!isValidNexusUuid(urlProjectId) || !parentFeature?.id) return "";
    return `/projects/${urlProjectId}/features/${String(parentFeature.id).trim()}`;
  }, [urlProjectId, parentFeature]);

  const storyBreadcrumbItems = useMemo(() => {
    if (!projectData || !parentFeature) return [];
    const fromParam = searchParams.get(STORY_DETAIL_FROM_QUERY) || "";
    const featureFilter = searchParams.get(STORY_DETAIL_FEATURE_FILTER_QUERY) || "";
    const featureTitle = parentFeature.title?.trim() ? parentFeature.title.trim() : "Feature";
    const storyTitle = story?.title?.trim() ? story.title.trim() : "Historia";
    const projectPath = `/projects/${projectData.id}`;
    const featuresPath = `${projectPath}/features`;
    const userStoriesPath =
      featureFilter && isValidNexusUuid(featureFilter)
        ? `${projectPath}/user-stories?${STORY_DETAIL_FEATURE_FILTER_QUERY}=${encodeURIComponent(featureFilter)}`
        : `${projectPath}/user-stories`;

    const base = [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectData.name || "Proyecto", path: projectPath },
    ];

    if (fromParam === STORY_DETAIL_FROM_USER_STORIES) {
      return [
        ...base,
        { label: "User Stories", path: userStoriesPath },
        { label: featureTitle, path: featurePagePath },
        { label: storyTitle },
      ];
    }
    if (fromParam === STORY_DETAIL_FROM_BACKLOG) {
      return [...base, { label: "Backlog", path: backlogListUrl(projectData.id) }, { label: storyTitle }];
    }
    if (fromParam === STORY_DETAIL_FROM_PROJECT) {
      return [
        ...base,
        { label: "Detalle proyecto", path: projectPath },
        { label: featureTitle, path: featurePagePath },
        { label: storyTitle },
      ];
    }
    if (!featurePagePath) {
      return [...base, { label: storyTitle }];
    }
    return [
      ...base,
      { label: "Features", path: featuresPath },
      { label: featureTitle, path: featurePagePath },
      { label: storyTitle },
    ];
  }, [projectData, parentFeature, featurePagePath, story, searchParams]);

  const evidenceHistoryResetKey = useMemo(
    () => [urlProjectId, parentFeature?.id, urlStoryId].filter(Boolean).join("|"),
    [urlProjectId, parentFeature, urlStoryId],
  );

  function messageClass() {
    if (!errorPresentation) return pageStyles.message;
    if (errorPresentation.tone === "danger") return `${pageStyles.message} ${pageStyles.messageDanger}`;
    if (errorPresentation.tone === "secondary") return `${pageStyles.message} ${pageStyles.messageSecondary}`;
    return pageStyles.message;
  }

  const showCard = !loading && !errorPresentation && story && projectData && parentFeature;

  return (
    <div className={pageStyles.page} data-testid="story-detail-root">
      {loading ? (
        <div className={pageStyles.loading} data-testid="story-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorPresentation ? (
        <div className={messageClass()} data-testid="story-detail-message" role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {showCard ? (
        <div className={pageStyles.cardWrap}>
          <StoryDetailCard
            story={story}
            parentFeature={parentFeature}
            initialActiveTab={initialStoryTab}
            rootDataTestId="story-detail-card"
            loading={false}
            error=""
            breadcrumbItems={storyBreadcrumbItems}
            projectData={projectData}
            draftData={null}
            onDraftPatch={() => {}}
            onProjectSave={async () => {}}
            projectIsDirty={false}
            projectIsSaving={false}
            canEditProject={false}
            editBlocked
            evidenceHistoryResetKey={evidenceHistoryResetKey}
            canWriteStory={canWriteStory}
            versionConflict={false}
            onReloadAfterConflict={null}
            projectSaveErrorMessage=""
            onStoryUpdated={(updated) => {
              setStory(updated);
              setWorkOrdersRefreshNonce((n) => n + 1);
            }}
            onClose={navigateAfterClose}
            assignmentUsers={assignmentUsers}
            workOrdersRefreshNonce={workOrdersRefreshNonce}
            createWorkOrderPanelOpen={createWorkOrderPanelOpen}
            onOpenCreateWorkOrderPanel={openCreateWorkOrderInUrl}
            onCloseCreateWorkOrderPanel={closeCreateWorkOrderInUrl}
            onOpenWorkOrder={openWorkOrderInUrl}
            footerLeftExtras={
              canWriteStory ? (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deleteBusy}
                  data-testid="story-detail-delete-open"
                >
                  Eliminar historia
                </Button>
              ) : null
            }
          />
        </div>
      ) : null}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Eliminar historia"
        message="Se eliminará esta historia. ¿Continuar?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        confirmLabel="Eliminar"
      />
    </div>
  );
}