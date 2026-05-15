const { test, expect } = require("@playwright/test");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const BASE = getBaseUrl();

test.describe("Documents: platform hub, ISO list, and sidebar navigation", () => {
  test("authenticated user moves between platform documents, ISO list, and sidebar Documents link", async ({
    page,
    request,
  }) => {
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
