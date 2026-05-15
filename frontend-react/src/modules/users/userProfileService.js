import { put } from "../../shared/http/index.js";
import httpClient from "../../shared/http/httpClient.js";
import { unwrapSuccessData } from "../../shared/api/apiEnvelope.js";

/**
 * Actualiza nombre (y opcionalmente URL de foto) del propio usuario.
 * Backend: solo `name` y `profile_photo_url` si el actor no es MASTER.
 */
export async function updateMyProfile(userId, { name }) {
  const payload = {};
  if (name !== undefined) payload.name = name;
  const res = await put(`/users/${encodeURIComponent(userId)}`, payload);
  return unwrapSuccessData(res);
}

/**
 * Sube imagen de perfil (campo multipart `photo`).
 * @param {string} userId
 * @param {File} file
 */
export async function uploadMyProfilePhoto(userId, file) {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await httpClient.post(`/users/${encodeURIComponent(userId)}/photo`, formData);
  return unwrapSuccessData(res);
}
