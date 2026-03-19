const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "buttons");

function ensureDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sanitizeRouteName(route) {
  return route.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

test("validacion global de iconos en botones", async ({ page, baseURL }) => {
  ensureDir();

  /** @type {{route:string,index:number,text:string,reason:string,screenshot:string}[]} */
  const failures = [];

  const routes = [
    "#/change-requests",
    "#/projects",
    "#/work-orders",
    "#/deliveries",
    "#/releases"
  ];

  for (const hashRoute of routes) {
    await page.goto(`${baseURL}/${hashRoute}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
      try {
        if (window.nexusEnhanceButtons) window.nexusEnhanceButtons(document);
        if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
      } catch (_) {}
    });
    await page.waitForTimeout(400);

    const buttons = page.locator("button, a.btn");
    const count = await buttons.count();

    for (let i = 0; i < count; i += 1) {
      const btn = buttons.nth(i);
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) continue;

      const text = (await btn.innerText().catch(() => "")).trim() || "(sin texto)";
      const iconLocator = btn.locator("[data-lucide], svg");
      const iconCount = await iconLocator.count();
      const routeName = sanitizeRouteName(hashRoute);
      const screenshotPath = path.join(OUTPUT_DIR, `${routeName}-${i}.png`);

      if (iconCount === 0) {
        console.log(`[ICON-MISSING] ${hashRoute} | idx=${i} | text="${text}"`);
        await btn.screenshot({ path: screenshotPath }).catch(() => {});
        failures.push({
          route: hashRoute,
          index: i,
          text,
          reason: "sin icono en DOM",
          screenshot: screenshotPath
        });
        continue;
      }

      const firstIcon = iconLocator.first();
      const iconVisible = await firstIcon.isVisible().catch(() => false);
      if (!iconVisible) {
        console.log(`[ICON-HIDDEN] ${hashRoute} | idx=${i} | text="${text}"`);
        await btn.screenshot({ path: screenshotPath }).catch(() => {});
        failures.push({
          route: hashRoute,
          index: i,
          text,
          reason: "icono no visible",
          screenshot: screenshotPath
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
  }

  expect(failures, `Se encontraron ${failures.length} botones con problemas de iconos`).toEqual([]);
});

