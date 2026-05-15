"use strict";

const { getBaseUrl } = require("./constants");

const E2E_EMPLOYEE_EMAIL = "react_e2e_employee@nexus.test";
const E2E_EMPLOYEE_PASSWORD = "EmployeeE2e123!";

async function getEmployeeRoleId(request, masterToken) {
  const base = getBaseUrl();
  const headers = { Authorization: `Bearer ${masterToken}` };
  const r = await request.get(`${base}/api/v1/auth/roles`, { headers });
  if (!r.ok()) return null;
  const b = await r.json();
  const roles = Array.isArray(b?.data) ? b.data : [];
  const emp = roles.find((x) => x && x.name === "EMPLOYEE");
  return emp?.id ? String(emp.id) : null;
}

/**
 * Obtiene tokens de usuario EMPLOYEE para E2E (crea usuario si no existe).
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} masterToken access_token MASTER
 */
async function ensureEmployeeTokens(request, masterToken) {
  const base = getBaseUrl();
  const tryLogin = await request.post(`${base}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: E2E_EMPLOYEE_EMAIL, password: E2E_EMPLOYEE_PASSWORD },
  });
  const tl = await tryLogin.json();
  if (tl?.success && tl.data?.access_token && tl.data?.refresh_token) return tl.data;

  const roleId = await getEmployeeRoleId(request, masterToken);
  if (!roleId) throw new Error("E2E: role EMPLOYEE no disponible (GET /auth/roles)");
  const cr = await request.post(`${base}/api/v1/users`, {
    headers: {
      Authorization: `Bearer ${masterToken}`,
      "Content-Type": "application/json",
    },
    data: {
      email: E2E_EMPLOYEE_EMAIL,
      password: E2E_EMPLOYEE_PASSWORD,
      role_id: roleId,
    },
  });
  const cb = await cr.json();
  if (!cr.ok()) {
    throw new Error(`E2E: POST /users EMPLOYEE ${cr.status()} ${JSON.stringify(cb)}`);
  }
  const again = await request.post(`${base}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: E2E_EMPLOYEE_EMAIL, password: E2E_EMPLOYEE_PASSWORD },
  });
  const ab = await again.json();
  if (!ab?.success || !ab.data?.access_token) {
    throw new Error(`E2E: login EMPLOYEE falló ${JSON.stringify(ab)}`);
  }
  return ab.data;
}

module.exports = {
  E2E_EMPLOYEE_EMAIL,
  E2E_EMPLOYEE_PASSWORD,
  ensureEmployeeTokens,
  getEmployeeRoleId,
};
