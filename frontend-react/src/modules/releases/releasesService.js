import { get, post, put, del, patch } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../domain/apiEnvelope.js";
import { mapReleaseDto, mapReleaseListEnvelope } from "./releaseDto.js";

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

export async function listReleases({ page = 1, limit = 50, status } = {}) {
  try {
    const res = await get(`/releases${qs({ page, limit, status })}`);
    const data = unwrapSuccessData(res);
    return mapReleaseListEnvelope(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

/**
 * Releases cuyo detalle incluye al menos una feature o historia del proyecto (misma heurística que detalle/orphan).
 * Pagina el listado global hasta maxPages; por cada candidato consulta GET /releases/:id.
 */
export async function listReleasesLinkedToProject(projectId, { maxPages = 20, limit = 50 } = {}) {
  const pid = String(projectId).trim();
  const out = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const envelope = await listReleases({ page, limit });
    totalPages = Math.max(1, Number(envelope.totalPages) || 1);

    for (const item of envelope.items) {
      const id = item?.id;
      if (!id) continue;
      let detail;
      try {
        detail = await getRelease(id);
      } catch {
        continue;
      }
      const feats = Array.isArray(detail.features) ? detail.features : [];
      const stories = Array.isArray(detail.stories) ? detail.stories : [];
      const linkedFeat = feats.some((f) => f && String(f.project_id) === pid);
      const linkedStory = stories.some((s) => s && String(s.project_id) === pid);
      if (linkedFeat || linkedStory) {
        out.push(detail);
      }
    }

    if (!envelope.items || envelope.items.length === 0) break;
    page += 1;
  }

  return out;
}

export async function getRelease(releaseId) {
  try {
    const res = await get(`/releases/${encodeURIComponent(releaseId)}`);
    const data = unwrapSuccessData(res);
    const mapped = mapReleaseDto(data);
    if (!mapped) {
      const err = new Error("Release inválida");
      err.code = "RELEASE_NOT_FOUND";
      err.isDomainError = true;
      throw err;
    }
    return mapped;
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function createRelease({ name, version, description }) {
  try {
    const res = await post("/releases", { name, version, description: description || null });
    const data = unwrapSuccessData(res);
    return mapReleaseDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function updateRelease(releaseId, body) {
  try {
    const res = await put(`/releases/${encodeURIComponent(releaseId)}`, body);
    const data = unwrapSuccessData(res);
    return mapReleaseDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function patchReleaseDescription(releaseId, { description, change_request_id }) {
  try {
    const res = await patch(`/releases/${encodeURIComponent(releaseId)}`, {
      description,
      change_request_id,
    });
    const data = unwrapSuccessData(res);
    return mapReleaseDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function deleteRelease(releaseId) {
  try {
    const res = await del(`/releases/${encodeURIComponent(releaseId)}`);
    return unwrapSuccessData(res);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function startRelease(releaseId, changeRequestId) {
  try {
    const res = await post(`/releases/${encodeURIComponent(releaseId)}/start`, {
      change_request_id: changeRequestId,
    });
    const data = unwrapSuccessData(res);
    return mapReleaseDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function publishRelease(releaseId, changeRequestId) {
  try {
    const res = await post(`/releases/${encodeURIComponent(releaseId)}/release`, {
      change_request_id: changeRequestId,
    });
    const data = unwrapSuccessData(res);
    return mapReleaseDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function assignStoryToRelease(storyId, releaseId) {
  try {
    const res = await post(`/stories/${encodeURIComponent(storyId)}/assign-release`, {
      release_id: releaseId,
    });
    const data = unwrapSuccessData(res);
    return mapReleaseDto(data);
  } catch (e) {
    throw toDomainError(e);
  }
}

export async function removeStoryFromRelease(storyId) {
  try {
    const res = await post(`/stories/${encodeURIComponent(storyId)}/remove-release`, {});
    return unwrapSuccessData(res);
  } catch (e) {
    throw toDomainError(e);
  }
}
