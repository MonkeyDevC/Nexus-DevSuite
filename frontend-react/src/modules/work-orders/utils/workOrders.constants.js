/** @typedef {"WORK"|"REWORK"} WorkOrderKindMachine */

export const WORK_ORDER_KIND = {
  WORK: "WORK",
  REWORK: "REWORK",
};

export const WORK_ORDER_KIND_LABEL = {
  WORK: "WO",
  REWORK: "RW",
};

export const WORK_ORDER_KIND_UI_LABEL = {
  WORK: "Trabajo",
  REWORK: "Reproceso",
};

/** Valores enviados al API de listado (sin "all"). */
export const WORK_ORDER_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
};

export const WORK_ORDER_STATUS_LABEL = {
  PENDING: "Por hacer",
  IN_PROGRESS: "En curso",
  IN_REVIEW: "En revisión",
  DONE: "Hecho",
};

export const WORK_ORDER_PRIORITY_LABEL = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const WORK_ORDER_LIST_PAGE_SIZE = 100;
