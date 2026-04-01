import { Badge } from "../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../design-system/components/Button/Button.jsx";
import { mapStoryStatusToDsBadgeVariant } from "../../pages/wave1DsMappers.js";
import stack from "../../pages/projectDetailStack.module.css";
import { DetailWorkspaceShell } from "./DetailWorkspaceShell.jsx";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import WorkspaceTabBar from "./WorkspaceTabBar.jsx";
import { WorkspaceFooter } from "./WorkspaceFooter.jsx";
import StoryWorkspaceContent from "./StoryWorkspaceContent.jsx";
import {
  OVERLAY_WORKSPACE_TAB_DETAIL,
  OVERLAY_WORKSPACE_TABS,
  overlayStoryPanelDomId,
  overlayStoryTabDomId,
} from "./overlayWorkspaceConstants.js";
import headerStyles from "./WorkspaceHeader.module.css";

export default function StoryDetailCard({
  story,
  loading,
  error,
  breadcrumbItems = [],
  onClose,
  onOpenFullPage,
}) {
  const headerMeta =
    story && !loading && !error ? (
      <>
        {story?.status ? <Badge variant={mapStoryStatusToDsBadgeVariant(story.status)}>{story.status}</Badge> : null}
        {story?.priority ? <span className={headerStyles.prio}>Prioridad: {story.priority}</span> : null}
      </>
    ) : null;

  const showFooter = typeof onOpenFullPage === "function" && !loading && !error && story;

  return (
    <DetailWorkspaceShell
      depth={2}
      rootDataTestId="project-detail-overlay-story"
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
          tabs={OVERLAY_WORKSPACE_TABS}
          activeTab={OVERLAY_WORKSPACE_TAB_DETAIL}
          onRequestTabChange={() => {}}
          disabled={false}
          ariaLabel="Secciones de la historia"
          tabClassName={stack.tab}
          tabActiveClassName={stack.tabActive}
          tabDomId={overlayStoryTabDomId}
          panelDomId={overlayStoryPanelDomId}
        />
      }
      footer={
        showFooter ? (
          <WorkspaceFooter>
            <div className={stack.footerActionsEnd}>
              <Button type="button" variant="outline" onClick={onOpenFullPage} data-testid="project-story-open-full-page">
                Abrir en página completa
              </Button>
            </div>
          </WorkspaceFooter>
        ) : null
      }
    >
      <StoryWorkspaceContent story={story} loading={loading} error={error} />
    </DetailWorkspaceShell>
  );
}
