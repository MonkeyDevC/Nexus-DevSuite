import { get } from "../../shared/http/index.js";
import { unwrapSuccessData } from "../../shared/api/apiEnvelope.js";

export async function getBacklogProject(projectId) {
  const res = await get(`/projects/${encodeURIComponent(projectId)}`);
  return unwrapSuccessData(res);
}

const FEATURE_LIST_PAGE_SIZE = 100;

/**
 * Lista todas las features del proyecto paginando (el listado por defecto del API es limit=10).
 * @param {string} projectId
 * @returns {Promise<{ items: object[] }>}
 */
export async function getBacklogFeaturesForProject(projectId) {
  const all = [];
  let page = 1;
  while (true) {
    const qs = new URLSearchParams({ page: String(page), limit: String(FEATURE_LIST_PAGE_SIZE) });
    const res = await get(`/projects/${encodeURIComponent(projectId)}/features?${qs.toString()}`);
    const data = unwrapSuccessData(res);
    const items = Array.isArray(data?.items) ? data.items : [];
    all.push(...items);
    const totalPages = Number(data?.totalPages);
    const isLast = Number.isFinite(totalPages) && totalPages >= 1 ? page >= totalPages : items.length < FEATURE_LIST_PAGE_SIZE;
    if (isLast) break;
    page += 1;
  }
  return { items: all };
}

export async function getBacklogStoriesForFeature(featureId) {
  const res = await get(`/features/${encodeURIComponent(featureId)}/stories`);
  return unwrapSuccessData(res);
}
