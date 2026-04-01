/**
 * Validación runtime mínima del Design System integrado en login/dashboard.
 * Smoke /__dev/design-system-smoke solo existe con import.meta.env.DEV o VITE_DS_SMOKE=1 en el bundle.
 */
const { test, expect } = require("@playwright/test");

const BASE = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://localhost:3000";
const LOGIN_BODY = { email: "admin_nexus@nexus.com", password: "Zaq1029*" };

async function loginByApi(request) {
  const loginResp = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: LOGIN_BODY,
  });
  const body = await loginResp.json();
  if (!body?.success) {
    throw new Error(`API login failed: ${loginResp.status()} ${JSON.stringify(body)}`);
  }
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

test.describe("Design system — integración runtime", () => {
  test("login: Card + Input + Button DS visibles", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("ds-login-form-surface")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("login-submit")).toBeVisible();
    expect(pageErrors, `pageerror: ${pageErrors.join("; ")}`).toHaveLength(0);
  });

  test("dashboard: PageContainer + KPIs (sesión API)", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dashboard-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("[data-ds-page-container]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Panel de Control" })).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-card")).toBeVisible();
    await expect(page.getByText("Proyectos activos", { exact: false })).toBeVisible();
  });

  test("smoke DS: visible solo si la ruta está registrada en el bundle", async ({ page }) => {
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
