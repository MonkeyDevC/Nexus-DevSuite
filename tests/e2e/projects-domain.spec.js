const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:3000";
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

async function openProjectCreateModal(page) {
  await page.getByTestId("projects-open-create").click();
  await expect(page.getByTestId("project-create-modal")).toBeVisible({ timeout: 15000 });
}

test.describe("Project domain W1-T01", () => {
  test("CRUD + archive/delete + validaciones contractuales", async ({ page, request }) => {
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

    await page.getByTestId("project-edit-name").fill(projectNameUpdated);
    await page.getByTestId("project-edit-submit").click();
    await expect(page.locator("body")).toContainText(projectNameUpdated, { timeout: 30000 });

    const idText = await page.locator("text=ID:").first().textContent();
    const idMatch = String(idText || "").match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
    );
    const projectId = idMatch ? idMatch[0] : "";
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
    await expect(page.locator("body")).toContainText("ARCHIVED", { timeout: 30000 });

    await page.getByTestId("project-edit-name").fill(`${projectNameUpdated} archived`);
    await page.getByTestId("project-edit-submit").click();
    await expect(page.locator("body")).toContainText("Proyecto archivado", { timeout: 30000 });

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
