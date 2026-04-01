import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../design-system/components/Button/Button.jsx";
import AlertDialog from "../../design-system/components/AlertDialog/AlertDialog.jsx";
import { mapFeatureStatusToDsBadgeVariant } from "../../pages/wave1DsMappers.js";
import * as featuresService from "../../modules/features/featuresService.js";
import stack from "../../pages/projectDetailStack.module.css";
import { DetailWorkspaceShell } from "./DetailWorkspaceShell.jsx";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import WorkspaceTabBar from "./WorkspaceTabBar.jsx";
import WorkspaceStickyFooter from "./WorkspaceStickyFooter.jsx";
import ProjectEvidenceTab from "./ProjectEvidenceTab.jsx";
import FeatureViewTab from "./FeatureViewTab.jsx";
import FeatureEditTab from "./FeatureEditTab.jsx";
import FeatureStoriesBacklogTab from "./FeatureStoriesBacklogTab.jsx";
import { featureCodeDisplay } from "./FeatureWorkspaceContent.jsx";
import { PROJECT_WORKSPACE_TABS } from "./projectWorkspaceTabs.js";
import {
  PROJECT_DETAIL_TAB_BACKLOG,
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_EVIDENCIA,
  PROJECT_DETAIL_TAB_VISTA,
} from "./projectDetailConstants.js";
import {
  overlayFeatureShellPanelDomId,
  overlayFeatureShellTabDomId,
} from "./overlayWorkspaceConstants.js";
import headerStyles from "./WorkspaceHeader.module.css";

const MSG_SAVE = "No se pudo guardar la feature.";

export default function FeatureDetailCard({
  feature,
  stories,
  loading,
  error,
  breadcrumbItems = [],
  projectData,
  draftData,
  onDraftPatch,
  onProjectSave,
  projectIsDirty,
  projectIsSaving,
  canEditProject,
  editBlocked,
  evidenceHistoryResetKey,
  canWriteFeature,
  versionConflict,
  onReloadAfterConflict,
  projectSaveErrorMessage,
  onClose,
  onOpenStory,
  onOpenFullPage,
  onRefreshStories,
  onFeatureUpdated,
  blockStoryOpen = false,
}) {
  const [activeTab, setActiveTab] = useState(PROJECT_DETAIL_TAB_VISTA);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAcceptanceCriteria, setEditAcceptanceCriteria] = useState([]);
  const [editImplementationCriteria, setEditImplementationCriteria] = useState([]);
  const [editPriority, setEditPriority] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [featureSaving, setFeatureSaving] = useState(false);
  const [featureSaveError, setFeatureSaveError] = useState("");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState("");

  useEffect(() => {
    if (!feature) return;
    setEditTitle(feature.title?.trim() ? feature.title : "");
    setEditDescription(feature.description?.trim() ? feature.description : "");
    setEditAcceptanceCriteria(Array.isArray(feature.acceptance_criteria) ? feature.acceptance_criteria : []);
    setEditImplementationCriteria(Array.isArray(feature.implementation_criteria) ? feature.implementation_criteria : []);
    setEditPriority(feature.priority != null ? String(feature.priority) : "");
    setEditStatus(feature.status != null ? String(feature.status) : "");
    setFeatureSaveError("");
  }, [feature?.id, feature?.title, feature?.description, feature?.acceptance_criteria, feature?.implementation_criteria]);

  const featureEditDirty = useMemo(() => {
    if (!feature) return false;
    const t = editTitle.trim();
    const d = editDescription.trim();
    const baseT = feature.title?.trim() ? feature.title.trim() : "";
    const baseD = feature.description?.trim() ? feature.description.trim() : "";
    const baseAcc = Array.isArray(feature.acceptance_criteria) ? feature.acceptance_criteria : [];
    const baseImpl = Array.isArray(feature.implementation_criteria) ? feature.implementation_criteria : [];
    const basePriority = feature.priority != null ? String(feature.priority) : "";
    const baseStatus = feature.status != null ? String(feature.status) : "";
    const accKey = JSON.stringify(Array.isArray(editAcceptanceCriteria) ? editAcceptanceCriteria : []);
    const implKey = JSON.stringify(Array.isArray(editImplementationCriteria) ? editImplementationCriteria : []);
    return (
      t !== baseT ||
      d !== baseD ||
      editPriority !== basePriority ||
      editStatus !== baseStatus ||
      accKey !== JSON.stringify(baseAcc) ||
      implKey !== JSON.stringify(baseImpl)
    );
  }, [feature, editTitle, editDescription, editAcceptanceCriteria, editImplementationCriteria, editPriority, editStatus]);

  const isFeatureEditTab = activeTab === PROJECT_DETAIL_TAB_EDICION;
  const projectSaveBlocked =
    !projectIsDirty || projectIsSaving || !canEditProject || projectData?.status !== "ACTIVE";
  const featureSaveBlocked =
    !featureEditDirty || featureSaving || !canWriteFeature || !editTitle.trim() || !editDescription.trim();

  const saveDisabled = isFeatureEditTab ? featureSaveBlocked : projectSaveBlocked;
  const footerSaving = isFeatureEditTab ? featureSaving : projectIsSaving;
  // En Feature: los errores se muestran como modal (no como texto inline).
  const footerSaveError = isFeatureEditTab ? "" : projectSaveErrorMessage || "";

  const handleFooterSave = useCallback(async () => {
    const editingFeature = activeTab === PROJECT_DETAIL_TAB_EDICION;
    if (editingFeature) {
      if (!feature?.id || !canWriteFeature) return;
      setFeatureSaving(true);
      setFeatureSaveError("");
      try {
        // 1) Estado: endpoint dedicado (workflow). Si cambia, hacerlo primero.
        if (editStatus && feature.status && editStatus !== String(feature.status)) {
          await featuresService.updateFeatureStatus(feature.id, editStatus);
        }

        // 2) Campos editables (PUT): título/desc/criterios/prioridad.
        const updated = await featuresService.updateFeature(feature.id, {
          title: editTitle.trim(),
          description: editDescription.trim(),
          acceptance_criteria: editAcceptanceCriteria,
          implementation_criteria: editImplementationCriteria,
          priority: editPriority || undefined,
        });
        if (typeof onFeatureUpdated === "function") onFeatureUpdated(updated);
      } catch (e) {
        const msg = e && e.message ? String(e.message) : MSG_SAVE;
        setFeatureSaveError(msg);
        setErrorDialogMessage(msg);
        setErrorDialogOpen(true);
      } finally {
        setFeatureSaving(false);
      }
      return;
    }
    if (typeof onProjectSave === "function") await onProjectSave();
  }, [
    activeTab,
    feature,
    canWriteFeature,
    editTitle,
    editDescription,
    editAcceptanceCriteria,
    editImplementationCriteria,
    editPriority,
    editStatus,
    onFeatureUpdated,
    onProjectSave,
  ]);

  const requestTabChange = useCallback((next) => {
    setActiveTab(next);
  }, []);

  const handleRefreshStories = useCallback(async () => {
    setStoriesError("");
    setStoriesLoading(true);
    try {
      if (typeof onRefreshStories === "function") await onRefreshStories();
    } catch (e) {
      setStoriesError(e && e.message ? String(e.message) : "Error cargando historias.");
    } finally {
      setStoriesLoading(false);
    }
  }, [onRefreshStories]);

  const tabsLocked = loading || Boolean(error) || !feature;

  const headerMeta =
    feature && !loading && !error ? (
      <>
        <span className={headerStyles.code}>{featureCodeDisplay(feature)}</span>
        {feature?.status ? <Badge variant={mapFeatureStatusToDsBadgeVariant(feature.status)}>{feature.status}</Badge> : null}
        {feature?.priority ? <span className={headerStyles.prio}>Prioridad: {feature.priority}</span> : null}
      </>
    ) : null;

  const showFooter = !loading && !error && feature && projectData;

  return (
    <DetailWorkspaceShell
      depth={1}
      rootDataTestId="project-detail-overlay-feature"
      header={
        <WorkspaceHeader
          kicker="Detalle de la feature"
          breadcrumbItems={breadcrumbItems}
          breadcrumbDataTestId="breadcrumb-feature-overlay"
          title={feature?.title?.trim() ? feature.title.trim() : "Feature"}
          meta={headerMeta}
          onRequestClose={onClose}
          closeAriaLabel="Cerrar feature"
        />
      }
      chrome={
        <WorkspaceTabBar
          className={stack.tabs}
          tabs={PROJECT_WORKSPACE_TABS}
          activeTab={activeTab}
          onRequestTabChange={requestTabChange}
          disabled={tabsLocked}
          ariaLabel="Secciones de la feature"
          tabClassName={stack.tab}
          tabActiveClassName={stack.tabActive}
          tabDomId={overlayFeatureShellTabDomId}
          panelDomId={overlayFeatureShellPanelDomId}
        />
      }
      footer={
        showFooter ? (
          <WorkspaceStickyFooter
            className={stack.footerBar}
            leftActions={
              typeof onOpenFullPage === "function" ? (
                <Button type="button" variant="outline" onClick={onOpenFullPage} data-testid="project-feature-open-full-page">
                  Abrir en página completa
                </Button>
              ) : null
            }
            onCancel={onClose}
            onSave={handleFooterSave}
            saveDisabled={saveDisabled}
            cancelDisabled={footerSaving}
            isSaving={footerSaving}
            saveErrorMessage={footerSaveError}
            onReloadAfterConflict={!isFeatureEditTab && versionConflict ? onReloadAfterConflict : null}
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
        description={errorDialogMessage || featureSaveError || MSG_SAVE}
        confirmLabel="Entendido"
        cancelLabel=""
        onCancel={() => setErrorDialogOpen(false)}
        onConfirm={() => setErrorDialogOpen(false)}
      />
      {loading ? <div className={stack.loading}>Cargando feature…</div> : null}
      {error ? (
        <div className={stack.error} role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error && feature ? (
        <>
          <div
            id={overlayFeatureShellPanelDomId(PROJECT_DETAIL_TAB_VISTA)}
            role="tabpanel"
            aria-labelledby={overlayFeatureShellTabDomId(PROJECT_DETAIL_TAB_VISTA)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_VISTA}
          >
            {activeTab === PROJECT_DETAIL_TAB_VISTA ? (
              <FeatureViewTab
                feature={feature}
              />
            ) : null}
          </div>

          <div
            id={overlayFeatureShellPanelDomId(PROJECT_DETAIL_TAB_EDICION)}
            role="tabpanel"
            aria-labelledby={overlayFeatureShellTabDomId(PROJECT_DETAIL_TAB_EDICION)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_EDICION}
          >
            {activeTab === PROJECT_DETAIL_TAB_EDICION ? (
              <FeatureEditTab
                feature={feature}
                title={editTitle}
                description={editDescription}
                acceptanceCriteria={editAcceptanceCriteria}
                implementationCriteria={editImplementationCriteria}
                priority={editPriority}
                status={editStatus}
                onTitleChange={setEditTitle}
                onDescriptionChange={setEditDescription}
                onAcceptanceCriteriaChange={setEditAcceptanceCriteria}
                onImplementationCriteriaChange={setEditImplementationCriteria}
                onPriorityChange={setEditPriority}
                onStatusChange={setEditStatus}
                disabled={!canWriteFeature || featureSaving}
              />
            ) : null}
          </div>

          <div
            id={overlayFeatureShellPanelDomId(PROJECT_DETAIL_TAB_EVIDENCIA)}
            role="tabpanel"
            aria-labelledby={overlayFeatureShellTabDomId(PROJECT_DETAIL_TAB_EVIDENCIA)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_EVIDENCIA}
          >
            {activeTab === PROJECT_DETAIL_TAB_EVIDENCIA && draftData && projectData ? (
              <ProjectEvidenceTab
                evidenceMarkdown={draftData.evidence_markdown}
                onDraftPatch={onDraftPatch}
                canEdit={canEditProject}
                disabled={editBlocked}
                isDirty={projectIsDirty}
                projectId={projectData.id}
                featureId={feature.id}
                storyId=""
                evidenceHistoryResetKey={evidenceHistoryResetKey}
                workspaceFooterActions={{
                  onCancel: onClose,
                  onSave: onProjectSave,
                  saveDisabled: projectSaveBlocked,
                  cancelDisabled: projectIsSaving,
                  isSaving: projectIsSaving,
                }}
              />
            ) : null}
          </div>

          <div
            id={overlayFeatureShellPanelDomId(PROJECT_DETAIL_TAB_BACKLOG)}
            role="tabpanel"
            aria-labelledby={overlayFeatureShellTabDomId(PROJECT_DETAIL_TAB_BACKLOG)}
            hidden={activeTab !== PROJECT_DETAIL_TAB_BACKLOG}
          >
            {activeTab === PROJECT_DETAIL_TAB_BACKLOG ? (
              <FeatureStoriesBacklogTab
                stories={stories}
                loading={storiesLoading}
                errorMessage={storiesError}
                onRefresh={handleRefreshStories}
                onOpenStory={onOpenStory}
                interactionDisabled={blockStoryOpen}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </DetailWorkspaceShell>
  );
}