/**
 * Detalle de feature en ruta dedicada — misma tarjeta que el overlay del detalle de proyecto (nivel 1).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmModal from "../../../design-system/patterns/ConfirmModal/ConfirmModal.jsx";
import { isValidNexusUuid, logDev, setCachedProjectMeta } from "../../../shared/cache/domainWorkCache.js";
import {
  buildStoryDetailHref,
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_FEATURE,
} from "../../../shared/routing/storyDetailRouteContext.js";
import { listUsersNormalized } from "../../admin/adminService.js";
import { getProjectById } from "../../projects/index.js";
import * as featuresService from "../featuresService.js";
import * as storiesService from "../../stories/storiesService.js";
import { presentationForFeatureError } from "../errorPresentation.js";
import FeatureDetailCard from "../../projects/components/workspace/FeatureDetailCard.jsx";
import StoryDetailCard from "../../projects/components/workspace/StoryDetailCard.jsx";
import {
  HierarchyOverlayStack,
  HierarchyOverlayStackLayer,
} from "../../projects/components/workspace/HierarchyOverlayStack.jsx";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission } from "../../../auth/authorization.js";
import {
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_VISTA,
} from "../../projects/components/workspace/projectDetailConstants.js";
import pageStyles from "../styles/featureDetailPage.module.css";

const MSG_LOADING = "Cargando…";
const MSG_NOT_FOUND = "Elemento no encontrado";
const MSG_MISMATCH = "Elemento no pertenece a este contexto";

function resolveFeatureProjectId(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.project_id != null && String(raw.project_id).trim() !== "") {
    const p = String(raw.project_id).trim();
    return isValidNexusUuid(p) ? p : null;
  }
  return null;
}

export default function FeatureDetailPage() {
  const { user } = useAuth();
  const { projectId, featureId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWriteFeature = hasPermission(user, "feature:write");
  const tabQuery = (searchParams.get("tab") || "").trim().toLowerCase();
  const initialFeatureTab =
    canWriteFeature && tabQuery === "edicion" ? PROJECT_DETAIL_TAB_EDICION : PROJECT_DETAIL_TAB_VISTA;
  const canWriteStory = hasPermission(user, "story:write");

  const [featureDetail, setFeatureDetail] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [storyDetail, setStoryDetail] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState("");
  const [assignmentUsers, setAssignmentUsers] = useState([]);
  const [pendingStoryOverlayTab, setPendingStoryOverlayTab] = useState(PROJECT_DETAIL_TAB_VISTA);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlFeatureId = featureId != null ? String(featureId).trim() : "";
  const storyParam = searchParams.get("story") || "";
  const validStoryId = isValidNexusUuid(storyParam) ? storyParam : "";

  const clearStoryOnly = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("story");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openStoryInUrl = useCallback(
    (sid) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("story", String(sid));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const requestOpenStory = useCallback(
    (sid) => {
      setPendingStoryOverlayTab(PROJECT_DETAIL_TAB_VISTA);
      openStoryInUrl(String(sid));
    },
    [openStoryInUrl],
  );

  const requestOpenStoryEdit = useCallback(
    (sid) => {
      setPendingStoryOverlayTab(PROJECT_DETAIL_TAB_EDICION);
      openStoryInUrl(String(sid));
    },
    [openStoryInUrl],
  );

  const handleStoryRemovedFromFeatureBacklog = useCallback(
    (removedId) => {
      const rid = removedId != null ? String(removedId).trim() : "";
      if (rid && validStoryId && rid === validStoryId) {
        clearStoryOnly();
      }
    },
    [validStoryId, clearStoryOnly],
  );

  const refreshStories = useCallback(async () => {
    if (!isValidNexusUuid(urlFeatureId)) return;
    const items = await storiesService.listAllStoriesByFeature(urlFeatureId);
    setStories(items);
  }, [urlFeatureId]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setErrorPresentation(null);
    setFeatureDetail(null);
    setProjectData(null);
    setStories([]);
    try {
      const [rawFeature, project] = await Promise.all([
        featuresService.getFeature(urlFeatureId),
        getProjectById(urlProjectId),
      ]);

      if (!project || String(project.id) !== String(urlProjectId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }

      const effectiveProjectId = resolveFeatureProjectId(rawFeature);
      if (!effectiveProjectId || String(effectiveProjectId) !== String(urlProjectId)) {
        logDev("[FeatureDetailPage] mismatch proyecto", { urlProjectId, effectiveProjectId });
        setErrorPresentation({ tone: "danger", userMessage: MSG_MISMATCH });
        return;
      }

      setProjectData(project);
      setCachedProjectMeta(project.id, project.name);
      setFeatureDetail(rawFeature);

      const items = await storiesService.listAllStoriesByFeature(urlFeatureId);
      setStories(items);
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      if (code === "FEATURE_NOT_FOUND" || code === "PROJECT_NOT_FOUND") {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
      } else {
        setErrorPresentation(presentationForFeatureError(code));
      }
    } finally {
      setLoading(false);
    }
  }, [urlFeatureId, urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId) || !isValidNexusUuid(urlFeatureId)) {
      logDev("[FeatureDetailPage] UUID inválido", { urlProjectId, urlFeatureId });
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadWorkspace();
    return undefined;
  }, [navigate, urlFeatureId, urlProjectId, loadWorkspace]);

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

  useEffect(() => {
    if (!validStoryId || !isValidNexusUuid(urlFeatureId)) {
      setStoryDetail(null);
      setStoryError("");
      setStoryLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function loadStory() {
      setStoryLoading(true);
      setStoryError("");
      setStoryDetail(null);
      try {
        const s = await storiesService.getStory(validStoryId);
        if (cancelled) return;
        if (String(s.feature_id) !== String(urlFeatureId)) {
          setStoryError("La historia no pertenece a esta feature.");
          return;
        }
        setStoryDetail(s);
      } catch {
        if (!cancelled) setStoryError(MSG_NOT_FOUND);
      } finally {
        if (!cancelled) setStoryLoading(false);
      }
    }
    loadStory();
    return () => {
      cancelled = true;
    };
  }, [validStoryId, urlFeatureId]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (validStoryId) clearStoryOnly();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [validStoryId, clearStoryOnly]);

  const featurePagePath = useMemo(
    () => (isValidNexusUuid(urlProjectId) && isValidNexusUuid(urlFeatureId) ? `/projects/${urlProjectId}/features/${urlFeatureId}` : ""),
    [urlProjectId, urlFeatureId],
  );

  const storyOverlayBreadcrumbItems = useMemo(() => {
    if (!projectData || !featureDetail || !featurePagePath) return [];
    const featureTitle = featureDetail.title?.trim() ? featureDetail.title.trim() : "Feature";
    const storyTitle = storyDetail?.title?.trim() ? storyDetail.title.trim() : "Historia";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectData.name || "Proyecto", path: `/projects/${projectData.id}` },
      { label: "Features", path: `/projects/${projectData.id}/features` },
      { label: featureTitle, path: featurePagePath },
      { label: storyTitle },
    ];
  }, [projectData, featureDetail, storyDetail, featurePagePath]);

  const storyEvidenceHistoryResetKey = useMemo(
    () => [urlProjectId, urlFeatureId, validStoryId].filter(Boolean).join("|"),
    [urlProjectId, urlFeatureId, validStoryId],
  );

  const breadcrumbItems = useMemo(() => {
    if (!projectData || !featureDetail) return [];
    const title = featureDetail.title?.trim() ? featureDetail.title.trim() : "Feature";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectData.name || "Proyecto", path: `/projects/${projectData.id}` },
      { label: "Features", path: `/projects/${projectData.id}/features` },
      { label: title },
    ];
  }, [projectData, featureDetail]);

  async function handleDeleteConfirmed() {
    setConfirmDeleteOpen(false);
    setDeleteBusy(true);
    setErrorPresentation(null);
    try {
      await featuresService.deleteFeature(urlFeatureId);
      await navigate(`/projects/${urlProjectId}/features`, { replace: true });
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForFeatureError(code));
    } finally {
      setDeleteBusy(false);
    }
  }

  function messageClass() {
    if (!errorPresentation) return pageStyles.message;
    if (errorPresentation.tone === "danger") return `${pageStyles.message} ${pageStyles.messageDanger}`;
    if (errorPresentation.tone === "secondary") return `${pageStyles.message} ${pageStyles.messageSecondary}`;
    return pageStyles.message;
  }

  const showCard = !loading && !errorPresentation && projectData && featureDetail;

  return (
    <div className={pageStyles.page} data-testid="feature-detail-root">
      {loading ? (
        <div className={pageStyles.loading} data-testid="feature-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorPresentation ? (
        <div className={messageClass()} data-testid="feature-detail-message" role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {showCard ? (
        <div className={pageStyles.cardWrap} data-testid="feature-detail-card">
          <HierarchyOverlayStack>
            <HierarchyOverlayStackLayer depth={0} isTop={!validStoryId}>
              <FeatureDetailCard
                shellDepth={0}
                initialActiveTab={initialFeatureTab}
                feature={featureDetail}
                stories={stories}
                loading={false}
                error=""
                breadcrumbItems={breadcrumbItems}
                projectData={projectData}
                draftData={null}
                onDraftPatch={() => {}}
                onProjectSave={async () => {}}
                projectIsDirty={false}
                projectIsSaving={false}
                canEditProject={false}
                editBlocked
                evidenceHistoryResetKey={0}
                canWriteFeature={canWriteFeature}
                canWriteStory={canWriteStory}
                versionConflict={false}
                onReloadAfterConflict={null}
                projectSaveErrorMessage=""
                onFeatureUpdated={(updated) => setFeatureDetail(updated)}
                onRefreshStories={refreshStories}
                onClose={() => navigate(`/projects/${urlProjectId}/features`)}
                onOpenStory={requestOpenStory}
                onOpenStoryEdit={requestOpenStoryEdit}
                onRequestCreateStory={() =>
                  navigate(`/projects/${urlProjectId}?feature=${encodeURIComponent(urlFeatureId)}&createStory=1`)
                }
                onStoryRemovedFromBacklog={handleStoryRemovedFromFeatureBacklog}
                blockStoryOpen={storyLoading}
                onRequestDeleteFeature={canWriteFeature ? () => setConfirmDeleteOpen(true) : null}
                deleteFeatureDisabled={deleteBusy}
              />
            </HierarchyOverlayStackLayer>

            {validStoryId && projectData ? (
              <HierarchyOverlayStackLayer depth={1} isTop>
                <StoryDetailCard
                  story={storyDetail}
                  parentFeature={featureDetail}
                  initialActiveTab={canWriteStory ? pendingStoryOverlayTab : PROJECT_DETAIL_TAB_VISTA}
                  loading={storyLoading}
                  error={storyError}
                  breadcrumbItems={storyOverlayBreadcrumbItems}
                  projectData={projectData}
                  draftData={null}
                  onDraftPatch={() => {}}
                  onProjectSave={async () => {}}
                  projectIsDirty={false}
                  projectIsSaving={false}
                  canEditProject={false}
                  editBlocked
                  evidenceHistoryResetKey={storyEvidenceHistoryResetKey}
                  canWriteStory={canWriteStory}
                  versionConflict={false}
                  onReloadAfterConflict={null}
                  projectSaveErrorMessage=""
                  onStoryUpdated={(updated) => {
                    setStoryDetail(updated);
                    refreshStories();
                  }}
                  onClose={clearStoryOnly}
                  onOpenFullPage={() =>
                    navigate(
                      buildStoryDetailHref(urlProjectId, validStoryId, {
                        [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_FEATURE,
                      }),
                    )
                  }
                  assignmentUsers={assignmentUsers}
                  workOrdersRefreshNonce={0}
                  createWorkOrderPanelOpen={false}
                  onOpenCreateWorkOrderPanel={() =>
                    navigate(
                      buildStoryDetailHref(urlProjectId, validStoryId, {
                        [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_FEATURE,
                        createWorkOrder: "1",
                      }),
                    )
                  }
                  onCloseCreateWorkOrderPanel={() => {}}
                  onOpenWorkOrder={(woId) =>
                    navigate(
                      buildStoryDetailHref(urlProjectId, validStoryId, {
                        [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_FEATURE,
                        workOrder: String(woId),
                      }),
                    )
                  }
                />
              </HierarchyOverlayStackLayer>
            ) : null}
          </HierarchyOverlayStack>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Eliminar feature"
        message="Se eliminará esta feature. ¿Continuar?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
