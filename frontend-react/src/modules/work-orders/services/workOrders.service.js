import { get, post, patch } from "../../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../../../shared/api/apiEnvelope.js";
import { mapWorkOrderFromApi } from "../utils/workOrders.mapper.js";

function qs(params) {
  const sp = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function basePath(projectId) {
  return `/projects/${encodeURIComponent(projectId)}/work-orders`;
}

/**
 * Listado paginado bajo proyecto; filtra por historia con `user_story_id`.
 * @returns {{ items: ReturnType<typeof mapWorkOrderFromApi>[], meta: object }}
 */
export async function listWorkOrdersForProject(projectId, { page = 1, limit = 20, user_story_id, status, kind } = {}) {
  try {
    const res = await get(
      `${basePath(projectId)}${qs({
        page,
        limit,
        user_story_id,
        status,
        kind,
      })}`,
    );
    const envelope = unwrapSuccessData(res);
    const data = envelope && typeof envelope === "object" ? envelope : {};
    const rawItems = Array.isArray(data.data) ? data.data : [];
    const items = rawItems.map(mapWorkOrderFromApi).filter(Boolean);
    const meta = data.meta && typeof data.meta === "object" ? data.meta : {};
    return { items, meta };
  } catch (e) {
    throw toDomainError(e);
  }
}

/**
 * @returns {ReturnType<typeof mapWorkOrderFromApi>|null}
 */
export async function getWorkOrder(projectId, workOrderId) {
  try {
    const res = await get(`${basePath(projectId)}/${encodeURIComponent(workOrderId)}`);
    const raw = unwrapSuccessData(res);
    return mapWorkOrderFromApi(raw);
  } catch (e) {
    throw toDomainError(e);
  }
}

/**
 * @returns {ReturnType<typeof mapWorkOrderFromApi>|null}
 */
export async function createWorkOrder(projectId, body) {
  try {
    const res = await post(basePath(projectId), body);
    const raw = unwrapSuccessData(res);
    return mapWorkOrderFromApi(raw);
  } catch (e) {
    throw toDomainError(e);
  }
}

/**
 * @returns {ReturnType<typeof mapWorkOrderFromApi>|null}
 */
export async function updateWorkOrder(projectId, workOrderId, body) {
  try {
    const res = await patch(`${basePath(projectId)}/${encodeURIComponent(workOrderId)}`, body);
    const raw = unwrapSuccessData(res);
    return mapWorkOrderFromApi(raw);
  } catch (e) {
    throw toDomainError(e);
  }
}
