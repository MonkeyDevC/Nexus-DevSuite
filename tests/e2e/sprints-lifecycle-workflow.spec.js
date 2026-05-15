/**
 * Sprints: crear, editar, iniciar, asignar/quitar historia y cerrar con reflejo en lista y detalle.
 * Requiere FRONTEND_URL (default http://127.0.0.1:3000) con shell React y API en el mismo origen.
 */
const { test, expect } = require("@playwright/test");
const { getBaseUrl, getMasterLoginCredentials } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const BASE = getBaseUrl();

test.describe("Sprints: full lifecycle with story assignment in project context", () => {
  test("user creates sprint, edits, starts, assigns and removes story, closes; list and detail stay consistent", async ({
    page,
    request,
  }) => {
    const tokens = await loginByApi(request, getMasterLoginCredentials());
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

    // No depender del copy/markup del UI para extraer ID.
    const listRes = await request.get(`${BASE}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const listBody = await listRes.json();
    const created = (listBody?.data?.items || []).find((row) => String(row.name) === projectName);
    const projectId = created?.id ? String(created.id) : "";
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

    const refinementReadyRes = await request.patch(`${BASE}/api/v1/stories/${storyId}`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { refinement_status: "READY" },
    });
    expect(refinementReadyRes.ok()).toBeTruthy();

    await page.getByRole("link", { name: "Sprint Backlog" }).click();
    await expect(page.getByTestId("sprints-root")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("sprints-root").getByRole("button", { name: "Nuevo sprint" }).first().click();
    const sprintCreateOverlay = page.getByTestId("sprint-create-overlay");
    await expect(sprintCreateOverlay).toBeVisible({ timeout: 15000 });

    const sprintName = `Sprint ${unique}`;
    await sprintCreateOverlay.getByTestId("sprint-create-name").fill(sprintName);

    let juneVisible = false;
    for (let i = 0; i < 16; i += 1) {
      if (await sprintCreateOverlay.getByText(/junio.*2026/i).first().isVisible().catch(() => false)) {
        juneVisible = true;
        break;
      }
      await sprintCreateOverlay.getByRole("button", { name: "→" }).click();
    }
    if (!juneVisible) {
      for (let i = 0; i < 24; i += 1) {
        if (await sprintCreateOverlay.getByText(/junio.*2026/i).first().isVisible().catch(() => false)) {
          juneVisible = true;
          break;
        }
        await sprintCreateOverlay.getByRole("button", { name: "←" }).click();
      }
    }
    await expect(sprintCreateOverlay.getByText(/junio.*2026/i).first()).toBeVisible({ timeout: 5000 });

    await sprintCreateOverlay.locator('[data-day-iso="2026-06-01"]').click();
    await sprintCreateOverlay.locator('[data-day-iso="2026-06-30"]').click();
    await sprintCreateOverlay.getByTestId("sprint-create-submit").click();

    await expect(page.getByTestId("sprint-detail-root")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("body")).toContainText(sprintName);

    await page.getByTestId("sprint-detail-nav-sprints").click();
    await expect(page.getByTestId("sprints-root")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("sprints-table").getByRole("button", { name: "Editar sprint" }).click();
    const editedName = `${sprintName} Edited`;
    await page.getByLabel("Nombre").fill(editedName);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("sprint-detail-root")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("body")).toContainText(editedName);

    await page.getByTestId("sprint-detail-nav-sprints").click();
    await page.getByTestId("sprints-table").getByRole("button", { name: "Activar sprint" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByTestId("sprints-table")).toContainText("IN_PROGRESS", { timeout: 20000 });

    await page.getByTestId("sprints-table").getByRole("button", { name: `Ver sprint ${editedName}` }).click();
    await expect(page.getByTestId("sprint-stories-table")).toBeVisible({ timeout: 15000 });

    await page.getByLabel("Historia a asignar").selectOption(storyId);
    await page.getByRole("button", { name: "Asignar al sprint" }).click();
    await expect(page.getByTestId("sprint-stories-table")).toContainText(`Story E2E ${unique}`, { timeout: 15000 });

    await page.getByRole("button", { name: "Quitar del sprint" }).click();
    await expect(page.getByTestId("sprint-stories-table").getByText(`Story E2E ${unique}`)).toHaveCount(0, {
      timeout: 15000,
    });

    await page.getByTestId("sprint-detail-nav-sprints").click();
    await page.getByTestId("sprints-table").getByRole("button", { name: "Cerrar" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByTestId("sprints-table")).toContainText("COMPLETED", { timeout: 20000 });

    await page.getByTestId("sprints-table").getByRole("button", { name: `Ver sprint ${editedName}` }).click();
    await expect(page.locator("body")).toContainText("CLOSED", { timeout: 15000 });
  });
});
