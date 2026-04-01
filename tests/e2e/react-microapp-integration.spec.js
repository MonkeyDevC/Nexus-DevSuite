const { test, expect } = require("@playwright/test");

const BASE = "http://localhost:3000";
const LOGIN_BODY = { email: "admin_nexus@nexus.com", password: "Zaq1029*" };
const FAKE_UUID_STORY = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const FAKE_UUID_FEATURE = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const FAKE_UUID_SPRINT = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const FAKE_UUID_INCIDENT = "3fa85f64-5717-4562-b3fc-2c963f66afa9";
const FAKE_UUID_RELEASE = "3fa85f64-5717-4562-b3fc-2c963f66afba";

/** Historia real (si existe en API) y segundo proyecto para mismatch. */
async function findStoryContext(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const pr = await request.get(`${BASE}/api/v1/projects`, { headers });
  const pb = await pr.json();
  const projects = pb?.data?.items || [];
  if (projects.length === 0) return null;
  const secondId = projects[1] ? String(projects[1].id) : null;
  for (const proj of projects) {
    const fr = await request.get(`${BASE}/api/v1/projects/${proj.id}/features`, { headers });
    const fb = await fr.json();
    const feats = fb?.data?.items || [];
    for (const f of feats) {
      const sr = await request.get(`${BASE}/api/v1/features/${f.id}/stories`, { headers });
      const sb = await sr.json();
      const stories = sb?.data?.items || [];
      if (stories.length > 0) {
        return {
          projectId: String(proj.id),
          storyId: String(stories[0].id),
          secondProjectId: secondId && secondId !== String(proj.id) ? secondId : null,
        };
      }
    }
  }
  return null;
}

/** Feature real (si existe). */
async function findFeatureContext(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const pr = await request.get(`${BASE}/api/v1/projects`, { headers });
  const pb = await pr.json();
  const projects = pb?.data?.items || [];
  if (projects.length === 0) return null;
  const secondId = projects[1] ? String(projects[1].id) : null;
  for (const proj of projects) {
    const fr = await request.get(`${BASE}/api/v1/projects/${proj.id}/features`, { headers });
    const fb = await fr.json();
    const feats = fb?.data?.items || [];
    if (feats.length > 0) {
      return {
        projectId: String(proj.id),
        featureId: String(feats[0].id),
        secondProjectId: secondId && secondId !== String(proj.id) ? secondId : null,
      };
    }
  }
  return null;
}

/** Sprint real (si existe) y segundo proyecto para mismatch. */
async function findSprintContext(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const pr = await request.get(`${BASE}/api/v1/projects`, { headers });
  const pb = await pr.json();
  const projects = pb?.data?.items || [];
  if (projects.length === 0) return null;
  const secondId = projects[1] ? String(projects[1].id) : null;
  for (const proj of projects) {
    const sr = await request.get(
      `${BASE}/api/v1/projects/${proj.id}/sprints?page=1&limit=50`,
      { headers }
    );
    const sb = await sr.json();
    const items = sb?.data?.data || sb?.data?.items || [];
    const list = Array.isArray(items) ? items : [];
    if (list.length > 0) {
      return {
        projectId: String(proj.id),
        sprintId: String(list[0].id),
        secondProjectId: secondId && secondId !== String(proj.id) ? secondId : null,
      };
    }
  }
  return null;
}

/** Incidente real (si existe) y segundo proyecto para mismatch. */
async function findIncidentContext(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const pr = await request.get(`${BASE}/api/v1/projects`, { headers });
  const pb = await pr.json();
  const projects = pb?.data?.items || [];
  if (projects.length === 0) return null;
  const secondId = projects[1] ? String(projects[1].id) : null;
  for (const proj of projects) {
    const ir = await request.get(
      `${BASE}/api/v1/projects/${proj.id}/incidents?page=1&limit=50`,
      { headers }
    );
    const ib = await ir.json();
    const items = ib?.data?.data || ib?.data?.items || [];
    const list = Array.isArray(items) ? items : [];
    if (list.length > 0) {
      return {
        projectId: String(proj.id),
        incidentId: String(list[0].id),
        secondProjectId: secondId && secondId !== String(proj.id) ? secondId : null,
      };
    }
  }
  return null;
}

/**
 * Release vinculada al primer proyecto via features (GET /releases + detalle). Requiere rol MASTER en API.
 */
async function findReleaseContext(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const pr = await request.get(`${BASE}/api/v1/projects`, { headers });
  const pb = await pr.json();
  const projects = pb?.data?.items || [];
  if (projects.length === 0) return null;
  const primaryPid = String(projects[0].id);
  const secondId = projects[1] ? String(projects[1].id) : null;
  let pageNum = 1;
  const maxPages = 15;
  while (pageNum <= maxPages) {
    const lr = await request.get(`${BASE}/api/v1/releases?page=${pageNum}&limit=50`, { headers });
    const lb = await lr.json();
    if (!lb?.success) return null;
    const items = lb.data?.items || [];
    const totalPages = Math.max(1, Number(lb.data?.totalPages) || 1);
    for (const rel of items) {
      if (!rel?.id) continue;
      const dr = await request.get(`${BASE}/api/v1/releases/${rel.id}`, { headers });
      const db = await dr.json();
      if (!db?.success || !db.data) continue;
      const feats = db.data.features || [];
      const match = feats.some((f) => f && String(f.project_id) === primaryPid);
      if (match) {
        return {
          projectId: primaryPid,
          releaseId: String(rel.id),
          secondProjectId: secondId && secondId !== primaryPid ? secondId : null,
        };
      }
    }
    if (pageNum >= totalPages || items.length === 0) break;
    pageNum += 1;
  }
  return null;
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

const E2E_EMPLOYEE_EMAIL = "react_e2e_employee@nexus.test";
const E2E_EMPLOYEE_PASSWORD = "EmployeeE2e123!";

async function getEmployeeRoleId(request, masterToken) {
  const headers = { Authorization: `Bearer ${masterToken}` };
  const r = await request.get(`${BASE}/api/v1/auth/roles`, { headers });
  if (!r.ok()) return null;
  const b = await r.json();
  const roles = Array.isArray(b?.data) ? b.data : [];
  const emp = roles.find((x) => x && x.name === "EMPLOYEE");
  return emp?.id ? String(emp.id) : null;
}

/** Tokens de usuario EMPLOYEE para E2E (crea usuario si no existe). */
async function ensureEmployeeTokens(request, masterToken) {
  const tryLogin = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: E2E_EMPLOYEE_EMAIL, password: E2E_EMPLOYEE_PASSWORD },
  });
  const tl = await tryLogin.json();
  if (tl?.success && tl.data?.access_token && tl.data?.refresh_token) return tl.data;

  const roleId = await getEmployeeRoleId(request, masterToken);
  if (!roleId) {
    throw new Error("E2E Admin: no se obtuvo role_id EMPLOYEE (GET /auth/roles)");
  }
  const cr = await request.post(`${BASE}/api/v1/users`, {
    headers: {
      Authorization: `Bearer ${masterToken}`,
      "Content-Type": "application/json",
    },
    data: {
      email: E2E_EMPLOYEE_EMAIL,
      password: E2E_EMPLOYEE_PASSWORD,
      role_id: roleId,
    },
  });
  const cb = await cr.json();
  if (!cr.ok()) {
    throw new Error(`E2E Admin: POST /users EMPLOYEE ${cr.status()} ${JSON.stringify(cb)}`);
  }
  const login2 = await request.post(`${BASE}/api/v1/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: E2E_EMPLOYEE_EMAIL, password: E2E_EMPLOYEE_PASSWORD },
  });
  const l2 = await login2.json();
  if (!l2?.success || !l2.data?.access_token) {
    throw new Error(`E2E Admin: login EMPLOYEE fallo ${JSON.stringify(l2)}`);
  }
  return l2.data;
}

async function requireFirstProject(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const pr = await request.get(`${BASE}/api/v1/projects`, { headers });
  expect(pr.ok()).toBeTruthy();
  const pb = await pr.json();
  const items = pb?.data?.items || [];
  expect(items.length).toBeGreaterThan(0);
  return { primaryId: String(items[0].id), items };
}

test.describe("Integracion micro-app React BrowserRouter", () => {
  test("React monta una sola vez y navega con rutas reales", async ({ browser, page }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const loginResp = await page.request.post(`${BASE}/api/v1/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: LOGIN_BODY,
    });
    const loginBody = await loginResp.json();
    expect(loginBody?.success).toBe(true);
    const accessToken = loginBody?.data?.access_token;
    const refreshToken = loginBody?.data?.refresh_token;
    expect(typeof accessToken).toBe("string");
    expect(typeof refreshToken).toBe("string");

    await seedSession(page, accessToken, refreshToken);

    await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });

    const content = page.locator("body");
    const reactRoot = page.getByTestId("app-sidebar");
    const sidebar = page.getByTestId("app-sidebar");

    await expect(reactRoot).toBeVisible({ timeout: 30000 });
    await expect(reactRoot).toHaveCount(1);
    await expect(content).toContainText("Projects - Nexus DevSuite", { timeout: 30000 });

    const firstProjectLink = page.getByTestId("projects-table-wrapper").getByTestId("project-list-name-link").first();
    await firstProjectLink.scrollIntoViewIfNeeded();
    await firstProjectLink.click();
    await expect(reactRoot).toHaveCount(1);
    await expect(page.getByTestId("project-detail-root")).toBeVisible({ timeout: 30000 });
    await expect(content.getByRole("button", { name: "Ver Features" })).toBeVisible({ timeout: 30000 });

    await content.getByRole("button", { name: "Ver Backlog" }).click();

    await expect(reactRoot).toHaveCount(1);
    await expect(page.getByTestId("backlog-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { level: 1, name: "Backlog" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("backlog-loading")).toHaveCount(0, { timeout: 60000 });

    await expect(page.getByTestId("breadcrumb-backlog")).toContainText("Backlog");
    const backlogTable = page.getByTestId("backlog-table");
    await expect(backlogTable).toBeVisible();
    const backlogRowButtons = backlogTable.locator("tbody tr button");
    const hasRows = await backlogRowButtons.count();
    if (hasRows > 0) {
      await expect(backlogTable.getByRole("columnheader", { name: "Historia" })).toBeVisible();
      await expect(backlogTable.locator("tbody tr").first()).toBeVisible();
    } else {
      await expect(backlogTable).toContainText("Sin historias en backlog");
    }

    await page.getByTestId("backlog-root").getByRole("button", { name: "Lista proyectos" }).click();
    await expect(reactRoot).toHaveCount(1);
    await expect(content).toContainText("Projects - Nexus DevSuite", { timeout: 30000 });

    await sidebar.getByRole("link", { name: "Dashboard" }).click();
    await expect(reactRoot).toHaveCount(1);
    await expect(content).toContainText("Dashboard - Nexus DevSuite", { timeout: 30000 });
    await sidebar.getByRole("link", { name: "Projects" }).click();
    await expect(reactRoot).toHaveCount(1);
    await expect(content).toContainText("Projects - Nexus DevSuite", { timeout: 30000 });

    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(reactRoot).toBeVisible({ timeout: 30000 });
    await expect(reactRoot).toHaveCount(1);
    await expect(content).toContainText("Dashboard - Nexus DevSuite", { timeout: 30000 });

    const reloginResp = await page.request.post(`${BASE}/api/v1/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: LOGIN_BODY,
    });
    const reloginBody = await reloginResp.json();
    expect(reloginBody?.success).toBe(true);

    // Nuevo contexto: el addInitScript del seedSession inicial se ejecuta en cada carga y
    // sobrescribiria tokens del relogin si reutilizamos la misma pagina.
    const reloginErrors = [];
    const reloginContext = await browser.newContext();
    const reloginPage = await reloginContext.newPage();
    reloginPage.on("pageerror", (err) => reloginErrors.push(err.message));
    await reloginPage.addInitScript(
      ([a, r]) => {
        sessionStorage.setItem("nexus_access_token", a);
        sessionStorage.setItem("nexus_refresh_token", r);
      },
      [reloginBody.data.access_token, reloginBody.data.refresh_token]
    );
    const reloginRoot = reloginPage.getByTestId("app-sidebar");
    await reloginPage.goto(`${BASE}/dashboard`, { waitUntil: "load" });
    await expect(reloginPage).toHaveURL(/\/dashboard$/, { timeout: 30000 });
    await expect(reloginRoot).toBeVisible({ timeout: 90000 });
    await expect(reloginRoot).toHaveCount(1);
    await expect(reloginPage.locator("body")).toContainText("Dashboard - Nexus DevSuite", { timeout: 60000 });
    await expect(reloginPage.getByTestId("app-user-menu-trigger")).toBeVisible({ timeout: 60000 });
    await reloginPage.getByTestId("app-user-menu-trigger").click();
    await expect(reloginPage.getByTestId("app-user-menu-logout")).toBeVisible();
    expect(reloginErrors, reloginErrors.join("\n")).toEqual([]);
    await reloginContext.close();

    if (pageErrors.length > 0) {
      await testInfo.attach("pageerrors.txt", {
        body: pageErrors.join("\n"),
        contentType: "text/plain",
      });
    }
    expect(pageErrors, `Errores no capturados en página:\n${pageErrors.join("\n")}`).toEqual([]);
  });
});

test.describe("Work management React — estable (sin skip)", () => {
  test("backlog, features, stories, sprints, incidents, releases, vacios, negativos, deep links e ida/vuelta", async ({
    page,
    request,
  }, testInfo) => {
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const loginResp = await request.post(`${BASE}/api/v1/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: LOGIN_BODY,
    });
    const loginBody = await loginResp.json();
    expect(loginBody?.success).toBe(true);
    const token = loginBody.data.access_token;
    await seedSession(page, loginBody.data.access_token, loginBody.data.refresh_token);

    const { primaryId } = await requireFirstProject(request, token);
    const storyCtx = await findStoryContext(request, token);
    const featureCtx = await findFeatureContext(request, token);
    const sprintCtx = await findSprintContext(request, token);
    const incidentCtx = await findIncidentContext(request, token);
    const releaseCtx = await findReleaseContext(request, token);

    const content = page.locator("body");
    const reactRoot = page.getByTestId("app-sidebar");
    const assertOneMount = async () => {
      await expect(reactRoot).toHaveCount(1);
    };

    await page.goto(`${BASE}/projects/${primaryId}/backlog`, { waitUntil: "domcontentloaded" });
    await expect(reactRoot).toBeVisible({ timeout: 30000 });
    await assertOneMount();
    await expect(page.getByTestId("backlog-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("backlog-loading")).toHaveCount(0, { timeout: 60000 });
    const backlogLinks = page.getByTestId("backlog-table").locator("tbody tr button");
    const backlogStoryCount = await backlogLinks.count();
    if (backlogStoryCount > 0) {
      await backlogLinks.first().click();
      await assertOneMount();
      await expect(page.getByTestId("story-detail-card")).toBeVisible({ timeout: 30000 });
      await expect(page.getByTestId("story-detail-message")).toHaveCount(0);
      await page.getByTestId("story-detail-root").getByRole("button", { name: "Backlog" }).click();
      await expect(page.getByTestId("backlog-root")).toBeVisible({ timeout: 30000 });
    } else {
      await expect(page.getByTestId("backlog-table")).toContainText("Sin historias en backlog");
    }

    if (storyCtx) {
      const storyPath = `/projects/${storyCtx.projectId}/stories/${storyCtx.storyId}`;
      await page.goto(`${BASE}${storyPath}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("story-detail-card")).toBeVisible({ timeout: 30000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("story-detail-card")).toBeVisible({ timeout: 60000 });
    }

    await page.goto(`${BASE}/projects/${primaryId}/stories/${FAKE_UUID_STORY}`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("story-detail-message")).toContainText("Historia no encontrada", { timeout: 30000 });

    if (storyCtx && storyCtx.secondProjectId) {
      const mismatchPath = `/projects/${storyCtx.secondProjectId}/stories/${storyCtx.storyId}`;
      await page.goto(`${BASE}${mismatchPath}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("story-detail-message")).toContainText("Elemento no pertenece a este contexto", {
        timeout: 30000,
      });
    }

    const featureListPid = featureCtx ? featureCtx.projectId : primaryId;
    await page.goto(`${BASE}/projects/${featureListPid}/features`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("features-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { level: 1, name: "Features" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("features-loading")).toHaveCount(0, { timeout: 60000 });
    const featuresTable = page.getByTestId("features-table");
    await expect(featuresTable).toBeVisible();
    const featureRowCount = await featuresTable.locator("tbody tr button").count();
    if (featureRowCount > 0) {
      await featuresTable.locator("tbody tr button").first().click();
      await assertOneMount();
      await expect(page.getByTestId("feature-detail-card")).toBeVisible({ timeout: 30000 });
      await page.getByRole("button", { name: "Ver Backlog" }).click();
      await expect(page.getByTestId("backlog-root")).toBeVisible({ timeout: 30000 });
      await page.getByTestId("backlog-root").getByRole("button", { name: "Proyecto", exact: true }).click();
      await expect(page.getByTestId("project-detail-root")).toBeVisible({ timeout: 30000 });
      await content.getByRole("button", { name: "Ver Features" }).click();
      await expect(page.getByTestId("features-root")).toBeVisible({ timeout: 30000 });
    } else {
      await expect(featuresTable).toContainText("Sin features");
    }

    if (featureCtx) {
      const detailPath = `/projects/${featureCtx.projectId}/features/${featureCtx.featureId}`;
      await page.goto(`${BASE}${detailPath}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("feature-detail-card")).toBeVisible({ timeout: 30000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("feature-detail-card")).toBeVisible({ timeout: 60000 });
    }

    await page.goto(`${BASE}/projects/${primaryId}/features/${FAKE_UUID_FEATURE}`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("feature-detail-message")).toContainText("Feature no encontrada", { timeout: 30000 });

    if (featureCtx && featureCtx.secondProjectId) {
      const mismatchFeat = `/projects/${featureCtx.secondProjectId}/features/${featureCtx.featureId}`;
      await page.goto(`${BASE}${mismatchFeat}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("feature-detail-message")).toContainText("Elemento no pertenece a este contexto", {
        timeout: 30000,
      });
    }

    const sprintListPid = sprintCtx ? sprintCtx.projectId : primaryId;
    await page.goto(`${BASE}/projects/${sprintListPid}/sprints`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("sprints-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("sprints-loading")).toHaveCount(0, { timeout: 60000 });
    const sprintsTable = page.getByTestId("sprints-table");
    await expect(sprintsTable).toBeVisible({ timeout: 30000 });
    const sprintRowCount = await sprintsTable.locator("table tbody tr").count();
    const sprintLinkCount = sprintRowCount;

    if (sprintCtx) {
      const sprintDetailPath = `/projects/${sprintCtx.projectId}/sprints/${sprintCtx.sprintId}`;
      await page.goto(`${BASE}${sprintDetailPath}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("sprint-detail-header")).toBeVisible({ timeout: 30000 });
      await expect(page.getByTestId("sprint-detail-stories")).toBeVisible();
      await expect(page.getByTestId("sprint-stories-table")).toBeVisible();
      await page.reload({ waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("sprint-detail-header")).toBeVisible({ timeout: 60000 });
    } else if (sprintLinkCount > 0) {
      await sprintsTable.locator("table tbody tr td:first-child button").first().click();
      await assertOneMount();
      await expect(page.getByTestId("sprint-detail-header")).toBeVisible({ timeout: 30000 });
      await expect(page.getByTestId("sprint-detail-stories")).toBeVisible();
      await expect(page.getByTestId("sprint-stories-table")).toBeVisible();
    } else {
      await expect(sprintsTable).toContainText("Sin sprints");
    }

    const reachedSprintDetail = Boolean(sprintCtx || sprintLinkCount > 0);
    if (reachedSprintDetail) {
      await page.getByTestId("sprint-detail-nav-sprints").click();
      await assertOneMount();
      await expect(page.getByTestId("sprints-root")).toBeVisible({ timeout: 30000 });
      await expect(sprintsTable).toBeVisible({ timeout: 30000 });
      const rowsNav = await sprintsTable.locator("table tbody tr").count();
      expect(rowsNav).toBeGreaterThan(0);
      await sprintsTable.locator("table tbody tr td:first-child button").first().click();
      await assertOneMount();
      await expect(page.getByTestId("sprint-detail-header")).toBeVisible({ timeout: 30000 });

      await page.getByTestId("sprint-detail-nav-backlog").click();
      await assertOneMount();
      await expect(page.getByTestId("backlog-root")).toBeVisible({ timeout: 30000 });
      await page.goBack();
      await assertOneMount();
      await expect(page.getByTestId("sprint-detail-header")).toBeVisible({ timeout: 30000 });
    }

    await page.goto(`${BASE}/projects/${primaryId}/sprints/${FAKE_UUID_SPRINT}`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("sprint-detail-message")).toContainText("Elemento no encontrado", { timeout: 30000 });

    if (sprintCtx && sprintCtx.secondProjectId) {
      const mismatchSprint = `/projects/${sprintCtx.secondProjectId}/sprints/${sprintCtx.sprintId}`;
      await page.goto(`${BASE}${mismatchSprint}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("sprint-detail-message")).toContainText("Elemento no pertenece a este contexto", {
        timeout: 30000,
      });
    }

    const incidentListPid = incidentCtx ? incidentCtx.projectId : primaryId;
    await page.goto(`${BASE}/projects/${incidentListPid}/incidents`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("incidents-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("incidents-loading")).toHaveCount(0, { timeout: 60000 });
    const incidentsTable = page.getByTestId("incidents-table");
    await expect(incidentsTable).toBeVisible({ timeout: 30000 });
    const incidentRowCount = await incidentsTable.locator("table tbody tr").count();
    const incidentLinkCount = incidentRowCount;

    if (incidentCtx) {
      const incidentDetailPath = `/projects/${incidentCtx.projectId}/incidents/${incidentCtx.incidentId}`;
      await page.goto(`${BASE}${incidentDetailPath}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("incident-detail-card")).toBeVisible({ timeout: 30000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("incident-detail-card")).toBeVisible({ timeout: 60000 });
      await page.getByTestId("incident-detail-nav-incidents").click();
      await assertOneMount();
      await expect(page.getByTestId("incidents-root")).toBeVisible({ timeout: 30000 });
      const rowAfterBack = await incidentsTable.locator("table tbody tr").count();
      if (rowAfterBack > 0) {
        await incidentsTable.locator("table tbody tr td:first-child button").first().click();
        await assertOneMount();
        await expect(page.getByTestId("incident-detail-card")).toBeVisible({ timeout: 30000 });
      }
    } else if (incidentLinkCount > 0) {
      await incidentsTable.locator("table tbody tr td:first-child button").first().click();
      await assertOneMount();
      await expect(page.getByTestId("incident-detail-card")).toBeVisible({ timeout: 30000 });
      await page.getByTestId("incident-detail-nav-incidents").click();
      await assertOneMount();
      await expect(page.getByTestId("incidents-root")).toBeVisible({ timeout: 30000 });
    } else {
      await expect(incidentsTable).toContainText("Sin incidentes");
    }

    await page.goto(`${BASE}/projects/${primaryId}/incidents/${FAKE_UUID_INCIDENT}`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("incident-detail-message")).toContainText("Elemento no encontrado", { timeout: 30000 });

    if (incidentCtx && incidentCtx.secondProjectId) {
      const mismatchInc = `/projects/${incidentCtx.secondProjectId}/incidents/${incidentCtx.incidentId}`;
      await page.goto(`${BASE}${mismatchInc}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("incident-detail-message")).toContainText("Elemento no pertenece a este contexto", {
        timeout: 30000,
      });
    }

    const releaseListPid = releaseCtx ? releaseCtx.projectId : primaryId;
    await page.goto(`${BASE}/projects/${releaseListPid}/releases`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("releases-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("releases-loading")).toHaveCount(0, { timeout: 120000 });
    const releasesTable = page.getByTestId("releases-table");
    await expect(releasesTable).toBeVisible({ timeout: 30000 });
    const releaseRowLink = releasesTable.locator("table tbody tr td:first-child button");
    const releaseLinkCount = await releaseRowLink.count();

    if (releaseCtx) {
      const releaseDetailPath = `/projects/${releaseCtx.projectId}/releases/${releaseCtx.releaseId}`;
      await page.goto(`${BASE}${releaseDetailPath}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("release-detail-card")).toBeVisible({ timeout: 30000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("release-detail-card")).toBeVisible({ timeout: 60000 });
      await page.getByTestId("release-detail-nav-releases").click();
      await assertOneMount();
      await expect(page.getByTestId("releases-root")).toBeVisible({ timeout: 30000 });
      const rowsAfter = await releaseRowLink.count();
      if (rowsAfter > 0) {
        await releaseRowLink.first().click();
        await assertOneMount();
        await expect(page.getByTestId("release-detail-card")).toBeVisible({ timeout: 30000 });
      }
    } else if (releaseLinkCount > 0) {
      await releaseRowLink.first().click();
      await assertOneMount();
      await expect(page.getByTestId("release-detail-card")).toBeVisible({ timeout: 30000 });
      await page.getByTestId("release-detail-nav-releases").click();
      await assertOneMount();
      await expect(page.getByTestId("releases-root")).toBeVisible({ timeout: 30000 });
    } else {
      await expect(releasesTable).toContainText("Sin releases vinculadas");
    }

    await page.goto(`${BASE}/projects/${primaryId}/releases/${FAKE_UUID_RELEASE}`, { waitUntil: "domcontentloaded" });
    await assertOneMount();
    await expect(page.getByTestId("release-detail-error")).toContainText("Release no encontrada", { timeout: 30000 });

    if (releaseCtx && releaseCtx.secondProjectId) {
      const mismatchRel = `/projects/${releaseCtx.secondProjectId}/releases/${releaseCtx.releaseId}`;
      await page.goto(`${BASE}${mismatchRel}`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await expect(page.getByTestId("release-detail-orphan")).toContainText("Aún no hay features", {
        timeout: 30000,
      });
    }

    for (let round = 0; round < 2; round++) {
      await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
      await assertOneMount();
      await page.getByTestId("projects-table-wrapper").getByTestId("project-list-name-link").first().click();
      await assertOneMount();
      await expect(page.getByTestId("project-detail-root")).toBeVisible({ timeout: 30000 });
      await content.getByRole("button", { name: "Ver Features" }).click();
      await assertOneMount();
      await expect(page.getByTestId("features-root")).toBeVisible({ timeout: 30000 });
      await page.getByTestId("features-root").getByRole("button", { name: "Proyecto", exact: true }).click();
      await assertOneMount();
      await expect(page.getByTestId("project-detail-root")).toBeVisible({ timeout: 30000 });
      await content.getByRole("button", { name: "Ver Backlog" }).click();
      await assertOneMount();
      await expect(page.getByTestId("backlog-root")).toBeVisible({ timeout: 30000 });
      await page.getByTestId("backlog-root").getByRole("button", { name: "Lista proyectos" }).click();
      await assertOneMount();
      await expect(content).toContainText("Projects - Nexus DevSuite", { timeout: 30000 });
    }

    if (pageErrors.length > 0) {
      await testInfo.attach("pageerrors-wm.txt", {
        body: pageErrors.join("\n"),
        contentType: "text/plain",
      });
    }
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });
});

test.describe("Admin React — RBAC MASTER", () => {
  test("MASTER ve administracion; EMPLOYEE redirige a dashboard; deep link y reload", async ({ browser, request }) => {
    const masterLogin = await request.post(`${BASE}/api/v1/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: LOGIN_BODY,
    });
    const masterBody = await masterLogin.json();
    expect(masterBody?.success).toBe(true);
    const masterToken = masterBody.data.access_token;

    const masterContext = await browser.newContext();
    const page = await masterContext.newPage();
    const reactRoot = page.getByTestId("app-sidebar");
    const content = page.locator("body");

    await seedSession(page, masterBody.data.access_token, masterBody.data.refresh_token);

    await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    await expect(reactRoot).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("admin-root")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("admin-loading")).toHaveCount(0, { timeout: 60000 });
    await expect(content).toContainText("Administration - Nexus DevSuite", { timeout: 30000 });
    await expect(page.getByTestId("admin-section-users")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("breadcrumb-admin")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(reactRoot).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("admin-section-users")).toBeVisible({ timeout: 60000 });
    await expect(content).toContainText("Administration - Nexus DevSuite", { timeout: 30000 });

    await masterContext.close();

    const empTokens = await ensureEmployeeTokens(request, masterToken);
    const empContext = await browser.newContext();
    const empPage = await empContext.newPage();
    await empPage.addInitScript(
      ([a, r]) => {
        sessionStorage.setItem("nexus_access_token", a);
        sessionStorage.setItem("nexus_refresh_token", r);
      },
      [empTokens.access_token, empTokens.refresh_token]
    );
    const empContent = empPage.locator("body");
    const empReact = empPage.getByTestId("app-sidebar");

    await empPage.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    await expect(empReact).toBeVisible({ timeout: 30000 });
    await expect(empPage.getByTestId("forbidden-root")).toBeVisible({ timeout: 60000 });
    await expect(empContent).toContainText("Acceso denegado", { timeout: 60000 });
    await expect(empPage.getByTestId("admin-section-users")).toHaveCount(0);

    await empPage.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
    await expect(empReact).toBeVisible({ timeout: 30000 });
    await expect(empPage.getByTestId("forbidden-root")).toBeVisible({ timeout: 60000 });
    await expect(empContent).toContainText("Acceso denegado", { timeout: 60000 });
    await expect(empPage.getByTestId("admin-section-users")).toHaveCount(0);

    await empPage.reload({ waitUntil: "domcontentloaded" });
    await expect(empReact).toBeVisible({ timeout: 30000 });
    await expect(empPage.getByTestId("forbidden-root")).toBeVisible({ timeout: 60000 });
    await expect(empContent).toContainText("Acceso denegado", { timeout: 60000 });
    await expect(empPage.getByTestId("admin-section-users")).toHaveCount(0);

    await empContext.close();
  });
});
