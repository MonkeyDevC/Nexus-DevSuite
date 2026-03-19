const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "buttons-visibility");
const ROUTES = ["#/change-requests", "#/projects", "#/work-orders", "#/deliveries", "#/releases"];

function ensureDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sanitizeRoute(route) {
  return route.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

test("auditoria visual de visibilidad y clickabilidad de botones", async ({ page, baseURL }) => {
  test.setTimeout(180000);
  ensureDir();
  page.setDefaultTimeout(5000);

  /** @type {{route:string,index:number,text:string,reason:string,screenshot?:string,error?:string}[]} */
  const failures = [];
  /** @type {{route:string,total:number,visible:number}[]} */
  const stats = [];

  for (const route of ROUTES) {
    const routeUrl = `${baseURL}/${route}`;
    const navError = await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 12000 }).then(() => null).catch((e) => e);
    if (navError) {
      failures.push({
        route,
        index: -1,
        text: "(ruta)",
        reason: "no se pudo cargar ruta",
        error: String(navError.message || navError)
      });
      continue;
    }
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      try {
        if (window.nexusEnhanceButtons) window.nexusEnhanceButtons(document);
        if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
      } catch (_) {}
    });
    await page.waitForTimeout(200);

    const buttons = page.locator("button, a.btn");
    const count = await buttons.count();
    const maxPerRoute = Math.min(count, 80);
    let visibleCount = 0;
    let clickTrials = 0;

    for (let i = 0; i < maxPerRoute; i += 1) {
      const btn = buttons.nth(i);
      const text = ((await btn.innerText().catch(() => "")) || "").trim() || "(sin texto)";
      const routeName = sanitizeRoute(route);

      const audit = await btn.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const hiddenContainer = el.closest(
          ".dropdown-menu:not(.show), .collapse:not(.show), [hidden], [aria-hidden='true'], .d-none, .visually-hidden"
        );
        let hiddenByAncestor = false;
        let parent = el.parentElement;
        while (parent) {
          const ps = window.getComputedStyle(parent);
          if (ps.display === "none" || ps.visibility === "hidden" || Number(ps.opacity || "1") === 0) {
            hiddenByAncestor = true;
            break;
          }
          parent = parent.parentElement;
        }
        const intentionalHidden = !!hiddenContainer || hiddenByAncestor;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const inViewport = rect.width > 0 && rect.height > 0
          && rect.bottom >= 0 && rect.right >= 0
          && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
        const covered = inViewport ? (function () {
          const topEl = document.elementFromPoint(Math.max(0, cx), Math.max(0, cy));
          if (!topEl) return true;
          return !(topEl === el || el.contains(topEl) || topEl.contains(el));
        })() : false;
        const iconEl = el.querySelector("[data-lucide], svg");
        const iconStyle = iconEl ? window.getComputedStyle(iconEl) : null;
        const iconVisible = !!iconEl && !!iconStyle
          && iconStyle.display !== "none"
          && iconStyle.visibility !== "hidden"
          && Number(iconStyle.opacity || "1") > 0;
        const textVisible = (el.textContent || "").trim().length > 0;
        const color = style.color;
        const bg = style.backgroundColor;
        const lowContrastLikely = !!color && !!bg && color === bg;
        return {
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity || "1"),
          width: rect.width,
          height: rect.height,
          inViewport,
          covered,
          hasIcon: !!iconEl,
          iconVisible,
          textVisible,
          lowContrastLikely,
          intentionalHidden
        };
      }).catch(() => null);

      if (!audit) {
        failures.push({ route, index: i, text, reason: "no se pudo auditar el botón (detached)" });
        continue;
      }

      if (audit.intentionalHidden) continue;

      const reasons = [];
      if (audit.display === "none") reasons.push("display:none");
      if (audit.visibility === "hidden") reasons.push("visibility:hidden");
      if (!(audit.opacity > 0)) reasons.push("opacity<=0");
      if (!(audit.width > 0 && audit.height > 0)) reasons.push("size<=0");
      if (!audit.inViewport) reasons.push("fuera de viewport");
      if (audit.covered) reasons.push("cubierto por otro elemento");
      if (!audit.hasIcon && !audit.textVisible) reasons.push("sin icono y sin texto visible");
      if (audit.hasIcon && !audit.iconVisible && !audit.textVisible) reasons.push("icono invisible y sin texto");
      if (audit.lowContrastLikely) reasons.push("color similar al fondo");

      if (reasons.length === 0) visibleCount += 1;

      if (reasons.length > 0) {
        const screenshotPath = path.join(OUTPUT_DIR, `${routeName}-${i}.png`);
        await btn.screenshot({ path: screenshotPath }).catch(() => {});
        failures.push({
          route,
          index: i,
          text,
          reason: reasons.join(", "),
          screenshot: screenshotPath
        });
      } else {
        const disabled = await btn.isDisabled().catch(() => false);
        if (disabled) continue;
        // Verifica interactividad real sin disparar acciones (trial click).
        if (clickTrials >= 5) continue;
        const trial = await btn.click({ trial: true, timeout: 200 }).then(() => null).catch((e) => e);
        clickTrials += 1;
        if (trial) {
          const screenshotPath = path.join(OUTPUT_DIR, `${routeName}-${i}-click.png`);
          await btn.screenshot({ path: screenshotPath }).catch(() => {});
          failures.push({
            route,
            index: i,
            text,
            reason: "no clickeable (trial click falló)",
            screenshot: screenshotPath,
            error: String(trial.message || trial)
          });
        }
      }
    }

    stats.push({ route, total: count, visible: visibleCount });
  }

  console.log("\n=== QA BUTTON VISIBILITY STATS ===");
  stats.forEach((s) => console.log(`route=${s.route} total=${s.total} ok=${s.visible}`));
  if (failures.length) {
    console.log("\n=== QA BUTTON VISIBILITY FAILURES ===");
    failures.forEach((f) => {
      console.log(
        `route=${f.route} idx=${f.index} text="${f.text}" reason="${f.reason}" screenshot="${f.screenshot || "-"}"`
      );
    });
  }

  expect(failures, `Se detectaron ${failures.length} botones invisibles/defectuosos`).toEqual([]);
});

