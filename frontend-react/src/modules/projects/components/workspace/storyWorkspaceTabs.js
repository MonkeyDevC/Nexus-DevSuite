import {
  PROJECT_DETAIL_TAB_EDICION,
  PROJECT_DETAIL_TAB_EVIDENCIA,
  PROJECT_DETAIL_TAB_VISTA,
  STORY_DETAIL_TAB_WORK_ORDERS,
} from "./projectDetailConstants.js";

/** Tabs del shell de detalle de historia: backlog de feature vive en la feature, aquí son Work Orders. */
export const STORY_WORKSPACE_TABS = [
  { id: PROJECT_DETAIL_TAB_VISTA, icon: "◉", label: "Vista" },
  { id: PROJECT_DETAIL_TAB_EDICION, icon: "✎", label: "Edición" },
  { id: PROJECT_DETAIL_TAB_EVIDENCIA, icon: "📎", label: "Evidencia" },
  { id: STORY_DETAIL_TAB_WORK_ORDERS, icon: "⚙", label: "Work Orders" },
];
