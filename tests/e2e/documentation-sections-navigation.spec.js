const { test, expect } = require("@playwright/test");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const BASE = getBaseUrl();

test.describe("Documentation: functional and technical sections with deep link", () => {
  test("user switches panels, sees expected content, reload preserves documentation shell", async ({
    page,
    request,
  }) => {
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

    await page
      .getByTestId("documentation-layout")
      .getByRole("button", { name: "Documentos", exact: true })
      .click();
    await expect(page.getByTestId("documentation-panel-documents")).toBeVisible();
    await expect(page.getByRole("link", { name: /Ir a Documentos/ })).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documentation-root")).toBeVisible({ timeout: 30000 });
  });

  test("direct URL with ?section=technical opens technical panel", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    await page.goto(`${BASE}/documentation?section=technical`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("documentation-panel-technical")).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".nexus-doc-body")).toBeVisible();
  });
});
