import { get, post, put, del, patch } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../../shared/api/apiEnvelope.js";
import { mapFeatureDeleteResult, mapFeatureDto, mapFeatureListEnvelope } from "./featureDto.js";

/** Máximo permitido por backlog.validator.js (listFeaturesProjectQueryValidator). */
export const FEATURES_LIST_MAX_LIMIT = 100;

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

function clampFeaturesListLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(Math.floor(n), FEATURES_LIST_MAX_LIMIT);
}

export async function listFeatures(projectId, { page = 1, limit = 50, status } = {}) {
  try {
    const safeLimit = clampFeaturesListLimit(limit);
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const res = await get(`/features${qs({ project_id: projectId, page: safePage, limit: safeLimit, status })}`);
    const data = unwrapSuccessData(res);
    return mapFeatureListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

/**
 * Todas las features del proyecto (paginación interna, limit ≤ FEATURES_LIST_MAX_LIMIT por request).
 * @param {string} projectId
 * @param {{ status?: string }} [options]
 */
export async function listAllFeaturesForProject(projectId, { status } = {}) {
  const limit = FEATURES_LIST_MAX_LIMIT;
  const merged = [];
  let page = 1;
  let totalPages = 1;
  do {
    const envelope = await listFeatures(projectId, { page, limit, status });
    const batch = Array.isArray(envelope.items) ? envelope.items : [];
    merged.push(...batch);
    const tp = Number(envelope.totalPages);
    totalPages = Number.isFinite(tp) && tp > 0 ? tp : 1;
    if (batch.length === 0 || page >= totalPages) break;
    page += 1;
  } while (page <= 1000);
  return {
    items: merged,
    total: merged.length,
    page: 1,
    limit: merged.length,
    totalPages: 1,
  };
}

export async function getFeature(featureId) {
  try {
    const res = await get(`/features/${encodeURIComponent(featureId)}`);
    const data = unwrapSuccessData(res);
    const mapped = mapFeatureDto(data);
    if (!mapped) {
      const err = new Error("Feature invalida");
      err.code = "FEATURE_NOT_FOUND";
      err.isDomainError = true;
      throw err;
    }
    return mapped;
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function createFeature({ projectId, title, description, priority }) {
  try {
    const res = await post("/features", {
      project_id: projectId,
      title,
      description,
      ...(priority ? { priority } : {}),
    });
    const data = unwrapSuccessData(res);
    return mapFeatureDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function updateFeature(featureId, payload) {
  try {
    const res = await put(`/features/${encodeURIComponent(featureId)}`, payload);
    const data = unwrapSuccessData(res);
    return mapFeatureDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function deleteFeature(featureId) {
  try {
    const res = await del(`/features/${encodeURIComponent(featureId)}`);
    const data = unwrapSuccessData(res);
    return mapFeatureDeleteResult(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function updateFeatureStatus(featureId, nextStatus) {
  try {
    const res = await patch(`/features/${encodeURIComponent(featureId)}/status`, { status: nextStatus });
    const data = unwrapSuccessData(res);
    return mapFeatureDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}
