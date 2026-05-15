/**
 * Tabs del shell para capas overlay (Feature / Story): una sola estación "Detalle"
 * mantiene la misma cromía de barra que el proyecto sin inventar flujos nuevos.
 */
export const OVERLAY_WORKSPACE_TAB_DETAIL = "detail";

/** @type {import('./workspaceShellContracts.js').WorkspaceTabDescriptor[]} */
export const OVERLAY_WORKSPACE_TABS = [{ id: OVERLAY_WORKSPACE_TAB_DETAIL, icon: "◉", label: "Detalle" }];

export function overlayFeatureTabDomId(tabId) {
  return `project-detail-overlay-feature-tab-${tabId}`;
}

export function overlayFeaturePanelDomId(tabId) {
  return `project-detail-overlay-feature-panel-${tabId}`;
}

export function overlayStoryTabDomId(tabId) {
  return `project-detail-overlay-story-tab-${tabId}`;
}

export function overlayStoryPanelDomId(tabId) {
  return `project-detail-overlay-story-panel-${tabId}`;
}

/** IDs ARIA para las 4 pestañas del shell de feature (mismo contrato que el proyecto). */
export function overlayFeatureShellTabDomId(tabId) {
  return `project-detail-overlay-feature-shell-tab-${tabId}`;
}

export function overlayFeatureShellPanelDomId(tabId) {
  return `project-detail-overlay-feature-shell-panel-${tabId}`;
}

export function overlayStoryShellTabDomId(tabId) {
  return `project-detail-overlay-story-shell-tab-${tabId}`;
}

export function overlayStoryShellPanelDomId(tabId) {
  return `project-detail-overlay-story-shell-panel-${tabId}`;
}
