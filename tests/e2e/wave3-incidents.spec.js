/**
 * WAVE 3 — Incidents: flujo mínimo React + API (MASTER).
 */
const { test, expect } = require("@playwright/test");

const BASE = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://localhost:3000";
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
    [accessToken, refreshToken]
  );
}

test.describe("WAVE 3 — Incidents E2E", () => {
  test("crear → transiciones → cerrar con RCA → lista filtrada", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    const ts = Date.now();
    const projectName = `E2E Incidents ${ts}`;
    const pr = await request.post(`${BASE}/api/v1/projects`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { name: projectName, description: "e2e wave3" },
    });
    expect(pr.ok()).toBeTruthy();
    const projectBody = await pr.json();
    const projectId = projectBody.data.id;

    const fr = await request.post(`${BASE}/api/v1/projects/${projectId}/features`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { title: `F ${ts}`, description: "f" },
    });
    expect(fr.ok()).toBeTruthy();
    const featureId = (await fr.json()).data.id;

    const sr = await request.post(`${BASE}/api/v1/features/${featureId}/stories`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { title: `S ${ts}`, description: "s" },
    });
    expect(sr.ok()).toBeTruthy();
    const storyId = (await sr.json()).data.id;

    const incTitle = `Incident E2E ${ts}`;

    await page.goto(`${BASE}/projects/${projectId}/incidents`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("incidents-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(projectName, { timeout: 30000 });

    await page.getByTestId("incidents-new").click();
    await expect(page.getByTestId("incident-editor-root")).toBeVisible({ timeout: 15000 });

    await page.locator("#incident-title").fill(incTitle);
    await page.locator("#incident-desc").fill("Descripción E2E");
    await page.locator("#incident-severity").selectOption("HIGH");
    await page.locator("#incident-priority").selectOption("HIGH");
    await page.locator("#incident-story").selectOption(storyId);

    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByTestId("incident-detail-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(incTitle);
    await expect(page.getByTestId("incident-detail-card")).toContainText(storyId);

    await page.getByTestId("incident-detail-edit").click();
    await expect(page.getByTestId("incident-editor-root")).toBeVisible({ timeout: 15000 });
    const incTitleEdited = `${incTitle} edited`;
    await page.locator("#incident-title").fill(incTitleEdited);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("incident-detail-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(incTitleEdited);

    await page.getByTestId("incident-detail-start").click();
    await expect(page.getByTestId("incident-detail-card")).toContainText("IN_PROGRESS", { timeout: 15000 });

    await page.getByTestId("incident-detail-resolve").click();
    await expect(page.getByTestId("incident-detail-card")).toContainText("RESOLVED", { timeout: 15000 });

    await page.getByTestId("incident-detail-close").click();
    await expect(page.getByTestId("incident-close-root-cause")).toBeVisible();
    await page.getByTestId("incident-close-root-cause").fill("Causa raíz E2E obligatoria ISO");
    await page.getByTestId("incident-close-confirm").click();
    await expect(page.getByTestId("incident-detail-card")).toContainText("CLOSED", { timeout: 20000 });

    await page.getByTestId("incident-detail-nav-incidents").click();
    await expect(page.getByTestId("incidents-root")).toBeVisible();

    await page.getByTestId("incidents-status-filter").selectOption("CLOSED");
    await expect(page.locator("body")).toContainText(incTitleEdited, { timeout: 15000 });
  });
});
