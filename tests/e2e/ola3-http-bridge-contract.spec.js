/**
 * CHECKPOINT 4 (Ola 3): contrato HTTP oficial en runtime tras retirar public/js/api.js.
 * - window.fetchApi no debe existir (contrato legacy eliminado).
 * - window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi es la única compatibilidad soportada.
 */
const { test, expect } = require("@playwright/test");

test.describe("Ola 3 — contrato HTTP bridge en runtime", () => {
  test("typeof window.fetchApi === 'undefined' y bridge fetchApi es función", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        Boolean(
          window.NEXUS_HTTP_LEGACY_BRIDGE &&
            typeof window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi === "function"
        ),
      { timeout: 60000 }
    );

    const contract = await page.evaluate(() => ({
      fetchApiType: typeof window.fetchApi,
      bridgeFetchApiType:
        window.NEXUS_HTTP_LEGACY_BRIDGE &&
        typeof window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi,
    }));

    expect(contract.fetchApiType).toBe("undefined");
    expect(contract.bridgeFetchApiType).toBe("function");
  });

  test("GET /js/api.js responde 404 (archivo legacy eliminado)", async ({ request }) => {
    const res = await request.get("/js/api.js");
    expect(res.status()).toBe(404);
  });
});
