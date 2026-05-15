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
