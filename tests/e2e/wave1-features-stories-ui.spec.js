/**
 * WAVE 1 — Evidencia UI funcional (Features + Stories): crear/editar/eliminar, refetch, confirmación delete.
 * Requiere backend en FRONTEND_URL (mismo origen que la app) y credenciales válidas.
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

test.describe("Wave 1 Features/Stories UI", () => {
  test("feature create edit delete + story edit delete", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    const unique = Date.now();
    const projectName = `W1 UI ${unique}`;
    const pr = await request.post(`${BASE}/api/v1/projects`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { name: projectName, description: "d" },
    });
    expect(pr.ok()).toBeTruthy();
    const projectBody = await pr.json();
    const projectId = projectBody.data.id;

    const featTitle = `Feature ${unique}`;
    await page.goto(`${BASE}/projects/${projectId}/features`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("features-root")).toBeVisible({ timeout: 30000 });

    await page.getByTestId("feature-create-form").locator("input").first().fill(featTitle);
    await page.getByTestId("feature-create-form").locator("textarea").first().fill("Desc inicial");
    await page.getByTestId("feature-create-form").getByRole("button", { name: /Crear/i }).click();
    await expect(page.getByRole("button", { name: featTitle })).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: featTitle }).click();
    await expect(page.getByTestId("feature-detail-card")).toBeVisible({ timeout: 20000 });
    await page.getByTestId("feature-detail-card").locator("textarea").first().fill("Desc editada UI");
    await page.getByTestId("feature-detail-card").getByRole("button", { name: /Guardar cambios/i }).click();
    await expect(page.getByTestId("feature-detail-card")).toContainText("Desc editada UI", { timeout: 15000 });

    await page.getByRole("button", { name: /Eliminar feature/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^Eliminar$/ }).click();
    await expect(page.getByTestId("features-root")).toBeVisible({ timeout: 20000 });

    const fr = await request.post(`${BASE}/api/v1/projects/${projectId}/features`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { title: "F story", description: "fd" },
    });
    const featureId = (await fr.json()).data.id;
    const sr = await request.post(`${BASE}/api/v1/features/${featureId}/stories`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { title: "Story UI", description: "sd" },
    });
    const storyId = (await sr.json()).data.id;

    await page.goto(`${BASE}/projects/${projectId}/stories/${storyId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("story-detail-card")).toBeVisible({ timeout: 20000 });
    await page.getByTestId("story-detail-card").locator("textarea").first().fill("Story desc editada");
    await page.getByTestId("story-detail-card").getByRole("button", { name: /Guardar cambios/i }).click();
    await expect(page.getByTestId("story-detail-card")).toContainText("Story desc editada", { timeout: 15000 });

    await page.getByRole("button", { name: /Eliminar historia/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^Eliminar$/ }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/features/${featureId}`), { timeout: 20000 });
  });
});
