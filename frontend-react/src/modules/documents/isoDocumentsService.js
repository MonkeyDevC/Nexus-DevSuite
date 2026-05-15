import { get, patch, post } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../../shared/api/apiEnvelope.js";

export async function listIsoDocuments(page = 1, limit = 10) {
  const res = await get(`/documents?page=${page}&limit=${limit}`);
  return unwrapSuccessData(res);
}

/**
 * @param {string} code
 */
export async function getIsoDocumentByCode(code) {
  const res = await get(`/documents/code/${encodeURIComponent(code)}`);
  return unwrapSuccessData(res);
}

/**
 * @param {string} id
 */
export async function getIsoDocument(id) {
  const res = await get(`/documents/${encodeURIComponent(id)}`);
  return unwrapSuccessData(res);
}

/**
 * @param {{ code: string, title: string, description?: string, project_id?: string }} payload
 */
export async function createIsoDocument(payload) {
  const res = await post("/documents", payload);
  return unwrapSuccessData(res);
}

/**
 * @param {string} documentId
 */
export async function listIsoVersions(documentId) {
  const res = await get(`/documents/${encodeURIComponent(documentId)}/versions`);
  const data = unwrapSuccessData(res);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Listado breve de proyectos (selector en alta ISO). */
export async function listProjectsForIsoSelect() {
  const res = await get("/projects?page=1&limit=100");
  const data = unwrapSuccessData(res);
  return Array.isArray(data?.items) ? data.items : [];
}

/**
 * @param {string} documentId
 * @param {string} versionId
 */
export async function getIsoVersion(documentId, versionId) {
  const res = await get(
    `/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}`,
  );
  return unwrapSuccessData(res);
}

/**
 * @param {string} documentId
 * @param {string} versionId
 * @param {{ content?: string }} payload
 */
export async function patchIsoVersionContent(documentId, versionId, payload) {
  const res = await patch(
    `/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}`,
    payload,
  );
  return unwrapSuccessData(res);
}

/**
 * @param {string} documentId
 * @param {string} versionId
 * @param {{ status: string }} payload
 */
export async function patchIsoVersionStatus(documentId, versionId, payload) {
  const res = await patch(
    `/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}/status`,
    payload,
  );
  return unwrapSuccessData(res);
}

/**
 * @param {string} documentId
 * @param {{ change_reason?: string, content?: string }} payload
 */
export async function createIsoVersion(documentId, payload) {
  const res = await post(`/documents/${encodeURIComponent(documentId)}/versions`, payload);
  return unwrapSuccessData(res);
}

export function normalizeIsoDocError(error) {
  return toDomainError(error);
}
