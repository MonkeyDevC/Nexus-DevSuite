/**
 * WAVE 4 — Releases: flujo React mínimo (listado, detalle, transiciones con CR vía API + UI verify).
 */
const { test, expect } = require("@playwright/test");

const BASE = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://127.0.0.1:3000";
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

async function createApprovedCR(request, token, releaseId) {
  const cr = await request.post(`${BASE}/api/v1/change-requests`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { title: "CR E2E W4", entity_type: "RELEASE", entity_id: releaseId },
  });
  expect(cr.ok()).toBeTruthy();
  const crId = (await cr.json()).data.id;
  for (const path of [`/submit`, `/approve`]) {
    const r = await request.patch(`${BASE}/api/v1/change-requests/${crId}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.ok()).toBeTruthy();
  }
  return crId;
}

test.describe("WAVE 4 — Releases E2E", () => {
  test("proyecto → release UI → assign story → start → publish; lista muestra release", async ({
    page,
    request,
  }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    const ts = Date.now();
    const projectName = `E2E W4 Releases ${ts}`;
    const pr = await request.post(`${BASE}/api/v1/projects`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { name: projectName, description: "e2e wave4" },
    });
    expect(pr.ok()).toBeTruthy();
    const projectId = (await pr.json()).data.id;

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

    const version = `e2e-w4-${ts}`;
    const relRes = await request.post(`${BASE}/api/v1/releases`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { name: `Rel E2E ${ts}`, version, description: "e2e" },
    });
    expect(relRes.ok()).toBeTruthy();
    const releaseId = (await relRes.json()).data.id;

    await page.goto(`${BASE}/projects/${projectId}/releases/${releaseId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("release-detail-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("release-detail-card")).toContainText(version);

    await page.getByTestId("release-detail-story-id").fill(storyId);
    await page.getByTestId("release-detail-assign-story").click();
    await expect(page.getByTestId("release-detail-card")).toContainText(`S ${ts}`, { timeout: 15000 });

    const crStart = await createApprovedCR(request, tokens.access_token, releaseId);
    await page.getByTestId("release-detail-cr-start").fill(crStart);
    await page.getByTestId("release-detail-start").click();
    await expect(page.getByTestId("release-detail-card")).toContainText("IN_PROGRESS", { timeout: 15000 });

    const crPub = await createApprovedCR(request, tokens.access_token, releaseId);
    await page.getByTestId("release-detail-cr-publish").fill(crPub);
    await page.getByTestId("release-detail-publish").click();
    await expect(page.getByTestId("release-detail-card")).toContainText("RELEASED", { timeout: 15000 });

    await page.goto(`${BASE}/projects/${projectId}/releases`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("releases-root")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(version.substring(0, 12), { timeout: 15000 });
  });
});
