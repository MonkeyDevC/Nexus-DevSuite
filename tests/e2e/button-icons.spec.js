const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "buttons");
const BASE = "http://localhost:3000";
const LOGIN_BODY = { email: "admin_nexus@nexus.com", password: "Zaq1029*" };

function ensureDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sanitizeRouteName(route) {
  return route.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

test("validacion SPA de botones renderizados", async ({ page, request }) => {
  ensureDir();

  /** @type {{route:string,index:number,text:string,reason:string,screenshot:string}[]} */
  const failures = [];

  const routes = ["/dashboard", "/projects", "/admin"];

  const loginResp = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: LOGIN_BODY,
  });
  const loginBody = await loginResp.json();
  expect(loginBody?.success).toBe(true);
  await page.addInitScript(
    ([a, r]) => {
      sessionStorage.setItem("nexus_access_token", a);
      sessionStorage.setItem("nexus_refresh_token", r);
    },
    [loginBody.data.access_token, loginBody.data.refresh_token]
  );

  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await expect(page.getByTestId("app-sidebar")).toBeVisible({ timeout: 30000 });

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
          screenshot: screenshotPath
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

