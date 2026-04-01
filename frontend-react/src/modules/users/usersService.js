import { get } from "../../shared/http/index.js";
import { unwrapSuccessData, toDomainError } from "../domain/apiEnvelope.js";

/**
 * @param {string} userId
 * @returns {Promise<{ id: string, email: string, name: string|null }>}
 */
export async function getUserById(userId) {
  try {
    const res = await get(`/users/${encodeURIComponent(userId)}`);
    const data = unwrapSuccessData(res);
    const id = data && data.id != null ? String(data.id) : "";
    const email = data && data.email != null ? String(data.email) : "";
    const name = data && data.name != null ? String(data.name) : null;
    return { id, email, name };
  } catch (e) {
    throw toDomainError(e);
  }
}

