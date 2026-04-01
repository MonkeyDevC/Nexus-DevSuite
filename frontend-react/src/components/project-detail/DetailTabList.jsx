/**
 * Pestañas del proyecto: delega en WorkspaceTabBar con DOM ids del contrato legacy.
 */
import WorkspaceTabBar from "./WorkspaceTabBar.jsx";
import { PROJECT_WORKSPACE_TABS } from "./projectWorkspaceTabs.js";
import { projectDetailPanelDomId, projectDetailTabDomId } from "./projectDetailConstants.js";

export default function DetailTabList({
  activeTab,
  onRequestTabChange,
  disabled = false,
  className = "",
  tabClassName,
  tabActiveClassName,
}) {
  return (
    <WorkspaceTabBar
      tabs={PROJECT_WORKSPACE_TABS}
      activeTab={activeTab}
      onRequestTabChange={onRequestTabChange}
      disabled={disabled}
      ariaLabel="Secciones del proyecto"
      className={className}
      tabClassName={tabClassName}
      tabActiveClassName={tabActiveClassName}
      tabDomId={projectDetailTabDomId}
      panelDomId={projectDetailPanelDomId}
    />
  );
}
