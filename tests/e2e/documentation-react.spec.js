const { test, expect } = require("@playwright/test");

const BASE =
  process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://127.0.0.1:3000";
const LOGIN_BODY = { email: "admin_nexus@nexus.com", password: "Zaq1029*" };

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
    [accessToken, refreshToken],
  );
}

test.describe("Documentation React (OLA N2)", () => {
  test("navegación, secciones y contenido funcional/técnico", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    await page.goto(`${BASE}/documentation`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documentation-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documentación", exact: true })).toBeVisible();
    await expect(page.locator(".nexus-doc-body")).toContainText("Introducción", { timeout: 15000 });

    await page.getByRole("button", { name: "Documentación técnica" }).click();
    await expect(page.getByTestId("documentation-panel-technical")).toBeVisible();
    await expect(page.locator(".nexus-doc-body")).toContainText("Arquitectura del sistema", { timeout: 15000 });

    await page.getByRole("button", { name: "Documentos" }).click();
    await expect(page.getByTestId("documentation-panel-documents")).toBeVisible();
    await expect(page.getByRole("link", { name: /Ir a Documentos/ })).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documentation-root")).toBeVisible({ timeout: 30000 });
  });

  test("acceso directo con ?section=technical", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    await page.goto(`${BASE}/documentation?section=technical`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documentation-panel-technical")).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".nexus-doc-body")).toBeVisible();
  });
});
