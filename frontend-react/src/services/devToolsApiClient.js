/**
 * DEV Tools API client (solo dev / solo MASTER).
 */
import api from "./apiClient.js";

export async function resetDummyData() {
  const response = await api.post(
    "/system/dev-tools/reset-dummy-data",
    {},
    {
      headers: {
        "x-confirm-reset": "RESET",
      },
    }
  );
  const body = response && response.data;
  if (!body || body.success !== true) {
    const msg = body && body.error && body.error.message ? String(body.error.message) : "Error ejecutando reset";
    const err = new Error(msg);
    err.code = body && body.error && body.error.code ? String(body.error.code) : "RESET_FAILED";
    throw err;
  }
  return body.data;
}

