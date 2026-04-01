/**
 * Subida de imágenes de evidencia (multipart) al almacén del proyecto.
 */
import httpClient from "../shared/http/httpClient.js";

function extractUploadPayload(body) {
  if (!body || typeof body !== "object") return null;
  if (body.success !== true || !body.data) return null;
  const d = body.data;
  if (typeof d.url !== "string" || !d.url) return null;
  return d;
}

/**
 * @param {string} projectId
 * @param {File|Blob} file
 * @param {{ featureId?: string, storyId?: string }} [scope]
 * @returns {Promise<{ url: string, relative_path?: string, filename?: string }>}
 */
export async function uploadProjectEvidenceImage(projectId, file, scope = {}) {
  const fd = new FormData();
  const name = file && typeof file.name === "string" && file.name ? file.name : "pasted.png";
  fd.append("file", file, name);

  const params = new URLSearchParams();
  if (scope.featureId) params.set("feature_id", scope.featureId);
  if (scope.storyId) params.set("story_id", scope.storyId);
  const qs = params.toString();
  const url = `/projects/${encodeURIComponent(projectId)}/evidence-images${qs ? `?${qs}` : ""}`;

  const res = await httpClient.post(url, fd, {
    transformRequest: [
      (data, headers) => {
        delete headers["Content-Type"];
        return data;
      },
    ],
  });

  const payload = extractUploadPayload(res.data);
  if (!payload) {
    const msg =
      res.data && !res.data.success && res.data.error && res.data.error.message
        ? String(res.data.error.message)
        : "No se pudo subir la imagen";
    throw new Error(msg);
  }
  return payload;
}
