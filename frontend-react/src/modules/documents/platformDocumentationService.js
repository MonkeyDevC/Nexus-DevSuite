import { del, get, patch, post } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../../shared/api/apiEnvelope.js";
import { newDedupKey } from "./dedupKey.js";

function dedupConfig() {
  return { headers: { "x-dedup-key": newDedupKey() } };
}

export async function listPlatformDocumentation() {
  const res = await get("/documentation?limit=100&page=1&include_archived=true");
  return unwrapSuccessData(res);
}

/**
 * @param {string} id
 */
export async function getPlatformDocumentation(id) {
  const res = await get(`/documentation/${encodeURIComponent(id)}`);
  return unwrapSuccessData(res);
}

/**
 * @param {{ type: string, format: string, content: string, title: string }} payload
 */
export async function createPlatformDocumentation(payload) {
  const res = await post("/documentation", payload, dedupConfig());
  return unwrapSuccessData(res);
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} payload
 */
export async function patchPlatformDocumentation(id, payload) {
  const res = await patch(`/documentation/${encodeURIComponent(id)}`, payload, dedupConfig());
  return unwrapSuccessData(res);
}

/**
 * @param {string} id
 */
export async function deletePlatformDocumentation(id) {
  const res = await del(`/documentation/${encodeURIComponent(id)}`, dedupConfig());
  return unwrapSuccessData(res);
}

/**
 * @param {unknown} error
 */
export function normalizePlatformDocError(error) {
  return toDomainError(error);
}
