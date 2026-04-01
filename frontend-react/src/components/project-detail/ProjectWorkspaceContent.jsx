/**
 * Contenido específico del workspace de negocio para proyecto (sin shell).
 * Estados de carga/error y paneles por pestaña; el scroll lo aplica DetailWorkspaceShell.
 */
import stack from "../../pages/projectDetailStack.module.css";
import ProjectViewTab from "./ProjectViewTab.jsx";
import ProjectEditTab from "./ProjectEditTab.jsx";
import ProjectEvidenceTab from "./ProjectEvidenceTab.jsx";
import ProjectBacklogTab from "./ProjectBacklogTab.jsx";
import {
  PROJECT_DETAIL_TAB_BACKLOG,
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_EVIDENCIA,
  PROJECT_DETAIL_TAB_VISTA,
  projectDetailPanelDomId,
  projectDetailTabDomId,
} from "./projectDetailConstants.js";
import { getBacklogFeaturesForProject } from "../../modules/backlog/backlogService.js";

const MSG_ERROR = "Error cargando datos";
const MSG_NOT_FOUND = "Elemento no encontrado";

/**
 * @param {object} props
 * @param {boolean} props.loading
 * @param {string} props.errorLoadMessage
 * @param {object | null} props.projectData
 * @param {object | null} props.draftData
 * @param {string} props.activeTab
 * @param {string} props.projectCode
 * @param {string} props.validFeatureId
 * @param {string} props.validStoryId
 * @param {string} props.evidenceHistoryResetKey
 * @param {import('react-router-dom').NavigateFunction} props.navigate
 * @param {() => void} props.requestCloseWorkspace
 * @param {() => void} props.onSave
 * @param {boolean} props.isDirty
 * @param {boolean} props.isSaving
 * @param {boolean} props.canEditProject
 * @param {boolean} props.editBlocked
 * @param {(patch: object) => void} props.onDraftPatch
 * @param {object[]} props.backlogFeatures
 * @param {boolean} props.backlogLoading
 * @param {string} props.backlogError
 * @param {(fid: string) => void} props.requestOpenFeature
 * @param {() => void} [props.requestCreateFeature]
 * @param {boolean} props.featureLoading
 * @param {boolean} props.storyLoading
 * @param {(fn: (prev: object[]) => object[]) => void} props.setBacklogFeatures
 * @param {(v: boolean) => void} props.setBacklogLoading
 * @param {(v: string) => void} props.setBacklogError
 * @param {boolean} props.canReleases
 * @param {() => Promise<void>} props.reloadProjectFromServer
 */
export default function ProjectWorkspaceContent({
  loading,
  errorLoadMessage,
  projectData,
  draftData,
  activeTab,
  projectCode,
  validFeatureId,
  validStoryId,
  evidenceHistoryResetKey,
  navigate,
  requestCloseWorkspace,
  onSave,
  isDirty,
  isSaving,
  canEditProject,
  editBlocked,
  onDraftPatch,
  backlogFeatures,
  backlogLoading,
  backlogError,
  requestOpenFeature,
  requestCreateFeature,
  featureLoading,
  storyLoading,
  setBacklogFeatures,
  setBacklogLoading,
  setBacklogError,
  canReleases,
  reloadProjectFromServer,
}) {
  if (loading) {
    return <div className={stack.loading}>Cargando…</div>;
  }

  if (errorLoadMessage) {
    return (
      <div className={stack.error} role="alert">
        {errorLoadMessage}
        {errorLoadMessage === MSG_NOT_FOUND ? null : (
          <button
            type="button"
            style={{
              marginLeft: "var(--ds-space-2)",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={reloadProjectFromServer}
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (!projectData || !draftData) {
    return null;
  }

  return (
    <>
      <div
        id={projectDetailPanelDomId(PROJECT_DETAIL_TAB_VISTA)}
        role="tabpanel"
        aria-labelledby={projectDetailTabDomId(PROJECT_DETAIL_TAB_VISTA)}
        hidden={activeTab !== PROJECT_DETAIL_TAB_VISTA}
      >
        {activeTab === PROJECT_DETAIL_TAB_VISTA ? (
          <ProjectViewTab
            projectData={projectData}
            projectCodeDisplay={projectCode}
            canReleases={canReleases}
            onNavigateFeatures={() => navigate(`/projects/${projectData.id}/features`)}
            onNavigateSprints={() => navigate(`/projects/${projectData.id}/sprints`)}
            onNavigateIncidents={() => navigate(`/projects/${projectData.id}/incidents`)}
            onNavigateReleases={() => navigate(`/projects/${projectData.id}/releases`)}
          />
        ) : null}
      </div>

      <div
        id={projectDetailPanelDomId(PROJECT_DETAIL_TAB_EDICION)}
        role="tabpanel"
        aria-labelledby={projectDetailTabDomId(PROJECT_DETAIL_TAB_EDICION)}
        hidden={activeTab !== PROJECT_DETAIL_TAB_EDICION}
      >
        {activeTab === PROJECT_DETAIL_TAB_EDICION ? (
          <ProjectEditTab
            draftSlice={draftData}
            projectReadonlyMeta={projectData}
            onDraftPatch={onDraftPatch}
            disabled={editBlocked}
            projectCodeDisplay={projectCode}
            onProjectReload={reloadProjectFromServer}
          />
        ) : null}
      </div>

      <div
        id={projectDetailPanelDomId(PROJECT_DETAIL_TAB_EVIDENCIA)}
        role="tabpanel"
        aria-labelledby={projectDetailTabDomId(PROJECT_DETAIL_TAB_EVIDENCIA)}
        hidden={activeTab !== PROJECT_DETAIL_TAB_EVIDENCIA}
      >
        {activeTab === PROJECT_DETAIL_TAB_EVIDENCIA ? (
          <ProjectEvidenceTab
            evidenceMarkdown={draftData.evidence_markdown}
            onDraftPatch={onDraftPatch}
            canEdit={canEditProject}
            disabled={editBlocked}
            isDirty={isDirty}
            projectId={projectData.id}
            featureId={validFeatureId}
            storyId={validStoryId}
            evidenceHistoryResetKey={evidenceHistoryResetKey}
            workspaceFooterActions={{
              onCancel: requestCloseWorkspace,
              onSave,
              saveDisabled: !isDirty || isSaving || !canEditProject || projectData.status !== "ACTIVE",
              cancelDisabled: isSaving,
              isSaving,
            }}
          />
        ) : null}
      </div>

      <div
        id={projectDetailPanelDomId(PROJECT_DETAIL_TAB_BACKLOG)}
        role="tabpanel"
        aria-labelledby={projectDetailTabDomId(PROJECT_DETAIL_TAB_BACKLOG)}
        hidden={activeTab !== PROJECT_DETAIL_TAB_BACKLOG}
      >
        {activeTab === PROJECT_DETAIL_TAB_BACKLOG ? (
          <ProjectBacklogTab
            features={backlogFeatures}
            loading={backlogLoading}
            errorMessage={backlogError}
            onRefresh={() => {
              if (!projectData) return;
              setBacklogLoading(true);
              setBacklogError("");
              getBacklogFeaturesForProject(projectData.id)
                .then((data) => {
                  const items = data && Array.isArray(data.items) ? data.items : [];
                  setBacklogFeatures(items);
                })
                .catch(() => setBacklogError(MSG_ERROR))
                .finally(() => setBacklogLoading(false));
            }}
            onRequestOpenFeature={requestOpenFeature}
            onRequestCreateFeature={requestCreateFeature}
            interactionDisabled={featureLoading || storyLoading}
          />
        ) : null}
      </div>
    </>
  );
}
