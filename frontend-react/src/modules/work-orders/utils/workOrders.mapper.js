import {
  WORK_ORDER_KIND,
  WORK_ORDER_KIND_LABEL,
  WORK_ORDER_STATUS_LABEL,
  WORK_ORDER_PRIORITY_LABEL,
} from "./workOrders.constants.js";

/**
 * Código visible tipo wireframe: WO-102 / RW-103.
 * @param {object} row
 * @param {string} row.kind
 * @param {number} row.ot_number
 */
export function formatWorkOrderDisplayId(row) {
  if (!row) return "—";
  const prefix = row.kind === WORK_ORDER_KIND.REWORK ? WORK_ORDER_KIND_LABEL.REWORK : WORK_ORDER_KIND_LABEL.WORK;
  const n = row.ot_number != null ? Number(row.ot_number) : NaN;
  if (!Number.isFinite(n)) return `${prefix}-?`;
  return `${prefix}-${n}`;
}

/**
 * @param {object} raw — DTO API (snake_case)
 */
export function mapWorkOrderFromApi(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: raw.id != null ? String(raw.id) : "",
    ot_number: raw.ot_number != null ? Number(raw.ot_number) : null,
    kind: raw.kind === WORK_ORDER_KIND.REWORK ? WORK_ORDER_KIND.REWORK : WORK_ORDER_KIND.WORK,
    project_id: raw.project_id != null ? String(raw.project_id) : "",
    user_story_id: raw.user_story_id != null ? String(raw.user_story_id) : "",
    title: raw.title != null ? String(raw.title) : "",
    description: raw.description != null ? String(raw.description) : "",
    status: raw.status != null ? String(raw.status) : "",
    priority: raw.priority != null ? String(raw.priority) : "",
    assigned_to_user_id: raw.assigned_to_user_id != null ? String(raw.assigned_to_user_id) : "",
    version: raw.version != null ? Number(raw.version) : 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export function workOrderStatusLabel(status) {
  if (!status) return "—";
  return WORK_ORDER_STATUS_LABEL[status] || status;
}

export function workOrderPriorityLabel(priority) {
  if (!priority) return "—";
  return WORK_ORDER_PRIORITY_LABEL[priority] || priority;
}
