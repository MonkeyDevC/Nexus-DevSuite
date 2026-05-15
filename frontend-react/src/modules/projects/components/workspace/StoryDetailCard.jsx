import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import { mapStoryStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import * as storiesService from "../../../../modules/stories/storiesService.js";
import { listAllSprintsForProject } from "../../../../modules/sprints/sprintsService.js";
import stack from "../../styles/projectDetailStack.module.css";
import { DetailWorkspaceShell } from "./DetailWorkspaceShell.jsx";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import WorkspaceTabBar from "./WorkspaceTabBar.jsx";
import WorkspaceStickyFooter from "./WorkspaceStickyFooter.jsx";
import ProjectEvidenceTab from "./ProjectEvidenceTab.jsx";
import StoryViewTab from "./StoryViewTab.jsx";
import StoryEditTab from "./StoryEditTab.jsx";
import { STORY_WORKSPACE_TABS } from "./storyWorkspaceTabs.js";
import {
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_EVIDENCIA,
  PROJECT_DETAIL_TAB_VISTA,
  STORY_DETAIL_TAB_WORK_ORDERS,
} from "./projectDetailConstants.js";
import WorkOrdersTab from "../../../work-orders/components/WorkOrdersTab.jsx";
import { overlayStoryShellPanelDomId, overlayStoryShellTabDomId } from "./overlayWorkspaceConstants.js";
import headerStyles from "./WorkspaceHeader.module.css";
import { formatStoryHumanId } from "../../../../shared/workspace/workItemHumanIds.js";

const MSG_SAVE = "No se pudo guardar la historia.";

function storyCodeDisplay(story) {
  if (!story) return "—";
  const code = formatStoryHumanId(story.number != null ? Number(story.number) : null);
  if (code) return code;
  const id = story.id != null ? String(story.id) : "";
  return id ? `US-${id.slice(0, 8)}` : "—";
}

function normalizeCriteriaArray(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? ""));
  if (typeof raw === "object") {
    return Object.values(raw).map((x) => String(x ?? ""));
  }
  return [];
}

/** @param {string} raw */
function parseStoryPointsField(raw) {
  const t = String(raw ?? "").trim();
  if (t === "") return { parsed: null, invalid: false };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return { parsed: null, invalid: true };
  return { parsed: n, invalid: false };
}

function normalizeStoryWorkflowStatus(value) {
  return value != null && String(value).trim() !== "" ? String(value).trim().toUpperCase() : "";
}

const STORY_REFINEMENT_ENUM = new Set(["IDEA", "DRAFT", "REFINED", "READY"]);

function normalizeStoryRefinement(value) {
  const t = value != null && String(value).trim() !== "" ? String(value).trim().toUpperCase() : "DRAFT";
  return STORY_REFINEMENT_ENUM.has(t) ? t : "DRAFT";
}

export default function StoryDetailCard({
  story,
  parentFeature = null,
  /** Alineado al backlog de features: abrir en Vista o Edición según el origen (Ver / Editar). */
  initialActiveTab = PROJECT_DETAIL_TAB_VISTA,
  /** `data-testid` del shell (p. ej. `story-detail-card` desde Product Backlog para E2E). */
  rootDataTestId = "project-detail-overlay-story",
  loading,
  error,
  breadcrumbItems = [],
  onClose,
  onOpenFullPage,
  projectData,
  draftData,
  onDraftPatch,
  onProjectSave,
  projectIsDirty,
  projectIsSaving,
  canEditProject,
  editBlocked,
  evidenceHistoryResetKey,
  canWriteStory,
  versionConflict,
  onReloadAfterConflict,
  projectSaveErrorMessage,
  onStoryUpdated,
  assignmentUsers = [],
  workOrdersRefreshNonce = 0,
  createWorkOrderPanelOpen = false,
  onOpenCreateWorkOrderPanel,
  onCloseCreateWorkOrderPanel,
  onOpenWorkOrder,
  /** Contenido adicional a la izquierda del pie (p. ej. «Eliminar» en ruta de página completa). */
  footerLeftExtras = null,
}) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAcceptanceCriteria, setEditAcceptanceCriteria] = useState([]);
  const [editImplementationCriteria, setEditImplementationCriteria] = useState([]);
  const [editPriority, setEditPriority] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editStoryPoints, setEditStoryPoints] = useState("");
  const [editSprintId, setEditSprintId] = useState("");
  const [editRefinementStatus, setEditRefinementStatus] = useState("DRAFT");
  const [storySprints, setStorySprints] = useState([]);
  const [storySprintsLoading, setStorySprintsLoading] = useState(false);
  const [storySprintsError, setStorySprintsError] = useState("");
  const [storySaving, setStorySaving] = useState(false);
  const [storySaveError, setStorySaveError] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [storyEvidenceMarkdown, setStoryEvidenceMarkdown] = useState("");

  useEffect(() => {
    if (!story?.id) return;
    setActiveTab(initialActiveTab);
  }, [story?.id, initialActiveTab]);

  useEffect(() => {
    if (!story) return;
    setEditTitle(story.title?.trim() ? story.title : "");
    setEditDescription(story.description?.trim() ? story.description : "");
    setEditAcceptanceCriteria(normalizeCriteriaArray(story.acceptance_criteria));
    setEditImplementationCriteria(normalizeCriteriaArray(story.implementation_criteria));
    setEditPriority(story.priority != null ? String(story.priority) : "");
    setEditStatus(story.status != null ? String(story.status) : "");
    setEditAssignedTo(story.assigned_to != null ? String(story.assigned_to) : "");
    setEditStoryPoints(
      story.story_points != null && Number.isFinite(Number(story.story_points))
        ? String(Number(story.story_points))
        : ""
    );
    setEditSprintId(story.sprint_id != null && String(story.sprint_id).trim() !== "" ? String(story.sprint_id).trim() : "");
    setEditRefinementStatus(
      story.refinement_status != null && String(story.refinement_status).trim() !== ""
        ? normalizeStoryRefinement(story.refinement_status)
        : "DRAFT"
    );
    setStorySaveError("");
  }, [
    story?.id,
    story?.title,
    story?.description,
    story?.acceptance_criteria,
    story?.implementation_criteria,
    story?.priority,
    story?.status,
    story?.assigned_to,
    story?.story_points,
    story?.sprint_id,
    story?.refinement_status,
  ]);

  useEffect(() => {
    if (!story?.id) return;
    const ref = normalizeStoryRefinement(editRefinementStatus);
    const hasServerSprint = story.sprint_id != null && String(story.sprint_id).trim() !== "";
    if (ref !== "READY" && !hasServerSprint) {
      setEditSprintId("");
    }
  }, [editRefinementStatus, story?.id, story?.sprint_id]);

  const projectIdForSprintList = useMemo(() => {
    const fromStory = story?.project_id != null && String(story.project_id).trim() !== "" ? String(story.project_id).trim() : "";
    const fromContext =
      projectData?.id != null && String(projectData.id).trim() !== "" ? String(projectData.id).trim() : "";
    return fromStory || fromContext;
  }, [story?.project_id, projectData?.id]);

  useEffect(() => {
    const pid = projectIdForSprintList;
    if (!pid) {
      setStorySprints([]);
      setStorySprintsError("");
      return;
    }
    let cancelled = false;
    setStorySprintsLoading(true);
    setStorySprintsError("");
    listAllSprintsForProject(pid)
      .then((items) => {
        if (cancelled) return;
        setStorySprints(Array.isArray(items) ? items : []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e && e.message ? String(e.message) : "No se pudieron cargar los sprints.";
        setStorySprintsError(msg);
        setStorySprints([]);
      })
      .finally(() => {
        if (!cancelled) setStorySprintsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectIdForSprintList]);

  useEffect(() => {
    if (!story) return;
    setStoryEvidenceMarkdown(String(story.evidence_markdown ?? ""));
  }, [story?.id, story?.evidence_markdown]);

  const storyEditDirty = useMemo(() => {
    if (!story) return false;
    const t = editTitle.trim();
    const d = editDescription.trim();
    const baseT = story.title?.trim() ? story.title.trim() : "";
    const baseD = story.description?.trim() ? story.description.trim() : "";
    const baseAcc = normalizeCriteriaArray(story.acceptance_criteria);
    const baseImpl = normalizeCriteriaArray(story.implementation_criteria);
    const basePriority = story.priority != null ? String(story.priority) : "";
    const statusDirty =
      normalizeStoryWorkflowStatus(editStatus) !== normalizeStoryWorkflowStatus(story.status);
    const refinementDirty =
      normalizeStoryRefinement(editRefinementStatus) !== normalizeStoryRefinement(story.refinement_status);
    const baseAssigned = story.assigned_to != null ? String(story.assigned_to).trim() : "";
    const editAssigned = (editAssignedTo || "").trim();
    const baseSp =
      story.story_points != null && Number.isFinite(Number(story.story_points))
        ? Number(story.story_points)
        : null;
    const spField = parseStoryPointsField(editStoryPoints);
    const editSp = spField.invalid ? null : spField.parsed;
    const spDirty = spField.invalid || baseSp !== editSp;
    const accKey = JSON.stringify(editAcceptanceCriteria);
    const implKey = JSON.stringify(editImplementationCriteria);
    const baseSid = story.sprint_id != null && String(story.sprint_id).trim() !== "" ? String(story.sprint_id).trim() : "";
    const editSid = editSprintId != null ? String(editSprintId).trim() : "";
    const sprintDirty = baseSid !== editSid;
    return (
      t !== baseT ||
      d !== baseD ||
      editPriority !== basePriority ||
      statusDirty ||
      refinementDirty ||
      baseAssigned !== editAssigned ||
      spDirty ||
      sprintDirty ||
      accKey !== JSON.stringify(baseAcc) ||
      implKey !== JSON.stringify(baseImpl)
    );
  }, [
    story,
    editTitle,
    editDescription,
    editAcceptanceCriteria,
    editImplementationCriteria,
    editPriority,
    editStatus,
    editRefinementStatus,
    editAssignedTo,
    editStoryPoints,
    editSprintId,
  ]);

  const storyEvidenceDirty = useMemo(() => {
    if (!story) return false;
    return String(storyEvidenceMarkdown ?? "") !== String(story.evidence_markdown ?? "");
  }, [story, storyEvidenceMarkdown]);

  const isStoryEditTab = activeTab === PROJECT_DETAIL_TAB_EDICION;
  const isStoryEvidenceTab = activeTab === PROJECT_DETAIL_TAB_EVIDENCIA;
  const projectSaveBlocked =
    !projectIsDirty || projectIsSaving || !canEditProject || projectData?.status !== "ACTIVE";
  const storyPointsFieldState = parseStoryPointsField(editStoryPoints);
  const storySaveBlocked =
    !storyEditDirty ||
    storySaving ||
    !canWriteStory ||
    !editTitle.trim() ||
    !editDescription.trim() ||
    storyPointsFieldState.invalid;
  const storyEvidenceSaveBlocked =
    !storyEvidenceDirty || storySaving || !canWriteStory || projectData?.status !== "ACTIVE";

  const saveDisabled = isStoryEditTab
    ? storySaveBlocked
    : isStoryEvidenceTab
      ? storyEvidenceSaveBlocked
      : projectSaveBlocked;
  const footerSaving = isStoryEditTab || isStoryEvidenceTab ? storySaving : projectIsSaving;
  const footerSaveError = isStoryEditTab || isStoryEvidenceTab ? "" : projectSaveErrorMessage || "";

  const handleFooterSave = useCallback(async () => {
    if (isStoryEditTab) {
      if (!story?.id || !canWriteStory) return;
      setStorySaving(true);
      setStorySaveError("");
      try {
        const nextWorkflowStatus = normalizeStoryWorkflowStatus(editStatus);
        const prevWorkflowStatus = normalizeStoryWorkflowStatus(story.status);
        if (nextWorkflowStatus !== "" && nextWorkflowStatus !== prevWorkflowStatus) {
          await storiesService.updateStoryStatus(story.id, nextWorkflowStatus);
        }
        const refinementNext = normalizeStoryRefinement(editRefinementStatus);
        const refinementPrev = normalizeStoryRefinement(story.refinement_status);
        const storyPayload = {
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority || undefined,
          acceptance_criteria: editAcceptanceCriteria,
          implementation_criteria: editImplementationCriteria,
          evidence_markdown: storyEvidenceMarkdown,
        };
        if (refinementNext !== refinementPrev) {
          storyPayload.refinement_status = refinementNext;
        }
        const updated = await storiesService.updateStory(story.id, storyPayload);
        const prevSprintId =
          story.sprint_id != null && String(story.sprint_id).trim() !== "" ? String(story.sprint_id).trim() : null;
        const nextSprintId =
          editSprintId != null && String(editSprintId).trim() !== "" ? String(editSprintId).trim() : null;
        let latest = updated;
        if (prevSprintId !== nextSprintId) {
          await storiesService.updateStorySprint(story.id, nextSprintId);
          latest = await storiesService.getStory(story.id);
        }
        if (typeof onStoryUpdated === "function") onStoryUpdated(latest);
      } catch (e) {
        const msg = e && e.message ? String(e.message) : MSG_SAVE;
        setStorySaveError(msg);
        setErrorDialogMessage(msg);
        setErrorDialogOpen(true);
      } finally {
        setStorySaving(false);
      }
      return;
    }
    if (isStoryEvidenceTab) {
      if (!story?.id || !canWriteStory) return;
      setStorySaving(true);
      setStorySaveError("");
      try {
        const updated = await storiesService.updateStory(story.id, {
          evidence_markdown: storyEvidenceMarkdown,
        });
        if (typeof onStoryUpdated === "function") onStoryUpdated(updated);
      } catch (e) {
        const msg = e && e.message ? String(e.message) : MSG_SAVE;
        setStorySaveError(msg);
        setErrorDialogMessage(msg);
        setErrorDialogOpen(true);
      } finally {
        setStorySaving(false);
      }
      return;
    }
    if (typeof onProjectSave === "function") await onProjectSave();
  }, [
    isStoryEditTab,
    isStoryEvidenceTab,
    story,
    canWriteStory,
    editTitle,
    editDescription,
    editPriority,
    editStatus,
    editRefinementStatus,
    editAcceptanceCriteria,
    editImplementationCriteria,
    editAssignedTo,
    editStoryPoints,
    editSprintId,
    storyEvidenceMarkdown,
    onStoryUpdated,
    onProjectSave,
  ]);

  const requestTabChange = useCallback((next) => {
    setActiveTab(next);
  }, []);

  const tabsLocked = loading || Boolean(error) || !story;

  const headerMeta =
    story && !loading && !error ? (
      <>
        <span className={headerStyles.code}>{storyCodeDisplay(story)}</span>
        {story?.status ? <Badge variant={mapStoryStatusToDsBadgeVariant(story.status)}>{story.status}</Badge> : null}
        {story?.priority ? <span className={headerStyles.prio}>Prioridad: {story.priority}</span> : null}
      </>
    ) : null;

  const showFooter = !loading && !error && story && projectData;

  return (
    <DetailWorkspaceShell
      depth={2}
      rootDataTestId={rootDataTestId}
      header={
        <WorkspaceHeader
          kicker="Detalle de la historia"
          breadcrumbItems={breadcrumbItems}
          breadcrumbDataTestId="breadcrumb-story-overlay"
          title={story?.title?.trim() ? story.title.trim() : "Historia"}
          meta={headerMeta}
          onRequestClose={onClose}
          closeAriaLabel="Cerrar historia"
        />
      }
      chrome={
        <WorkspaceTabBar
          className={stack.tabs}
          tabs={STORY_WORKSPACE_TABS}
          activeTab={activeTab}
          onRequestTabChange={requestTabChange}
          disabled={tabsLocked}
          ariaLabel="Secciones de la historia"
          tabClassName={stack.tab}
          tabActiveClassName={stack.tabActive}
          tabDomId={overlayStoryShellTabDomId}
          panelDomId={overlayStoryShellPanelDomId}
        />
      }
      footer={
        showFooter ? (
          <WorkspaceStickyFooter
            className={stack.footerBar}
            leftActions={
              <>
                {typeof onOpenFullPage === "function" ? (
                  <Button type="button" variant="outline" onClick={onOpenFullPage} data-testid="project-story-open-full-page">
                    Abrir en página completa
                  </Button>
                ) : null}
                {footerLeftExtras}
              </>
            }
            onCancel={onClose}
            onSave={handleFooterSave}
            saveDisabled={saveDisabled}
            cancelDisabled={footerSaving}
            isSaving={footerSaving}
            saveErrorMessage={footerSaveError}
            onReloadAfterConflict={
              !isStoryEditTab && !isStoryEvidenceTab && versionConflict ? onReloadAfterConflict : null
            }
            canArchive={false}
            canDelete={false}
          />
        ) : null
      }
    >
      <AlertDialog
        isOpen={errorDialogOpen}
        tone="error"
        title="No se pudo guardar"
        description={errorDialogMessage || storySaveError || MSG_SAVE}
        confirmLabel="Entendido"
        cancelLabel=""
        onCancel={() => setErrorDialogOpen(false)}
        onConfirm={() => setErrorDialogOpen(false)}
      />
      {loading ? <div className={stack.loading}>Cargando historia…</div> : null}
      {error ? (
        <div className={stack.error} role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error && story ? (
        <>
          <div
            id={overlayStoryShellPanelDomId(PROJECT_DETAIL_TAB_VISTA)}
            role="tabpanel"
            aria-labelledby={overlayStoryShellTabDomId(PROJECT_DETAIL_TAB_VISTA)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_VISTA}
          >
            {activeTab === PROJECT_DETAIL_TAB_VISTA ? (
              <StoryViewTab story={story} parentFeature={parentFeature} />
            ) : null}
          </div>

          <div
            id={overlayStoryShellPanelDomId(PROJECT_DETAIL_TAB_EDICION)}
            role="tabpanel"
            aria-labelledby={overlayStoryShellTabDomId(PROJECT_DETAIL_TAB_EDICION)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_EDICION}
          >
            {activeTab === PROJECT_DETAIL_TAB_EDICION ? (
              <StoryEditTab
                story={story}
                parentFeature={parentFeature}
                title={editTitle}
                description={editDescription}
                acceptanceCriteria={editAcceptanceCriteria}
                implementationCriteria={editImplementationCriteria}
                priority={editPriority}
                status={editStatus}
                assignedTo={editAssignedTo}
                storyPoints={editStoryPoints}
                assignmentUsers={assignmentUsers}
                onTitleChange={setEditTitle}
                onDescriptionChange={setEditDescription}
                onAcceptanceCriteriaChange={setEditAcceptanceCriteria}
                onImplementationCriteriaChange={setEditImplementationCriteria}
                onPriorityChange={setEditPriority}
                onStatusChange={setEditStatus}
                refinementStatus={editRefinementStatus}
                onRefinementChange={setEditRefinementStatus}
                onAssignedToChange={setEditAssignedTo}
                onStoryPointsChange={setEditStoryPoints}
                sprintId={editSprintId}
                sprintOptions={storySprints}
                sprintsLoading={storySprintsLoading}
                sprintsLoadError={storySprintsError}
                onSprintChange={setEditSprintId}
                disabled={!canWriteStory || storySaving}
              />
            ) : null}
          </div>

          <div
            id={overlayStoryShellPanelDomId(PROJECT_DETAIL_TAB_EVIDENCIA)}
            role="tabpanel"
            aria-labelledby={overlayStoryShellTabDomId(PROJECT_DETAIL_TAB_EVIDENCIA)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_EVIDENCIA}
          >
            {activeTab === PROJECT_DETAIL_TAB_EVIDENCIA && projectData ? (
              <ProjectEvidenceTab
                evidenceMarkdown={storyEvidenceMarkdown}
                onDraftPatch={(patch) => {
                  if (patch && typeof patch.evidence_markdown === "string") {
                    setStoryEvidenceMarkdown(patch.evidence_markdown);
                  }
                }}
                canEdit={canWriteStory}
                disabled={!canWriteStory || storySaving || projectData?.status !== "ACTIVE"}
                isDirty={storyEvidenceDirty}
                projectId={projectData.id}
                featureId={parentFeature?.id || story.feature_id || ""}
                storyId={story.id}
                evidenceHistoryResetKey={evidenceHistoryResetKey}
                workspaceFooterActions={{
                  onCancel: onClose,
                  onSave: handleFooterSave,
                  saveDisabled: saveDisabled,
                  cancelDisabled: footerSaving,
                  isSaving: footerSaving,
                }}
              />
            ) : null}
          </div>

          <div
            id={overlayStoryShellPanelDomId(STORY_DETAIL_TAB_WORK_ORDERS)}
            role="tabpanel"
            aria-labelledby={overlayStoryShellTabDomId(STORY_DETAIL_TAB_WORK_ORDERS)}
            hidden={activeTab !== STORY_DETAIL_TAB_WORK_ORDERS}
          >
            {activeTab === STORY_DETAIL_TAB_WORK_ORDERS && projectData?.id ? (
              <WorkOrdersTab
                projectId={String(projectData.id)}
                story={story}
                canWrite={Boolean(canWriteStory)}
                createPanelOpen={createWorkOrderPanelOpen}
                onOpenCreatePanel={onOpenCreateWorkOrderPanel}
                onCloseCreatePanel={onCloseCreateWorkOrderPanel}
                onOpenWorkOrder={onOpenWorkOrder}
                refreshNonce={workOrdersRefreshNonce}
                users={assignmentUsers}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </DetailWorkspaceShell>
  );
}
