import { get } from "../../shared/http/index.js";
import { unwrapSuccessData } from "../domain/apiEnvelope.js";

/**
 * GET /auth/roles — mismo origen que legacy settings.js (solo MASTER).
 * @returns {Promise<{ id: string, name: string, description: string }[]>}
 */
export async function listAuthRoles() {
  const res = await get("/auth/roles");
  const data = unwrapSuccessData(res);
  return Array.isArray(data) ? data : [];
}
