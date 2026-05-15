/**
 * Contrato público del bridge HTTP en runtime (build React).
 * - window.fetchApi no debe existir (contrato legacy eliminado).
 * - window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi es la compatibilidad soportada en runtime.
 */
const { test, expect } = require("@playwright/test");

test.describe("HTTP legacy bridge: public runtime contract", () => {
  test("window.fetchApi is undefined and NEXUS_HTTP_LEGACY_BRIDGE.fetchApi is a function", async ({ page }) => {
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

  test("GET /js/api.js returns 404 (legacy script removed)", async ({ request }) => {
    const res = await request.get("/js/api.js");
    expect(res.status()).toBe(404);
  });
});
