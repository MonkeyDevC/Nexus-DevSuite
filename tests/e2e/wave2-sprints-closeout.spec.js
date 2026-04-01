/**
 * WAVE 2 — Micro-cierre UI: flujo sprint + story en React (HTTP core ya probado en integración).
 * Requisito: app en FRONTEND_URL (default http://localhost:3000) sirviendo el shell React con API.
 */
const { test, expect } = require("@playwright/test");

const BASE = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://localhost:3000";
const LOGIN_BODY = { email: process.env.E2E_EMAIL || "admin_nexus@nexus.com", password: process.env.E2E_PASSWORD || "Zaq1029*" };

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

test.describe("WAVE2 Sprints — E2E micro-closeout", () => {
  test("crear, editar, iniciar, asignar/quitar historia, cerrar; reflejo lista/detalle", async ({ page, request }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    const unique = Date.now();
    const projectName = `W2 Closeout ${unique}`;

    await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("app-sidebar")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("projects-table-wrapper")).toBeVisible({ timeout: 30000 });

    await page.getByTestId("projects-open-create").click();
    await expect(page.getByTestId("project-create-modal")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("project-create-name").fill(projectName);
    await page.getByTestId("project-create-description").fill("WAVE2 E2E");
    await page.getByTestId("project-create-submit").click();
    await expect(page.locator("body")).toContainText(projectName, { timeout: 30000 });

    await page.getByRole("button", { name: projectName }).first().click();
    await expect(page.locator("body")).toContainText(projectName, { timeout: 30000 });

    const idText = await page.locator("text=ID:").first().textContent();
    const idMatch = String(idText || "").match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
    );
    const projectId = idMatch ? idMatch[0] : "";
    expect(projectId.length).toBeGreaterThan(10);

    const featureRes = await request.post(`${BASE}/api/v1/projects/${projectId}/features`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { title: `Feat ${unique}`, description: "e2e" },
    });
    expect(featureRes.ok()).toBeTruthy();
    const featureBody = await featureRes.json();
    const featureId = featureBody.data.id;

    const storyRes = await request.post(`${BASE}/api/v1/features/${featureId}/stories`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { title: `Story E2E ${unique}`, description: "e2e" },
    });
    expect(storyRes.ok()).toBeTruthy();
    const storyBody = await storyRes.json();
    const storyId = storyBody.data.id;

    await request.patch(`${BASE}/api/v1/stories/${storyId}/status`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { status: "READY" },
    });

    await page.getByRole("link", { name: "Sprints" }).click();
    await expect(page.getByTestId("sprints-root")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("sprints-root").getByRole("button", { name: "Nuevo sprint" }).first().click();
    await expect(page.getByTestId("sprint-editor-root")).toBeVisible({ timeout: 15000 });

    const sprintName = `Sprint ${unique}`;
    await page.getByLabel("Nombre").fill(sprintName);
    await page.locator("#sprint-start").fill("2026-06-01");
    await page.locator("#sprint-end").fill("2026-06-30");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByTestId("sprint-detail-root")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("body")).toContainText(sprintName);

    await page.getByTestId("sprint-detail-nav-sprints").click();
    await expect(page.getByTestId("sprints-root")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Editar" }).click();
    const editedName = `${sprintName} Edited`;
    await page.getByLabel("Nombre").fill(editedName);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("sprint-detail-root")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("body")).toContainText(editedName);

    await page.getByTestId("sprint-detail-nav-sprints").click();
    await page.getByRole("button", { name: "Iniciar" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByTestId("sprints-table")).toContainText("ACTIVE", { timeout: 20000 });

    await page.getByRole("button", { name: editedName }).click();
    await expect(page.getByTestId("sprint-stories-table")).toBeVisible({ timeout: 15000 });

    await page.getByLabel("Historia a asignar").selectOption(storyId);
    await page.getByRole("button", { name: "Asignar al sprint" }).click();
    await expect(page.getByTestId("sprint-stories-table")).toContainText(`Story E2E ${unique}`, { timeout: 15000 });

    await page.getByRole("button", { name: "Quitar del sprint" }).click();
    await expect(page.getByTestId("sprint-stories-table").getByText(`Story E2E ${unique}`)).toHaveCount(0, {
      timeout: 15000,
    });

    await page.getByTestId("sprint-detail-nav-sprints").click();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByTestId("sprints-table")).toContainText("COMPLETED", { timeout: 20000 });

    await page.getByRole("button", { name: editedName }).click();
    await expect(page.locator("body")).toContainText("CLOSED", { timeout: 15000 });
  });
});
