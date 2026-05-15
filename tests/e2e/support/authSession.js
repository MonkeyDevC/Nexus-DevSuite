"use strict";

const { expect } = require("@playwright/test");
const { getBaseUrl, DEFAULT_MASTER_LOGIN } = require("./constants");

/**
 * Login vía API oficial; devuelve el objeto `data` del contrato Nexus.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ email: string, password: string }} [credentials]
 */
async function loginByApi(request, credentials = DEFAULT_MASTER_LOGIN) {
  const base = getBaseUrl();
  const loginResp = await request.post(`${base}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: credentials,
  });
  const body = await loginResp.json();
  expect(body?.success).toBe(true);
  return body.data;
}

/**
 * Inyecta tokens en sessionStorage antes del primer paint útil.
 */
async function seedSession(page, accessToken, refreshToken) {
  await page.addInitScript(
    ([a, r]) => {
      // El HTTP layer prioriza localStorage sobre sessionStorage (`getTokenPair`).
      // Sin limpiar localStorage, sesiones residuales del dev local pueden ganar y provocar 401 en E2E.
      try {
        localStorage.removeItem("nexus_access_token");
        localStorage.removeItem("nexus_refresh_token");
        // Si la última actividad es vieja, AuthContext expulsa la sesión y borra también sessionStorage.
        localStorage.removeItem("nexus_last_activity_at");
        localStorage.removeItem("nexus_session_login_at");
      } catch {
        /* ignore */
      }
      sessionStorage.setItem("nexus_access_token", a);
      sessionStorage.setItem("nexus_refresh_token", r);
    },
    [accessToken, refreshToken]
  );
}

module.exports = {
  loginByApi,
  seedSession,
};
