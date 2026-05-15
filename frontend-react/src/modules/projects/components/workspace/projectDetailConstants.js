/** Pestañas del workspace de proyecto (contrato UI interno). */
export const PROJECT_DETAIL_TAB_VISTA = "vista";
export const PROJECT_DETAIL_TAB_EDICION = "edicion";
export const PROJECT_DETAIL_TAB_EVIDENCIA = "evidencia";
export const PROJECT_DETAIL_TAB_BACKLOG = "backlog";

/** Pestaña de órdenes de trabajo en el overlay de User Story (no confundir con el backlog de feature). */
export const STORY_DETAIL_TAB_WORK_ORDERS = "work_orders";

export const PROJECT_DETAIL_DISCARD_CONFIRM_MESSAGE =
  "Tiene cambios sin guardar. ¿Descartar cambios y continuar?";

export function projectDetailTabDomId(tab) {
  return `project-detail-tab-${tab}`;
}

export function projectDetailPanelDomId(tab) {
  return `project-detail-panel-${tab}`;
}
