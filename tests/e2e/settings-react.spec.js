/**
 * Settings React — MASTER accede; EMPLOYEE 403; subnavegación y roles desde API.
 */
const { test, expect } = require("@playwright/test");

const BASE = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://localhost:3000";
const LOGIN_BODY = { email: "admin_nexus@nexus.com", password: "Zaq1029*" };
const E2E_EMPLOYEE_EMAIL = "react_e2e_employee@nexus.test";
const E2E_EMPLOYEE_PASSWORD = "EmployeeE2e123!";

async function loginByApi(request) {
  const loginResp = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: LOGIN_BODY,
  });
  const body = await loginResp.json();
  expect(body?.success).toBe(true);
  return body.data;
}

async function seedSession(page, accessToken, refreshToken) {
  await page.addInitScript(
    ([a, r]) => {
      sessionStorage.setItem("nexus_access_token", a);
      sessionStorage.setItem("nexus_refresh_token", r);
    },
    [accessToken, refreshToken]
  );
}

async function getEmployeeRoleId(request, masterToken) {
  const headers = { Authorization: `Bearer ${masterToken}` };
  const r = await request.get(`${BASE}/api/v1/auth/roles`, { headers });
  if (!r.ok()) return null;
  const b = await r.json();
  const roles = Array.isArray(b?.data) ? b.data : [];
  const emp = roles.find((x) => x && x.name === "EMPLOYEE");
  return emp?.id ? String(emp.id) : null;
}

async function ensureEmployeeTokens(request, masterToken) {
  const tryLogin = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: E2E_EMPLOYEE_EMAIL, password: E2E_EMPLOYEE_PASSWORD },
  });
  const tl = await tryLogin.json();
  if (tl?.success && tl.data?.access_token && tl.data?.refresh_token) return tl.data;

  const roleId = await getEmployeeRoleId(request, masterToken);
  if (!roleId) throw new Error("E2E: role EMPLOYEE");
  const cr = await request.post(`${BASE}/api/v1/users`, {
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
  expect(cr.ok()).toBeTruthy();
  const login2 = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: E2E_EMPLOYEE_EMAIL, password: E2E_EMPLOYEE_PASSWORD },
  });
  const l2 = await login2.json();
  expect(l2?.success).toBe(true);
  return l2.data;
}

test.describe("Settings React", () => {
  test("MASTER: /settings render, layout, sección roles y query section", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("settings-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ajustes del sistema" })).toBeVisible();
    await expect(page.getByTestId("settings-layout")).toBeVisible();
    await expect(page.getByTestId("settings-panel-overview")).toBeVisible();

    await page.goto(`${BASE}/settings?section=roles`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("settings-roles-loading")).toHaveCount(0, { timeout: 60000 });
    await expect(page.getByTestId("settings-panel-roles")).toBeVisible();

    await page.goto(`${BASE}/settings?section=sprint`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("settings-panel-sprint")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("cell", { name: "PLANNED" })).toBeVisible();
  });

  test("EMPLOYEE: /settings → forbidden", async ({ page, request }) => {
    const master = await loginByApi(request);
    const emp = await ensureEmployeeTokens(request, master.access_token);
    await seedSession(page, emp.access_token, emp.refresh_token);

    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("forbidden-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("settings-root")).toHaveCount(0);
  });
});
