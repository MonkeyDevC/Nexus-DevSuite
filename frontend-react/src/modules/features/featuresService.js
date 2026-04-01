import { get, post, put, del, patch } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../domain/apiEnvelope.js";
import { mapFeatureDeleteResult, mapFeatureDto, mapFeatureListEnvelope } from "./featureDto.js";

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

export async function listFeatures(projectId, { page = 1, limit = 50, status } = {}) {
  try {
    const res = await get(`/features${qs({ project_id: projectId, page, limit, status })}`);
    const data = unwrapSuccessData(res);
    return mapFeatureListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
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
