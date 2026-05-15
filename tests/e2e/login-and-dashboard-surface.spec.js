/**
 * Superficie de login y dashboard con Design System (runtime Express + build).
 * La ruta /__dev/design-system-smoke solo existe en dev o con VITE_DS_SMOKE=1.
 */
const { test, expect } = require("@playwright/test");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const BASE = getBaseUrl();

test.describe("Login and dashboard: design-system surfaces", () => {
  test("login route renders design-system form surface and submit control without page errors", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("ds-login-form-surface")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("login-submit")).toBeVisible();
    expect(pageErrors, `pageerror: ${pageErrors.join("; ")}`).toHaveLength(0);
  });

  test("dashboard shows KPI grid, recent projects table shell, and main heading when session is seeded", async ({
    page,
    request,
  }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dashboard-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("[data-ds-page-container]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Panel de Control" })).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-card")).toBeVisible();
    await expect(page.getByText("Proyectos activos", { exact: false })).toBeVisible();
    await expect(page.getByTestId("dashboard-recent-projects-table")).toBeVisible({ timeout: 30000 });
  });

  test("optional dev-only DS smoke route when present in bundle", async ({ page }) => {
    await page.goto(`${BASE}/__dev/design-system-smoke`, { waitUntil: "domcontentloaded" });
    const smoke = page.locator("[data-design-system-smoke]");
    if ((await smoke.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description:
          "Ruta /__dev/design-system-smoke no montada (bundle producción típico). Usar VITE_DS_SMOKE=1 npm run build en frontend-react o Vite dev.",
      });
      return;
    }
    await expect(smoke).toBeVisible({ timeout: 10000 });
    await expect(smoke.getByText("DS Smoke", { exact: false })).toBeVisible();
  });
});
