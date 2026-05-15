const { test, expect } = require("@playwright/test");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const BASE = getBaseUrl();

async function openProjectCreateModal(page) {
  await page.getByTestId("projects-open-create").click();
  await expect(page.getByTestId("project-create-modal")).toBeVisible({ timeout: 15000 });
}

test.describe("Projects: list, detail workspace, versioning and archive", () => {
  test("authenticated user creates project, edits in workspace, conflict on stale version, archives and deletes", async ({
    page,
    request,
  }) => {
    const tokens = await loginByApi(request);
    await seedSession(page, tokens.access_token, tokens.refresh_token);

    const unique = Date.now();
    const projectName = `E2E Project ${unique}`;
    const projectNameUpdated = `${projectName} Updated`;

    await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("app-sidebar")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText("Projects - Nexus DevSuite", { timeout: 30000 });
    await expect(page.getByTestId("projects-table-wrapper")).toBeVisible({ timeout: 30000 });

    await openProjectCreateModal(page);
    await page.getByTestId("project-create-name").fill(projectName);
    await page.getByTestId("project-create-description").fill("Proyecto E2E dominio");
    await page.getByTestId("project-create-submit").click();

    await expect(page.locator("body")).toContainText(projectName, { timeout: 30000 });
    await page.getByRole("button", { name: projectName }).first().click();

    await expect(page.getByTestId("app-sidebar")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(projectName);

    // La edición vive en la pestaña "Edición" y se guarda desde el footer sticky ("Guardar").
    await page.getByRole("tab", { name: "Edición" }).click();
    await expect(page.getByTestId("project-edit-name")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("project-edit-name").fill(projectNameUpdated);
    await page.getByTestId("project-workspace-save").click();
    await expect(page.locator("body")).toContainText(projectNameUpdated, { timeout: 30000 });

    // No depender del copy/markup del UI para extraer ID.
    const listResAfterUi = await request.get(`${BASE}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const listBodyAfterUi = await listResAfterUi.json();
    const created = (listBodyAfterUi?.data?.items || []).find((row) => String(row.name) === projectNameUpdated);
    const projectId = created?.id ? String(created.id) : "";
    expect(projectId.length).toBeGreaterThan(0);

    const listRes = await request.get(`${BASE}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const listBody = await listRes.json();
    const found = (listBody?.data?.items || []).find((row) => String(row.id) === projectId);
    expect(found).toBeTruthy();

    const staleUpdate = await request.put(`${BASE}/api/v1/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: {
        name: `${projectNameUpdated} stale`,
        description: "stale",
        expected_version: 1,
      },
    });
    const staleBody = await staleUpdate.json();
    expect(staleBody?.success).toBe(false);
    expect(staleBody?.error?.code).toBe("PROJECT_CONFLICT");

    await page.getByTestId("project-archive-btn").click();
    await page
      .getByRole("alertdialog", { name: "Archivar proyecto" })
      .getByRole("button", { name: "Archivar" })
      .click();
    await expect(page.locator("body")).toContainText("ARCHIVED", { timeout: 30000 });

    // En ARCHIVED el formulario queda bloqueado (no se permite editar tras archivar).
    await expect(page.getByTestId("project-edit-status")).toHaveValue("ARCHIVED", { timeout: 30000 });
    await expect(page.getByTestId("project-edit-name")).toBeDisabled();
    await expect(page.getByTestId("project-workspace-save")).toBeDisabled();

    const detailRes = await request.get(`${BASE}/api/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const detailBody = await detailRes.json();
    const currentVersion = Number(detailBody?.data?.version);
    expect(Number.isInteger(currentVersion)).toBe(true);
    const deleteRes = await request.delete(`${BASE}/api/v1/projects/${projectId}`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
      data: { expected_version: currentVersion },
    });
    const deleteBody = await deleteRes.json();
    expect(deleteBody?.success).toBe(true);

    const afterDelete = await request.get(`${BASE}/api/v1/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const afterDeleteBody = await afterDelete.json();
    expect(afterDeleteBody?.success).toBe(false);
    expect(afterDeleteBody?.error?.code).toBe("PROJECT_NOT_FOUND");

    await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText("Projects - Nexus DevSuite", { timeout: 30000 });
    await openProjectCreateModal(page);
    await page.getByTestId("project-create-name").fill(projectName);
    await page.getByTestId("project-create-submit").click();
    await expect(page.locator("body")).toContainText(projectName, { timeout: 30000 });
    await openProjectCreateModal(page);
    await page.getByTestId("project-create-name").fill(`  ${projectName}  `);
    await page.getByTestId("project-create-submit").click();
    await expect(page.locator("body")).toContainText("Ya existe un proyecto con ese nombre", { timeout: 30000 });
  });
});
