import { get, post, put, del } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../domain/apiEnvelope.js";
import { mapStoryDeleteResult, mapStoryDto, mapStoryListEnvelope } from "./storyDto.js";

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

export async function listStoriesByFeature(featureId, { page = 1, limit = 50, status } = {}) {
  try {
    const res = await get(`/features/${encodeURIComponent(featureId)}/stories${qs({ page, limit, status })}`);
    const data = unwrapSuccessData(res);
    return mapStoryListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

const STORY_LIST_PAGE_SIZE = 100;

/**
 * Todas las historias de la feature (paginado server-side).
 * @param {string} featureId
 */
export async function listAllStoriesByFeature(featureId) {
  const all = [];
  let page = 1;
  while (true) {
    const env = await listStoriesByFeature(featureId, { page, limit: STORY_LIST_PAGE_SIZE });
    const batch = Array.isArray(env.items) ? env.items : [];
    all.push(...batch);
    const totalPages = Number(env.totalPages);
    const isLast = Number.isFinite(totalPages) && totalPages >= 1 ? page >= totalPages : batch.length < STORY_LIST_PAGE_SIZE;
    if (isLast) break;
    page += 1;
  }
  return all;
}

export async function getStory(storyId) {
  try {
    const res = await get(`/stories/${encodeURIComponent(storyId)}`);
    const data = unwrapSuccessData(res);
    const mapped = mapStoryDto(data);
    if (!mapped) {
      const err = new Error("Story invalida");
      err.code = "STORY_NOT_FOUND";
      err.isDomainError = true;
      throw err;
    }
    return mapped;
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function createStory(featureId, payload) {
  try {
    const res = await post(`/features/${encodeURIComponent(featureId)}/stories`, payload);
    const data = unwrapSuccessData(res);
    return mapStoryDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function updateStory(storyId, payload) {
  try {
    const res = await put(`/stories/${encodeURIComponent(storyId)}`, payload);
    const data = unwrapSuccessData(res);
    return mapStoryDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function deleteStory(storyId) {
  try {
    const res = await del(`/stories/${encodeURIComponent(storyId)}`);
    const data = unwrapSuccessData(res);
    return mapStoryDeleteResult(data);
  } catch (e) {
    throw toDomainError(e);
  }
}
