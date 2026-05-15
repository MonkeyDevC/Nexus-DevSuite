const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "buttons");
const BASE = getBaseUrl();

function ensureDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sanitizeRouteName(route) {
  return route.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

/**
 * Auditoría no bloqueante: iconos en botones visibles en rutas protegidas clave.
 */
test.describe("UI audit: button icons on dashboard, projects, and admin", () => {
  test("each protected route renders shell and buttons with icon or visible label", async ({ page, request }) => {
    ensureDir();

    /** @type {{route:string,index:number,text:string,reason:string,screenshot:string}[]} */
    const failures = [];

    const routes = ["/dashboard", "/projects", "/admin"];

    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    for (const route of routes) {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("app-sidebar")).toBeVisible({ timeout: 30000 });

      if (route === "/dashboard") {
        await expect(page.getByTestId("dashboard-root")).toBeVisible({ timeout: 30000 });
      } else if (route === "/projects") {
        await expect(page.getByTestId("projects-table-wrapper")).toBeVisible({ timeout: 30000 });
      } else if (route === "/admin") {
        await expect(page.getByTestId("admin-root")).toBeVisible({ timeout: 30000 });
      }

      const buttons = page.locator("button, a.btn");
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const btn = buttons.nth(i);
        const visible = await btn.isVisible().catch(() => false);
        if (!visible) continue;

        const text = (await btn.innerText().catch(() => "")).trim() || "(sin texto)";
        const iconLocator = btn.locator("[data-lucide], svg");
        const iconCount = await iconLocator.count();
        const routeName = sanitizeRouteName(route);
        const screenshotPath = path.join(OUTPUT_DIR, `${routeName}-${i}.png`);

        if (iconCount === 0 && text === "(sin texto)") {
          console.log(`[ICON-MISSING] ${route} | idx=${i} | text="${text}"`);
          await btn.screenshot({ path: screenshotPath }).catch(() => {});
          failures.push({
            route,
            index: i,
            text,
            reason: "sin icono en DOM",
            screenshot: screenshotPath,
          });
          continue;
        }

        const firstIcon = iconLocator.first();
        const iconVisible = await firstIcon.isVisible().catch(() => false);
        if (!iconVisible && text === "(sin texto)") {
          console.log(`[ICON-HIDDEN] ${route} | idx=${i} | text="${text}"`);
          await btn.screenshot({ path: screenshotPath }).catch(() => {});
          failures.push({
            route,
            index: i,
            text,
            reason: "icono no visible",
            screenshot: screenshotPath,
          });
        }
      }
    }

    if (failures.length) {
      console.log("\n=== REPORTE ICONOS BOTONES ===");
      failures.forEach((f) => {
        console.log(
          `- route=${f.route} idx=${f.index} text="${f.text}" reason="${f.reason}" screenshot="${f.screenshot}"`
        );
      });
      console.log(`\n[NON_BLOCKING_AUDIT] Se detectaron ${failures.length} botones con iconos invisibles/faltantes.`);
    }
  });
});
