/**
 * Estación de trabajo: portal + SSOT projectData, borrador draftData, único guardado, stack feature/story.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProjectContext } from "../../context/ProjectContext.jsx";
import { useAuth } from "../../../../app/context/AuthContext.jsx";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../../auth/authorization.js";
import { isValidNexusUuid, logDev, setCachedProjectMeta } from "../../../../shared/cache/domainWorkCache.js";
import {
  buildStoryDetailHref,
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_PROJECT,
} from "../../../../shared/routing/storyDetailRouteContext.js";
import * as featuresService from "../../../../modules/features/featuresService.js";
import * as storiesService from "../../../../modules/stories/storiesService.js";
import { getBacklogFeaturesForProject } from "../../../../modules/backlog/backlogService.js";
import { mapFeatureDto } from "../../../../modules/features/featureDto.js";
import { buildCompiledProjectEvidenceMarkdown } from "../../utils/buildCompiledProjectEvidenceMarkdown.js";
import stack from "../../styles/projectDetailStack.module.css";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import DetailTabList from "./DetailTabList.jsx";
import WorkspaceStickyFooter from "./WorkspaceStickyFooter.jsx";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import ProjectWorkspaceContent from "./ProjectWorkspaceContent.jsx";
import FeatureDetailCard from "./FeatureDetailCard.jsx";
import StoryDetailCard from "./StoryDetailCard.jsx";
import FeatureCreateOverlayCard from "./FeatureCreateOverlayCard.jsx";
import StoryCreateOverlayCard from "./StoryCreateOverlayCard.jsx";
import WorkOrderDetailOverlay from "../../../work-orders/overlays/WorkOrderDetailOverlay.jsx";
import { listUsersNormalized } from "../../../admin/adminService.js";
import { HierarchyOverlayStack, HierarchyOverlayStackLayer } from "./HierarchyOverlayStack.jsx";
import { DetailWorkspaceShell } from "./DetailWorkspaceShell.jsx";
import {
  PROJECT_DETAIL_DISCARD_CONFIRM_MESSAGE,
  PROJECT_DETAIL_TAB_BACKLOG,
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_EVIDENCIA,
  PROJECT_DETAIL_TAB_VISTA,
} from "./projectDetailConstants.js";
import {
  buildProjectDraftFromServer,
  buildProjectUpdatePayload,
  isProjectWorkspaceDirty,
} from "./projectDetailStateUtils.js";

const MSG_ERROR = "Error cargando datos";
const MSG_NOT_FOUND = "Elemento no encontrado";

export default function ProjectDetailWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { loadProject: loadProjectById, updateProject, archiveProject, deleteProject } = useProjectContext();
  const canEditProject = hasPermission(user, "project:update");
  const canWriteFeature = hasPermission(user, "feature:write");
  const canWriteStory = hasPermission(user, "story:write");
  const isMaster = hasRole(user, ROLE_MASTER);
  const canArchiveProject = isMaster;
  const canDeleteProject = isMaster;
  const canReleases = hasPermission(user, "release:access");

  const [projectData, setProjectData] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorLoadMessage, setErrorLoadMessage] = useState("");
  const [activeTab, setActiveTab] = useState(PROJECT_DETAIL_TAB_VISTA);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState("");
  const [versionConflict, setVersionConflict] = useState(false);
  const [busyDestructive, setBusyDestructive] = useState(false);
  const [evidenceHistoryNonce, setEvidenceHistoryNonce] = useState(0);

  const [compiledProjectEvidenceMarkdown, setCompiledProjectEvidenceMarkdown] = useState("");
  const [compiledProjectEvidenceLoading, setCompiledProjectEvidenceLoading] = useState(false);
  const [compiledProjectEvidenceError, setCompiledProjectEvidenceError] = useState("");
  const [compiledProjectEvidenceRefreshNonce, setCompiledProjectEvidenceRefreshNonce] = useState(0);
  const [projectLayerEvidenceContentNonce, setProjectLayerEvidenceContentNonce] = useState(0);

  const [backlogFeatures, setBacklogFeatures] = useState([]);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [backlogError, setBacklogError] = useState("");

  const [featureDetail, setFeatureDetail] = useState(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureError, setFeatureError] = useState("");
  const [featureStories, setFeatureStories] = useState([]);

  const [storyDetail, setStoryDetail] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState("");
  /** Pestaña inicial del overlay de feature al abrirlo desde el backlog (vista vs edición). */
  const [pendingFeatureOverlayTab, setPendingFeatureOverlayTab] = useState(PROJECT_DETAIL_TAB_VISTA);
  /** Pestaña inicial del overlay de historia (Ver vs Editar), alineado al backlog de features. */
  const [pendingStoryOverlayTab, setPendingStoryOverlayTab] = useState(PROJECT_DETAIL_TAB_VISTA);

  const urlProjectId = id != null ? String(id).trim() : "";
  const featureParam = searchParams.get("feature") || "";
  const storyParam = searchParams.get("story") || "";
  const createFeatureParam = searchParams.get("createFeature") || "";
  const createStoryParam = searchParams.get("createStory") || "";
  const workOrderParam = searchParams.get("workOrder") || "";
  const createWorkOrderParam = searchParams.get("createWorkOrder") || "";

  const projectDraftBaseline = useMemo(
    () => (projectData ? buildProjectDraftFromServer(projectData) : null),
    [projectData],
  );

  const isDirty = useMemo(
    () => isProjectWorkspaceDirty(draftData, projectDraftBaseline),
    [draftData, projectDraftBaseline],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const validFeatureId = isValidNexusUuid(featureParam) ? featureParam : "";
  const validStoryId = isValidNexusUuid(storyParam) ? storyParam : "";
  const validWorkOrderId = isValidNexusUuid(workOrderParam) ? workOrderParam : "";
  const isCreateFeatureOpen = createFeatureParam === "1";
  const isCreateStoryOpen = createStoryParam === "1";
  const isCreateWorkOrderOpen = createWorkOrderParam === "1";

  const [assignmentUsers, setAssignmentUsers] = useState([]);
  const [workOrdersRefreshNonce, setWorkOrdersRefreshNonce] = useState(0);

  const bumpWorkOrdersList = useCallback(() => {
    setWorkOrdersRefreshNonce((n) => n + 1);
  }, []);

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

  const bumpEvidenceHistory = useCallback(() => {
    setEvidenceHistoryNonce((n) => n + 1);
  }, []);

  const evidenceHistoryResetKey = useMemo(() => {
    if (!projectData) return "";
    return [String(projectData.id), validFeatureId, validStoryId, evidenceHistoryNonce].join("|");
  }, [projectData, validFeatureId, validStoryId, evidenceHistoryNonce]);

  const projectLayerEvidenceHistoryKey = useMemo(() => {
    if (!projectData) return "";
    return [
      String(projectData.id),
      "project-evidence-aggregate",
      evidenceHistoryNonce,
      projectLayerEvidenceContentNonce,
    ].join("|");
  }, [projectData, evidenceHistoryNonce, projectLayerEvidenceContentNonce]);

  const bumpCompiledProjectEvidence = useCallback(() => {
    setCompiledProjectEvidenceRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (activeTab !== PROJECT_DETAIL_TAB_EVIDENCIA || !projectData?.id) return undefined;
    let cancelled = false;
    setCompiledProjectEvidenceLoading(true);
    setCompiledProjectEvidenceError("");
    (async () => {
      try {
        const data = await getBacklogFeaturesForProject(projectData.id);
        const items = data && Array.isArray(data.items) ? data.items : [];
        const mapped = items.map((raw) => mapFeatureDto(raw)).filter(Boolean);
        const storyMap = new Map();
        await Promise.all(
          mapped.map(async (feature) => {
            const stories = await storiesService.listAllStoriesByFeature(feature.id);
            storyMap.set(String(feature.id), Array.isArray(stories) ? stories : []);
          }),
        );
        if (cancelled) return;
        const md = buildCompiledProjectEvidenceMarkdown(mapped, storyMap);
        setCompiledProjectEvidenceMarkdown(md);
        setProjectLayerEvidenceContentNonce((n) => n + 1);
      } catch {
        if (!cancelled) {
          setCompiledProjectEvidenceError(MSG_ERROR);
          setCompiledProjectEvidenceMarkdown("");
        }
      } finally {
        if (!cancelled) setCompiledProjectEvidenceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, projectData?.id, compiledProjectEvidenceRefreshNonce]);

  const clearStoryOnly = useCallback(() => {
    setPendingStoryOverlayTab(PROJECT_DETAIL_TAB_VISTA);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("story");
        n.delete("createStory");
        n.delete("workOrder");
        n.delete("createWorkOrder");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const clearCreateFeatureOnly = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("createFeature");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const clearCreateStoryOnly = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("createStory");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const clearFeatureStack = useCallback(() => {
    setPendingFeatureOverlayTab(PROJECT_DETAIL_TAB_VISTA);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("feature");
        n.delete("story");
        n.delete("createFeature");
        n.delete("createStory");
        n.delete("workOrder");
        n.delete("createWorkOrder");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openFeatureInUrl = useCallback(
    (fid) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("feature", fid);
          n.delete("story");
          n.delete("createFeature");
          n.delete("createStory");
          n.delete("workOrder");
          n.delete("createWorkOrder");
          return n;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openCreateFeatureInUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("createFeature", "1");
        n.delete("feature");
        n.delete("story");
        n.delete("createStory");
        n.delete("workOrder");
        n.delete("createWorkOrder");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openCreateStoryInUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("createStory", "1");
        n.delete("story");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openStoryInUrl = useCallback(
    (sid) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("story", sid);
          n.delete("createStory");
          n.delete("workOrder");
          n.delete("createWorkOrder");
          return n;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearWorkOrderOnly = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("workOrder");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const clearCreateWorkOrderOnly = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("createWorkOrder");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openWorkOrderInUrl = useCallback(
    (workOrderId) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("workOrder", String(workOrderId));
          n.delete("createWorkOrder");
          return n;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openCreateWorkOrderInUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("createWorkOrder", "1");
        n.delete("workOrder");
        return n;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const revertDraftFromServer = useCallback(() => {
    if (!projectData) return;
    setDraftData(buildProjectDraftFromServer(projectData));
    bumpEvidenceHistory();
  }, [projectData, bumpEvidenceHistory]);

  const [confirmDialog, setConfirmDialog] = useState(() => ({
    open: false,
    tone: "question",
    title: "",
    description: "",
    confirmLabel: "Aceptar",
    cancelLabel: "Cancelar",
    confirmVariant: "primary",
    onConfirm: null,
  }));

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  }, []);

  const openConfirmDialog = useCallback((next) => {
    setConfirmDialog({
      open: true,
      tone: next.tone || "question",
      title: next.title,
      description: next.description,
      confirmLabel: next.confirmLabel || "Aceptar",
      cancelLabel: next.cancelLabel ?? "Cancelar",
      confirmVariant: next.confirmVariant || "primary",
      onConfirm: typeof next.onConfirm === "function" ? next.onConfirm : null,
    });
  }, []);

  const runAfterDiscardOk = useCallback(
    (action) => {
      if (!isDirty) {
        action();
        return;
      }
      openConfirmDialog({
        tone: "question",
        title: "Descartar cambios del proyecto",
        description: PROJECT_DETAIL_DISCARD_CONFIRM_MESSAGE,
        confirmLabel: "Descartar y continuar",
        cancelLabel: "Cancelar",
        confirmVariant: "danger",
        onConfirm: () => {
          revertDraftFromServer();
          action();
        },
      });
    },
    [isDirty, revertDraftFromServer, openConfirmDialog],
  );

  const requestTabChange = useCallback(
    (next) => {
      if (next === activeTab) return;
      runAfterDiscardOk(() => setActiveTab(next));
    },
    [activeTab, runAfterDiscardOk],
  );

  const requestOpenFeature = useCallback(
    (fid) => {
      runAfterDiscardOk(() => {
        setPendingFeatureOverlayTab(PROJECT_DETAIL_TAB_VISTA);
        openFeatureInUrl(String(fid));
      });
    },
    [runAfterDiscardOk, openFeatureInUrl],
  );

  const requestOpenFeatureEdit = useCallback(
    (fid) => {
      runAfterDiscardOk(() => {
        setPendingFeatureOverlayTab(PROJECT_DETAIL_TAB_EDICION);
        openFeatureInUrl(String(fid));
      });
    },
    [runAfterDiscardOk, openFeatureInUrl],
  );

  const handleFeatureRemovedFromBacklog = useCallback(
    (featureId) => {
      if (featureId != null && String(validFeatureId) === String(featureId)) {
        clearFeatureStack();
      }
    },
    [validFeatureId, clearFeatureStack],
  );

  const requestCreateFeature = useCallback(() => {
    runAfterDiscardOk(() => openCreateFeatureInUrl());
  }, [runAfterDiscardOk, openCreateFeatureInUrl]);

  const requestCreateStory = useCallback(() => {
    runAfterDiscardOk(() => openCreateStoryInUrl());
  }, [runAfterDiscardOk, openCreateStoryInUrl]);

  const requestOpenStory = useCallback(
    (sid) => {
      runAfterDiscardOk(() => {
        setPendingStoryOverlayTab(PROJECT_DETAIL_TAB_VISTA);
        openStoryInUrl(String(sid));
      });
    },
    [runAfterDiscardOk, openStoryInUrl],
  );

  const requestOpenStoryEdit = useCallback(
    (sid) => {
      runAfterDiscardOk(() => {
        setPendingStoryOverlayTab(PROJECT_DETAIL_TAB_EDICION);
        openStoryInUrl(String(sid));
      });
    },
    [runAfterDiscardOk, openStoryInUrl],
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

  const requestCloseWorkspace = useCallback(() => {
    runAfterDiscardOk(() => navigate("/projects", { replace: false }));
  }, [navigate, runAfterDiscardOk]);

  useEffect(() => {
    let cancelled = false;

    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[ProjectDetailWorkspace] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }

    async function loadProjectData() {
      setLoading(true);
      setErrorLoadMessage("");
      setProjectData(null);
      setDraftData(null);
      setSaveErrorMessage("");
      setVersionConflict(false);
      try {
        const data = await loadProjectById(urlProjectId);
        if (cancelled) return;
        if (!data || String(data.id) !== String(urlProjectId)) {
          setErrorLoadMessage(MSG_NOT_FOUND);
          return;
        }
        setCachedProjectMeta(data.id, data.name);
        setProjectData(data);
        setDraftData(buildProjectDraftFromServer(data));
      } catch (error) {
        if (cancelled) return;
        const nextMessage = error && error.code === "PROJECT_NOT_FOUND" ? MSG_NOT_FOUND : MSG_ERROR;
        setErrorLoadMessage(nextMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProjectData();
    return () => {
      cancelled = true;
    };
  }, [navigate, urlProjectId, loadProjectById]);

  useEffect(() => {
    setEvidenceHistoryNonce(0);
  }, [urlProjectId]);

  useEffect(() => {
    if (featureParam && !isValidNexusUuid(featureParam)) {
      clearFeatureStack();
    }
    if (storyParam && !isValidNexusUuid(storyParam)) {
      clearStoryOnly();
    }
    if (workOrderParam && !isValidNexusUuid(workOrderParam)) {
      clearWorkOrderOnly();
    }
  }, [featureParam, storyParam, workOrderParam, clearFeatureStack, clearStoryOnly, clearWorkOrderOnly]);

  useEffect(() => {
    if (!projectData || activeTab !== PROJECT_DETAIL_TAB_BACKLOG) return;
    let cancelled = false;
    async function load() {
      setBacklogLoading(true);
      setBacklogError("");
      try {
        const data = await getBacklogFeaturesForProject(projectData.id);
        if (cancelled) return;
        const items = data && Array.isArray(data.items) ? data.items : [];
        setBacklogFeatures(items);
      } catch (e) {
        if (!cancelled) {
          const msg =
            e && e.isDomainError && e.message
              ? String(e.message)
              : e && e.message
                ? String(e.message)
                : MSG_ERROR;
          setBacklogError(msg);
        }
      } finally {
        if (!cancelled) setBacklogLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectData, activeTab]);

  useEffect(() => {
    if (!validFeatureId || !projectData) {
      setFeatureDetail(null);
      setFeatureStories([]);
      setFeatureError("");
      return;
    }
    let cancelled = false;
    async function load() {
      setFeatureLoading(true);
      setFeatureError("");
      setFeatureDetail(null);
      setFeatureStories([]);
      try {
        const raw = await featuresService.getFeature(validFeatureId);
        if (cancelled) return;
        const pid = raw.project_id != null ? String(raw.project_id).trim() : "";
        if (pid !== String(projectData.id)) {
          setFeatureError("La feature no pertenece a este proyecto.");
          return;
        }
        setFeatureDetail(raw);
        const storyItems = await storiesService.listAllStoriesByFeature(validFeatureId);
        if (cancelled) return;
        setFeatureStories(storyItems);
      } catch {
        if (!cancelled) setFeatureError(MSG_ERROR);
      } finally {
        if (!cancelled) setFeatureLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [validFeatureId, projectData]);

  useEffect(() => {
    if (!validStoryId || !validFeatureId) {
      setStoryDetail(null);
      setStoryError("");
      return;
    }
    let cancelled = false;
    async function load() {
      setStoryLoading(true);
      setStoryError("");
      setStoryDetail(null);
      try {
        const s = await storiesService.getStory(validStoryId);
        if (cancelled) return;
        if (String(s.feature_id) !== String(validFeatureId)) {
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
    load();
    return () => {
      cancelled = true;
    };
  }, [validStoryId, validFeatureId]);

  useEffect(() => {
    if (createStoryParam && !isCreateStoryOpen) {
      clearCreateStoryOnly();
    }
  }, [createStoryParam, isCreateStoryOpen, clearCreateStoryOnly]);

  useEffect(() => {
    if (isCreateStoryOpen && !validFeatureId) {
      clearCreateStoryOnly();
    }
  }, [isCreateStoryOpen, validFeatureId, clearCreateStoryOnly]);

  useEffect(() => {
    if (validWorkOrderId && !validStoryId) {
      clearWorkOrderOnly();
    }
  }, [validWorkOrderId, validStoryId, clearWorkOrderOnly]);

  useEffect(() => {
    if (isCreateWorkOrderOpen && !validStoryId) {
      clearCreateWorkOrderOnly();
    }
  }, [isCreateWorkOrderOpen, validStoryId, clearCreateWorkOrderOnly]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (isCreateFeatureOpen) {
        clearCreateFeatureOnly();
        return;
      }
      if (isCreateStoryOpen) {
        clearCreateStoryOnly();
        return;
      }
      if (isCreateWorkOrderOpen) {
        clearCreateWorkOrderOnly();
        return;
      }
      if (validWorkOrderId) {
        clearWorkOrderOnly();
        return;
      }
      if (validStoryId) {
        clearStoryOnly();
        return;
      }
      if (validFeatureId) {
        clearFeatureStack();
        return;
      }
      requestCloseWorkspace();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    isCreateFeatureOpen,
    isCreateStoryOpen,
    isCreateWorkOrderOpen,
    validWorkOrderId,
    validStoryId,
    validFeatureId,
    clearCreateFeatureOnly,
    clearCreateStoryOnly,
    clearCreateWorkOrderOnly,
    clearWorkOrderOnly,
    clearStoryOnly,
    clearFeatureStack,
    requestCloseWorkspace,
  ]);

  function onBackdropClick() {
    if (isCreateFeatureOpen) {
      clearCreateFeatureOnly();
      return;
    }
    if (isCreateStoryOpen) {
      clearCreateStoryOnly();
      return;
    }
    if (isCreateWorkOrderOpen) {
      clearCreateWorkOrderOnly();
      return;
    }
    if (validWorkOrderId) {
      clearWorkOrderOnly();
      return;
    }
    if (validStoryId) {
      clearStoryOnly();
      return;
    }
    if (validFeatureId) {
      clearFeatureStack();
      return;
    }
    requestCloseWorkspace();
  }

  const onDraftPatch = useCallback((patch) => {
    setDraftData((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  async function onSave() {
    if (!projectData || !draftData || !canEditProject) return;
    setIsSaving(true);
    setSaveErrorMessage("");
    setVersionConflict(false);
    try {
      const payload = buildProjectUpdatePayload(draftData, projectData.version);
      const updated = await updateProject(projectData.id, payload);
      setProjectData(updated);
      setDraftData(buildProjectDraftFromServer(updated));
      bumpEvidenceHistory();
    } catch (error) {
      const code = error && error.code ? String(error.code) : "";
      if (code === "PROJECT_CONFLICT") {
        setVersionConflict(true);
      } else {
        setSaveErrorMessage(error && error.message ? error.message : MSG_ERROR);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function reloadProjectFromServer() {
    if (!isValidNexusUuid(urlProjectId)) return;
    setLoading(true);
    setErrorLoadMessage("");
    setSaveErrorMessage("");
    setVersionConflict(false);
    try {
      const data = await loadProjectById(urlProjectId);
      if (!data || String(data.id) !== String(urlProjectId)) {
        setErrorLoadMessage(MSG_NOT_FOUND);
        return;
      }
      setProjectData(data);
      setDraftData(buildProjectDraftFromServer(data));
      bumpEvidenceHistory();
    } catch (error) {
      const nextMessage = error && error.code === "PROJECT_NOT_FOUND" ? MSG_NOT_FOUND : MSG_ERROR;
      setErrorLoadMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  async function onArchive() {
    if (!projectData) return;
    const label = projectData.name ? String(projectData.name) : "este proyecto";
    openConfirmDialog({
      tone: "question",
      title: "Archivar proyecto",
      description: `¿Está seguro de que desea archivar el proyecto "${label}"?`,
      confirmLabel: busyDestructive ? "Archivando…" : "Archivar",
      cancelLabel: "Cancelar",
      confirmVariant: "primary",
      onConfirm: async () => {
        setBusyDestructive(true);
        setSaveErrorMessage("");
        setVersionConflict(false);
        try {
          const archived = await archiveProject(projectData.id, projectData.version);
          setProjectData(archived);
          setDraftData(buildProjectDraftFromServer(archived));
          bumpEvidenceHistory();
        } catch (error) {
          setSaveErrorMessage(error && error.message ? error.message : MSG_ERROR);
        } finally {
          setBusyDestructive(false);
        }
      },
    });
  }

  async function onDelete() {
    if (!projectData) return;
    const label = projectData.name ? String(projectData.name) : "este proyecto";
    openConfirmDialog({
      tone: "error",
      title: "Eliminar proyecto",
      description: `¿Eliminar el proyecto "${label}" y todos sus datos asociados (features, historias, etc.)?\nEsta acción no se puede deshacer.`,
      confirmLabel: busyDestructive ? "Eliminando…" : "Eliminar",
      cancelLabel: "Cancelar",
      confirmVariant: "danger",
      onConfirm: async () => {
        setBusyDestructive(true);
        setSaveErrorMessage("");
        setVersionConflict(false);
        try {
          await deleteProject(projectData.id, projectData.version);
          navigate("/projects");
        } catch (error) {
          setSaveErrorMessage(error && error.message ? error.message : MSG_ERROR);
        } finally {
          setBusyDestructive(false);
        }
      },
    });
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Proyectos", path: "/projects" },
      { label: projectData ? projectData.name : "Proyecto" },
    ],
    [projectData],
  );

  const featureOverlayBreadcrumbItems = useMemo(() => {
    if (!projectData) return [];
    const projectPath = `/projects/${projectData.id}`;
    const featureTitle = featureDetail?.title?.trim() ? featureDetail.title.trim() : "Feature";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Proyectos", path: "/projects" },
      { label: projectData.name || "Proyecto", path: projectPath },
      { label: featureTitle },
    ];
  }, [projectData, featureDetail]);

  const storyOverlayBreadcrumbItems = useMemo(() => {
    if (!projectData) return [];
    const projectPath = `/projects/${projectData.id}`;
    const featurePath = `${projectPath}?feature=${encodeURIComponent(validFeatureId)}`;
    const featureTitle = featureDetail?.title?.trim() ? featureDetail.title.trim() : "Feature";
    const storyTitle = storyDetail?.title?.trim() ? storyDetail.title.trim() : "Historia";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Proyectos", path: "/projects" },
      { label: projectData.name || "Proyecto", path: projectPath },
      { label: featureTitle, path: featurePath },
      { label: storyTitle },
    ];
  }, [projectData, featureDetail, storyDetail, validFeatureId]);

  const storyCreateOverlayBreadcrumbItems = useMemo(() => {
    if (!projectData) return [];
    const projectPath = `/projects/${projectData.id}`;
    const featurePath = `${projectPath}?feature=${encodeURIComponent(validFeatureId)}`;
    const featureTitle = featureDetail?.title?.trim() ? featureDetail.title.trim() : "Feature";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Proyectos", path: "/projects" },
      { label: projectData.name || "Proyecto", path: projectPath },
      { label: featureTitle, path: featurePath },
      { label: "Nueva historia" },
    ];
  }, [projectData, featureDetail, validFeatureId]);

  const workOrderOverlayBreadcrumbItems = useMemo(() => {
    if (!projectData) return [];
    const projectPath = `/projects/${projectData.id}`;
    const featurePath = `${projectPath}?feature=${encodeURIComponent(validFeatureId)}`;
    const storyPath = `${featurePath}&story=${encodeURIComponent(validStoryId)}`;
    const featureTitle = featureDetail?.title?.trim() ? featureDetail.title.trim() : "Feature";
    const storyTitle = storyDetail?.title?.trim() ? storyDetail.title.trim() : "Historia";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Proyectos", path: "/projects" },
      { label: projectData.name || "Proyecto", path: projectPath },
      { label: featureTitle, path: featurePath },
      { label: storyTitle, path: storyPath },
      { label: "Orden de trabajo" },
    ];
  }, [projectData, featureDetail, storyDetail, validFeatureId, validStoryId]);

  const projectCode =
    projectData?.number != null && Number.isFinite(Number(projectData.number))
      ? `P${projectData.number}`
      : projectData?.id?.slice(0, 8) ?? "—";

  const tabsLocked = loading || busyDestructive;
  const editBlocked =
    !canEditProject || projectData?.status !== "ACTIVE" || isSaving || busyDestructive || loading;

  const stackTopDepth = useMemo(() => {
    if (validWorkOrderId && validStoryId) return 3;
    if (isCreateFeatureOpen) return 1;
    if (validStoryId) return 2;
    if (isCreateStoryOpen && validFeatureId) return 2;
    if (validFeatureId) return 1;
    return 0;
  }, [isCreateFeatureOpen, isCreateStoryOpen, validFeatureId, validStoryId, validWorkOrderId]);

  const refreshFeatureStories = useCallback(async () => {
    if (!isValidNexusUuid(validFeatureId)) return;
    const items = await storiesService.listAllStoriesByFeature(validFeatureId);
    setFeatureStories(items);
  }, [validFeatureId]);

  const portal = createPortal(
    <div className={stack.backdrop} role="presentation" onClick={onBackdropClick} data-testid="project-detail-root">
      <div className={stack.stackWrap} onClick={(e) => e.stopPropagation()}>
        <AlertDialog
          isOpen={confirmDialog.open}
          tone={confirmDialog.tone}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          confirmVariant={confirmDialog.confirmVariant}
          busy={busyDestructive}
          onCancel={closeConfirmDialog}
          onConfirm={async () => {
            const fn = confirmDialog.onConfirm;
            closeConfirmDialog();
            if (typeof fn === "function") {
              await Promise.resolve(fn());
            }
          }}
        />
        <HierarchyOverlayStack>
          <HierarchyOverlayStackLayer depth={0} isTop={stackTopDepth === 0}>
            <DetailWorkspaceShell
              depth={0}
              rootDataTestId="project-detail-workspace-shell"
              header={
                <WorkspaceHeader
                  kicker="Detalle del proyecto"
                  breadcrumbItems={breadcrumbItems}
                  breadcrumbDataTestId="breadcrumb-project-detail"
                  title={projectData?.name}
                  onRequestClose={requestCloseWorkspace}
                  closeDisabled={isSaving || busyDestructive}
                />
              }
              chrome={
                <DetailTabList
                  className={stack.tabs}
                  activeTab={activeTab}
                  onRequestTabChange={requestTabChange}
                  disabled={tabsLocked || !projectData}
                  tabClassName={stack.tab}
                  tabActiveClassName={stack.tabActive}
                />
              }
              footer={
                !loading && !errorLoadMessage && projectData ? (
                  <WorkspaceStickyFooter
                    className={stack.footerBar}
                    onCancel={requestCloseWorkspace}
                    onSave={onSave}
                    saveDisabled={!isDirty || isSaving || !canEditProject || projectData.status !== "ACTIVE"}
                    cancelDisabled={isSaving}
                    isSaving={isSaving}
                    saveErrorMessage={saveErrorMessage}
                    onReloadAfterConflict={versionConflict ? reloadProjectFromServer : null}
                    canArchive={activeTab === PROJECT_DETAIL_TAB_EDICION ? canArchiveProject : false}
                    canDelete={activeTab === PROJECT_DETAIL_TAB_EDICION ? canDeleteProject : false}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    archiveDisabled={busyDestructive || isSaving || projectData.status !== "ACTIVE"}
                    deleteDisabled={busyDestructive || isSaving}
                  />
                ) : null
              }
            >
              <ProjectWorkspaceContent
                loading={loading}
                errorLoadMessage={errorLoadMessage}
                projectData={projectData}
                draftData={draftData}
                activeTab={activeTab}
                projectCode={projectCode}
                validFeatureId={validFeatureId}
                validStoryId={validStoryId}
                projectLayerEvidenceHistoryKey={projectLayerEvidenceHistoryKey}
                compiledProjectEvidenceMarkdown={compiledProjectEvidenceMarkdown}
                compiledProjectEvidenceLoading={compiledProjectEvidenceLoading}
                compiledProjectEvidenceError={compiledProjectEvidenceError}
                onRefreshCompiledProjectEvidence={bumpCompiledProjectEvidence}
                navigate={navigate}
                requestCloseWorkspace={requestCloseWorkspace}
                onSave={onSave}
                isDirty={isDirty}
                isSaving={isSaving}
                canEditProject={canEditProject}
                editBlocked={editBlocked}
                onDraftPatch={onDraftPatch}
                backlogFeatures={backlogFeatures}
                backlogLoading={backlogLoading}
                backlogError={backlogError}
                requestOpenFeature={requestOpenFeature}
                requestOpenFeatureEdit={requestOpenFeatureEdit}
                onFeatureRemovedFromBacklog={handleFeatureRemovedFromBacklog}
                canWriteFeature={canWriteFeature}
                requestCreateFeature={requestCreateFeature}
                featureLoading={featureLoading}
                storyLoading={storyLoading}
                setBacklogFeatures={setBacklogFeatures}
                setBacklogLoading={setBacklogLoading}
                setBacklogError={setBacklogError}
                canReleases={canReleases}
                reloadProjectFromServer={reloadProjectFromServer}
              />
            </DetailWorkspaceShell>
          </HierarchyOverlayStackLayer>

          {isCreateFeatureOpen && projectData ? (
            <HierarchyOverlayStackLayer depth={1} isTop={stackTopDepth === 1}>
              <FeatureCreateOverlayCard
                project={projectData}
                breadcrumbItems={[
                  { label: "Dashboard", path: "/dashboard" },
                  { label: "Proyectos", path: "/projects" },
                  { label: projectData.name || "Proyecto", path: `/projects/${projectData.id}` },
                  { label: "Nueva feature" },
                ]}
                disabled={false}
                onClose={clearCreateFeatureOnly}
                onCreated={(created) => {
                  // refrescar backlog y abrir el detalle de la feature creada
                  setBacklogLoading(true);
                  setBacklogError("");
                  getBacklogFeaturesForProject(projectData.id)
                    .then((data) => {
                      const items = data && Array.isArray(data.items) ? data.items : [];
                      setBacklogFeatures(items);
                    })
                    .catch(() => setBacklogError(MSG_ERROR))
                    .finally(() => setBacklogLoading(false));
                  if (created?.id) {
                    openFeatureInUrl(String(created.id));
                  } else {
                    clearCreateFeatureOnly();
                  }
                }}
              />
            </HierarchyOverlayStackLayer>
          ) : null}

          {validFeatureId && projectData && !isCreateFeatureOpen ? (
            <HierarchyOverlayStackLayer depth={1} isTop={stackTopDepth === 1}>
              <FeatureDetailCard
                feature={featureDetail}
                stories={featureStories}
                loading={featureLoading}
                error={featureError}
                initialActiveTab={canWriteFeature ? pendingFeatureOverlayTab : PROJECT_DETAIL_TAB_VISTA}
                breadcrumbItems={featureOverlayBreadcrumbItems}
                projectData={projectData}
                draftData={draftData}
                onDraftPatch={onDraftPatch}
                onProjectSave={onSave}
                projectIsDirty={isDirty}
                projectIsSaving={isSaving}
                canEditProject={canEditProject}
                editBlocked={editBlocked}
                evidenceHistoryResetKey={evidenceHistoryResetKey}
                canWriteFeature={canWriteFeature}
                canWriteStory={canWriteStory}
                versionConflict={versionConflict}
                onReloadAfterConflict={versionConflict ? reloadProjectFromServer : null}
                projectSaveErrorMessage={saveErrorMessage}
                onFeatureUpdated={(updated) => setFeatureDetail(updated)}
                onRefreshStories={refreshFeatureStories}
                onClose={clearFeatureStack}
                onOpenStory={requestOpenStory}
                onOpenStoryEdit={requestOpenStoryEdit}
                onRequestCreateStory={requestCreateStory}
                onStoryRemovedFromBacklog={handleStoryRemovedFromFeatureBacklog}
                onOpenFullPage={() => navigate(`/projects/${projectData.id}/features/${validFeatureId}`)}
                blockStoryOpen={storyLoading || featureLoading}
              />
            </HierarchyOverlayStackLayer>
          ) : null}

          {validStoryId && projectData ? (
            <HierarchyOverlayStackLayer depth={2} isTop={stackTopDepth === 2}>
              <StoryDetailCard
                story={storyDetail}
                parentFeature={featureDetail}
                initialActiveTab={canWriteStory ? pendingStoryOverlayTab : PROJECT_DETAIL_TAB_VISTA}
                loading={storyLoading}
                error={storyError}
                breadcrumbItems={storyOverlayBreadcrumbItems}
                projectData={projectData}
                draftData={draftData}
                onDraftPatch={onDraftPatch}
                onProjectSave={onSave}
                projectIsDirty={isDirty}
                projectIsSaving={isSaving}
                canEditProject={canEditProject}
                editBlocked={editBlocked}
                evidenceHistoryResetKey={evidenceHistoryResetKey}
                canWriteStory={canWriteStory}
                versionConflict={versionConflict}
                onReloadAfterConflict={versionConflict ? reloadProjectFromServer : null}
                projectSaveErrorMessage={saveErrorMessage}
                onStoryUpdated={(updated) => setStoryDetail(updated)}
                onClose={clearStoryOnly}
                onOpenFullPage={() =>
                  navigate(
                    buildStoryDetailHref(projectData.id, validStoryId, {
                      [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_PROJECT,
                    }),
                  )
                }
                assignmentUsers={assignmentUsers}
                workOrdersRefreshNonce={workOrdersRefreshNonce}
                createWorkOrderPanelOpen={isCreateWorkOrderOpen}
                onOpenCreateWorkOrderPanel={() => runAfterDiscardOk(() => openCreateWorkOrderInUrl())}
                onCloseCreateWorkOrderPanel={clearCreateWorkOrderOnly}
                onOpenWorkOrder={(woId) => runAfterDiscardOk(() => openWorkOrderInUrl(String(woId)))}
              />
            </HierarchyOverlayStackLayer>
          ) : null}

          {validWorkOrderId && validStoryId && projectData ? (
            <HierarchyOverlayStackLayer depth={3} isTop={stackTopDepth === 3}>
              <WorkOrderDetailOverlay
                projectId={String(projectData.id)}
                projectData={projectData}
                feature={featureDetail}
                story={storyDetail}
                workOrderId={validWorkOrderId}
                users={assignmentUsers}
                breadcrumbItems={workOrderOverlayBreadcrumbItems}
                onClose={clearWorkOrderOnly}
                onRequestBack={clearWorkOrderOnly}
                onSaved={bumpWorkOrdersList}
                canEdit={canWriteStory}
              />
            </HierarchyOverlayStackLayer>
          ) : null}

          {!validStoryId && isCreateStoryOpen && validFeatureId && projectData && featureDetail ? (
            <HierarchyOverlayStackLayer depth={2} isTop={stackTopDepth === 2}>
              <StoryCreateOverlayCard
                feature={featureDetail}
                breadcrumbItems={storyCreateOverlayBreadcrumbItems}
                disabled={!canWriteStory}
                onClose={clearCreateStoryOnly}
                onCreated={async (created) => {
                  await refreshFeatureStories();
                  if (created?.id) {
                    openStoryInUrl(String(created.id));
                  } else {
                    clearCreateStoryOnly();
                  }
                }}
              />
            </HierarchyOverlayStackLayer>
          ) : null}
        </HierarchyOverlayStack>
      </div>
    </div>,
    document.body,
  );

  return portal;
}
