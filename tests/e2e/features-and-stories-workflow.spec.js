/**
 * Features y stories: CRUD en UI con confirmaciones y refetch.
 */
const { test, expect } = require("@playwright/test");
const { getBaseUrl } = require("./support/constants.js");
const { loginByApi, seedSession } = require("./support/authSession.js");

const BASE = getBaseUrl();

test.describe("Features and stories: create, edit, delete with modal confirmations", () => {
  test("user manages feature and nested story lifecycle in backlog workspace", async ({ page, request }) => {
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

    await page.getByTestId("features-open-create").click();
    await expect(page.getByTestId("feature-create-modal")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("feature-create-form").locator("input").first().fill(featTitle);
    await page.getByTestId("feature-create-form").locator("textarea").first().fill("Desc inicial");
    await page.getByTestId("feature-create-form").getByRole("button", { name: /Crear/i }).click();
    const featureRowNameButton = page.getByTestId("feature-list-name-link").filter({ hasText: featTitle });
    await expect(featureRowNameButton).toBeVisible({ timeout: 20000 });

    await featureRowNameButton.click();
    await expect(page.getByTestId("feature-detail-card")).toBeVisible({ timeout: 20000 });
    await page.getByRole("tab", { name: /Edición/i }).click();
    await page.getByTestId("feature-detail-card").locator("textarea").first().fill("Desc editada UI");
    await page.getByTestId("project-workspace-save").click();
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
    await page.getByTestId("story-detail-card").getByRole("tab", { name: /Edición/i }).click();
    await page.getByTestId("story-detail-card").locator("textarea").first().fill("Story desc editada");
    await page.getByTestId("story-detail-card").getByTestId("project-workspace-save").click();
    await expect(page.getByTestId("story-detail-card")).toContainText("Story desc editada", { timeout: 15000 });

    await page.getByRole("button", { name: /Eliminar historia/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^Eliminar$/ }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/features/${featureId}`), { timeout: 20000 });
  });
});
