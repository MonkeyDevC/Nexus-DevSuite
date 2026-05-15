/**
 * Cliente — resolver código humano (PR/FT/US) para navegación desde la topbar.
 */

import api from "./index.js";

/**
 * @param {string} q texto tal cual del input
 * @returns {Promise<object>} body.data del Response Layer v1
 */
export async function resolveWorkspaceItemCode(q) {
  const res = await api.get("/workspace/resolve-item-code", {
    params: { q: q != null ? String(q) : "" },
  });
  const body = res && res.data;
  if (!body || body.success !== true || !body.data) {
    const code = body && body.error && body.error.code ? String(body.error.code) : "UNKNOWN_ERROR";
    const err = new Error("resolve_workspace_item_failed");
    err.code = code;
    throw err;
  }
  return body.data;
}
