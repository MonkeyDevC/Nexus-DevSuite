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

test.describe("Documents React (OLA N3)", () => {
  test("plataforma: listado, ISO y navegación sidebar", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    await page.goto(`${BASE}/documents`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documents-platform-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documentos", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Documentos ISO" }).click();
    await expect(page).toHaveURL(/\/documents\/iso$/);
    await expect(page.getByTestId("documents-iso-list-root")).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: /Volver a contenido de plataforma/ }).click();
    await expect(page).toHaveURL(/\/documents$/);

    await page.getByTestId("nav-documents-link").click();
    await expect(page.getByTestId("documents-platform-root")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documents-platform-root")).toBeVisible({ timeout: 30000 });
  });
});
