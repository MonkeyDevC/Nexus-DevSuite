/**
 * Carga del Product Backlog: estrategia primaria (GET /projects/:id/stories) o fallback paralelo.
 * Sin cache. Solo HTTP vía `get` compartido.
 */
import { get } from "../../../../shared/http/index.js";
import { unwrapSuccessData } from "../../../../shared/api/apiEnvelope.js";
import { getBacklogFeaturesForProject, getBacklogStoriesForFeature } from "../../backlogService.js";
import { buildNormalizedProductBacklogModel } from "../utils/normalizeProductBacklog.js";

const STORY_PAGE_SIZE = 100;

/**
 * @param {object} item
 * @returns {boolean}
 */
function isPrimaryStoryShapeSufficient(item) {
  if (!item || typeof item !== "object") return false;
  const featureId = item.feature_id ?? (item.feature && typeof item.feature === "object" ? item.feature.id : null);
  const projectId = item.project_id != null ? String(item.project_id).trim() : "";
  const hasId = item.id != null && String(item.id).trim() !== "";
  const hasTitle = typeof item.title === "string";
  const hasFeature = featureId != null && String(featureId).trim() !== "";
  const hasProject = projectId.length > 0;
  return Boolean(hasId && hasTitle && (hasFeature || hasProject));
}

/**
 * @param {string} projectId
 * @param {number} [startPage]
 * @returns {Promise<object[]>}
 */
async function fetchAllProjectStoriesPaginated(projectId, startPage = 1) {
  const all = [];
  let page = startPage;
  while (true) {
    const qs = new URLSearchParams({ page: String(page), limit: String(STORY_PAGE_SIZE) });
    const res = await get(`/projects/${encodeURIComponent(projectId)}/stories?${qs.toString()}`);
    const data = unwrapSuccessData(res);
    const items = Array.isArray(data?.items) ? data.items : [];
    all.push(...items);
    const totalPages = Number(data?.totalPages);
    const isLast =
      Number.isFinite(totalPages) && totalPages >= 1 ? page >= totalPages : items.length < STORY_PAGE_SIZE;
    if (isLast) break;
    page += 1;
  }
  return all;
}

/**
 * @param {string} projectId
 * @returns {Promise<{ rawStories: object[], rawFeatures: object[], fetchStrategy: "primary"|"fallback" }>}
 */
export async function loadProductBacklogRaw(projectId) {
  const probeQs = new URLSearchParams({ page: "1", limit: String(STORY_PAGE_SIZE) });
  const probeRes = await get(`/projects/${encodeURIComponent(projectId)}/stories?${probeQs.toString()}`);
  const probeData = unwrapSuccessData(probeRes);
  const probeItems = Array.isArray(probeData?.items) ? probeData.items : [];

  let rawStories;
  let fetchStrategy;

  if (probeItems.length === 0) {
    const total = Number(probeData?.total);
    const totalPages = Number(probeData?.totalPages);
    if (Number.isFinite(total) && total > 0) {
      rawStories = await fetchAllProjectStoriesPaginated(projectId, 1);
    } else if (Number.isFinite(totalPages) && totalPages > 1) {
      rawStories = await fetchAllProjectStoriesPaginated(projectId, 1);
    } else {
      rawStories = [];
    }
    fetchStrategy = "primary";
  } else if (isPrimaryStoryShapeSufficient(probeItems[0])) {
    const firstChunk = [...probeItems];
    if (firstChunk.length >= STORY_PAGE_SIZE) {
      const rest = await fetchAllProjectStoriesPaginated(projectId, 2);
      rawStories = [...firstChunk, ...rest];
    } else {
      rawStories = firstChunk;
    }
    fetchStrategy = "primary";
  } else {
    const { items: features } = await getBacklogFeaturesForProject(projectId);
    const featureList = Array.isArray(features) ? features : [];
    const featureIds = featureList.map((f) => f?.id).filter((id) => id != null && String(id).trim() !== "");
    const results = await Promise.all(featureIds.map((fid) => getBacklogStoriesForFeature(String(fid))));
    rawStories = [];
    for (let i = 0; i < featureIds.length; i += 1) {
      const data = results[i];
      const storyItems = data && Array.isArray(data.items) ? data.items : [];
      rawStories.push(...storyItems);
    }
    fetchStrategy = "fallback";
  }

  const { items: rawFeatures } = await getBacklogFeaturesForProject(projectId);
  return {
    rawStories,
    rawFeatures: Array.isArray(rawFeatures) ? rawFeatures : [],
    fetchStrategy,
  };
}

/**
 * @param {string} projectId
 */
export async function fetchNormalizedProductBacklog(projectId) {
  const { rawStories, rawFeatures, fetchStrategy } = await loadProductBacklogRaw(projectId);
  const normalizedData = buildNormalizedProductBacklogModel({ rawStories, rawFeatures, projectId });
  return { normalizedData, fetchStrategy, rawPayload: { rawStories, rawFeatures } };
}
