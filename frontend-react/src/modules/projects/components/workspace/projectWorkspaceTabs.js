/**
 * Descriptores de pestañas del workspace de proyecto (contrato consumido por WorkspaceTabBar).
 */
import {
  PROJECT_DETAIL_TAB_BACKLOG,
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_EVIDENCIA,
  PROJECT_DETAIL_TAB_VISTA,
} from "./projectDetailConstants.js";

/** @type {import('./workspaceShellContracts.js').WorkspaceTabDescriptor[]} */
export const PROJECT_WORKSPACE_TABS = [
  { id: PROJECT_DETAIL_TAB_VISTA, icon: "◉", label: "Vista" },
  { id: PROJECT_DETAIL_TAB_EDICION, icon: "✎", label: "Edición" },
  { id: PROJECT_DETAIL_TAB_EVIDENCIA, icon: "📎", label: "Evidencia" },
  { id: PROJECT_DETAIL_TAB_BACKLOG, icon: "☰", label: "Backlog" },
];
