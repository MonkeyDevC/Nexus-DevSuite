/**
 * Settings: MASTER ve el layout y secciones; EMPLOYEE recibe forbidden.
 */
const { test, expect } = require("@playwright/test");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");
const { ensureEmployeeTokens } = require("./support/employeeUser.js");

const BASE = getBaseUrl();

test.describe("Settings: master layout, roles section, and employee RBAC", () => {
  test("MASTER user sees settings shell, overview, roles table after load, and static sprint statuses", async ({
    page,
    request,
  }) => {
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

  test("EMPLOYEE user navigating to /settings sees forbidden surface, not settings root", async ({ page, request }) => {
    const master = await loginByApi(request);
    const emp = await ensureEmployeeTokens(request, master.access_token);
    await seedSession(page, emp.access_token, emp.refresh_token);

    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("forbidden-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("settings-root")).toHaveCount(0);
  });
});
