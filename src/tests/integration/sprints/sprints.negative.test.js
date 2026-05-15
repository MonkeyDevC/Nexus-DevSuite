/**
 * Suite QA negativo ETAPA 2 - Sprints
 * Sin omisiones: todos los tests se ejecutan siempre.
 * Usuario MASTER y EMPLOYEE creados en BD; login real vía endpoint.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-sprints@nexus-etapa2.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-sprints@nexus-etapa2.local";
const TEST_EMPLOYEE_PASSWORD = "TestEmployee123!";

const SPRINT_RANGE = { start_date: "2026-06-01", end_date: "2026-06-28" };

function withSprintDates(body) {
  return { ...SPRINT_RANGE, ...body };
}

let app;
let masterToken;
let employeeToken;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Sprints ETAPA 2 - QA negativo", () => {
  beforeAll(async () => {
    const { User, Role } = getModels();
    const masterRole = await Role.findOne({ where: { name: "MASTER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    if (!masterRole || !employeeRole) {
      throw new Error("Roles MASTER o EMPLOYEE no existen en BD. Ejecute migraciones y seed.");
    }

    let masterUser = await User.unscoped().findOne({ where: { email: TEST_MASTER_EMAIL } });
    if (!masterUser) {
      masterUser = await User.create({
        email: TEST_MASTER_EMAIL,
        password_hash: bcrypt.hashSync(TEST_MASTER_PASSWORD, 10),
        role_id: masterRole.id,
        is_active: true
      });
    }

    let employeeUser = await User.unscoped().findOne({ where: { email: TEST_EMPLOYEE_EMAIL } });
    if (!employeeUser) {
      employeeUser = await User.create({
        email: TEST_EMPLOYEE_EMAIL,
        password_hash: bcrypt.hashSync(TEST_EMPLOYEE_PASSWORD, 10),
        role_id: employeeRole.id,
        is_active: true
      });
    }

    const loginMaster = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD });
    if (loginMaster.status !== 200 || !loginMaster.body.data?.access_token) {
      throw new Error(`Login MASTER falló: ${JSON.stringify(loginMaster.body)}`);
    }
    masterToken = loginMaster.body.data.access_token;

    const loginEmployee = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMPLOYEE_EMAIL, password: TEST_EMPLOYEE_PASSWORD });
    if (loginEmployee.status !== 200 || !loginEmployee.body.data?.access_token) {
      throw new Error(`Login EMPLOYEE falló: ${JSON.stringify(loginEmployee.body)}`);
    }
    employeeToken = loginEmployee.body.data.access_token;
  });

  /** Requisito de dominio: asignación a sprint solo con refinement_status READY. */
  async function patchStoryRefinementReadyForSprint(storyId) {
    await request(app)
      .patch(`/api/v1/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ refinement_status: "READY" })
      .expect(200);
  }

  test("Crear sprint en proyecto inexistente devuelve 404", async () => {
    const fakeProjectId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/v1/projects/${fakeProjectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint 1", goal: "Test" }))
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("PROJECT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Transición inválida PLANNED → CLOSED devuelve 400 y SPRINT_INVALID_TRANSITION", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Sprint Trans " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint Trans " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE intenta cerrar sprint (IN_PROGRESS → CLOSED) devuelve 403", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Sprint Emp " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint Emp " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "CLOSED" })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("AUTH_FORBIDDEN");
    expect(res.status).not.toBe(500);
  });

  test("MASTER cierra sprint → 200", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Sprint Close " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint Close " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.status).toBe("CLOSED");
    expect(res.body.data?.closed_at).toBeDefined();
    expect(res.status).not.toBe(500);
  });

  test("Cerrar sprint con story IN_PROGRESS devuelve 409 SPRINT_HAS_ACTIVE_WORK", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Active Work " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint AW " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    await request(app)
      .post(`/api/v1/sprints/${sprintId}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);

    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F AW", description: "D" })
      .expect(201);
    const storyRes = await request(app)
      .post(`/api/v1/features/${featureRes.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S AW", description: "D" })
      .expect(201);
    const storyId = storyRes.body.data.id;

    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "READY" })
      .expect(200);
    await patchStoryRefinementReadyForSprint(storyId);
    await request(app)
      .post(`/api/v1/sprints/${sprintId}/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);

    const res = await request(app)
      .post(`/api/v1/sprints/${sprintId}/close`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_HAS_ACTIVE_WORK");
  });

  test("Segundo sprint IN_PROGRESS en mismo proyecto devuelve 409 SPRINT_ALREADY_ACTIVE", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Two Active " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const s1 = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "S1 " + Date.now() }))
      .expect(201);
    await request(app)
      .post(`/api/v1/sprints/${s1.body.data.id}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);

    const s2 = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "S2 " + Date.now() }))
      .expect(201);

    const res = await request(app)
      .post(`/api/v1/sprints/${s2.body.data.id}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(409);
    expect(res.body.error?.code).toBe("SPRINT_ALREADY_ACTIVE");
  });

  test("GET /sprints?project_id lista igual que nested", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj List Root " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "ListRoot " + Date.now() }))
      .expect(201);

    const nested = await request(app)
      .get(`/api/v1/projects/${projectId}/sprints?page=1&limit=10`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const root = await request(app)
      .get(`/api/v1/sprints?project_id=${projectId}&page=1&limit=10`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);

    expect(nested.body.data?.meta?.total).toBe(root.body.data?.meta?.total);
  });

  test("DELETE sprint PLANNED devuelve data.id y meta vacío", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Del Sp " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Del " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/sprints/${sprintId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(res.body).toEqual({
      success: true,
      data: { id: sprintId },
      meta: {}
    });
  });

  test("DELETE sprint IN_PROGRESS devuelve 409 SPRINT_INVALID_STATE", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Del Bad " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "DelBad " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);

    const res = await request(app)
      .delete(`/api/v1/sprints/${sprintId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(409);
    expect(res.body.error?.code).toBe("SPRINT_INVALID_STATE");
  });

  test("Asignar story a sprint CLOSED devuelve 400 SPRINT_CLOSED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Sprint Closed " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint Closed " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;
    await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(200);

    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F Closed", description: "D" })
      .expect(201);
    const storyRes = await request(app)
      .post(`/api/v1/features/${featureRes.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S Closed", description: "D" })
      .expect(201);
    const storyId = storyRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/sprints/${sprintId}/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_CLOSED");
    expect(res.status).not.toBe(500);
  });

  test("Asignar story de otro proyecto devuelve 400 SPRINT_STORY_PROJECT_MISMATCH", async () => {
    const projectARes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj A Mismatch " + Date.now(), description: "D" })
      .expect(201);
    const projectBRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj B Mismatch " + Date.now(), description: "D" })
      .expect(201);

    const sprintARes = await request(app)
      .post(`/api/v1/projects/${projectARes.body.data.id}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint A " + Date.now() }))
      .expect(201);
    const sprintId = sprintARes.body.data.id;

    const featureBRes = await request(app)
      .post(`/api/v1/projects/${projectBRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F B", description: "D" })
      .expect(201);
    const storyBRes = await request(app)
      .post(`/api/v1/features/${featureBRes.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S B", description: "D" })
      .expect(201);
    const storyIdB = storyBRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/sprints/${sprintId}/stories/${storyIdB}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_STORY_PROJECT_MISMATCH");
    expect(res.status).not.toBe(500);
  });

  test("Story ya en sprint: segunda asignación devuelve 409 STORY_ALREADY_IN_SPRINT", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Double " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const s1 = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "D1 " + Date.now() }))
      .expect(201);
    const s2 = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "D2 " + Date.now() }))
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F D", description: "D" })
      .expect(201);
    const storyRes = await request(app)
      .post(`/api/v1/features/${featureRes.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S D", description: "D" })
      .expect(201);
    const storyId = storyRes.body.data.id;
    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "READY" })
      .expect(200);
    await patchStoryRefinementReadyForSprint(storyId);
    await request(app)
      .post(`/api/v1/stories/${storyId}/assign-sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ sprint_id: s1.body.data.id })
      .expect(200);

    const res = await request(app)
      .post(`/api/v1/stories/${storyId}/assign-sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ sprint_id: s2.body.data.id })
      .expect(409);
    expect(res.body.error?.code).toBe("STORY_ALREADY_IN_SPRINT");
  });

  test("POST remove-sprint idempotente sin sprint_id", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Rm Idem " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F R", description: "D" })
      .expect(201);
    const storyRes = await request(app)
      .post(`/api/v1/features/${featureRes.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S R", description: "D" })
      .expect(201);
    const storyId = storyRes.body.data.id;

    const r1 = await request(app)
      .post(`/api/v1/stories/${storyId}/remove-sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const r2 = await request(app)
      .post(`/api/v1/stories/${storyId}/remove-sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(r1.body.data?.id).toBe(storyId);
    expect(r2.body.data?.id).toBe(storyId);
  });

  test("Desasignar story de sprint CLOSED devuelve 400 SPRINT_CLOSED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Unassign " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint Unassign " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F Unassign", description: "D" })
      .expect(201);
    const storyRes = await request(app)
      .post(`/api/v1/features/${featureRes.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S Unassign", description: "D" })
      .expect(201);
    const storyId = storyRes.body.data.id;

    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "READY" })
      .expect(200);
    await patchStoryRefinementReadyForSprint(storyId);
    await request(app)
      .post(`/api/v1/sprints/${sprintId}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    await request(app)
      .post(`/api/v1/sprints/${sprintId}/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_REVIEW" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "DONE" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/sprints/${sprintId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(200);

    const res = await request(app)
      .delete(`/api/v1/sprints/${sprintId}/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_CLOSED");
    expect(res.status).not.toBe(500);
  });

  test("Sprint inexistente devuelve 404", async () => {
    const fakeSprintId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/sprints/${fakeSprintId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("assign-sprint con story inexistente devuelve 404 STORY_NOT_FOUND", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj StoryNF " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;
    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint SNF " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;
    const res = await request(app)
      .post("/api/v1/stories/00000000-0000-0000-0000-000000000000/assign-sprint")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ sprint_id: sprintId })
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("STORY_NOT_FOUND");
  });

  test("Cerrar sprint: DONE conserva sprint_id; READY pierde sprint_id", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Close Dataset " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const sprintRes = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(withSprintDates({ name: "Sprint Close Dataset " + Date.now() }))
      .expect(201);
    const sprintId = sprintRes.body.data.id;

    const fDone = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F Done", description: "D" })
      .expect(201);
    const fReady = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F Ready", description: "D" })
      .expect(201);

    const storyDoneRes = await request(app)
      .post(`/api/v1/features/${fDone.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Story Done", description: "D" })
      .expect(201);
    const storyReadyRes = await request(app)
      .post(`/api/v1/features/${fReady.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Story Ready", description: "D" })
      .expect(201);
    const storyDoneId = storyDoneRes.body.data.id;
    const storyReadyId = storyReadyRes.body.data.id;

    await request(app)
      .patch(`/api/v1/stories/${storyDoneId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "READY" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyReadyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "READY" })
      .expect(200);
    await patchStoryRefinementReadyForSprint(storyDoneId);
    await patchStoryRefinementReadyForSprint(storyReadyId);

    await request(app)
      .post(`/api/v1/sprints/${sprintId}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);

    await request(app)
      .post(`/api/v1/stories/${storyDoneId}/assign-sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ sprint_id: sprintId })
      .expect(200);
    await request(app)
      .post(`/api/v1/stories/${storyReadyId}/assign-sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ sprint_id: sprintId })
      .expect(200);

    await request(app)
      .patch(`/api/v1/stories/${storyDoneId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyDoneId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_REVIEW" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyDoneId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "DONE" })
      .expect(200);

    await request(app)
      .post(`/api/v1/sprints/${sprintId}/close`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);

    const getDone = await request(app)
      .get(`/api/v1/stories/${storyDoneId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(getDone.body.success).toBe(true);
    expect(String(getDone.body.data?.sprint_id || "")).toBe(String(sprintId));

    const getReady = await request(app)
      .get(`/api/v1/stories/${storyReadyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(getReady.body.success).toBe(true);
    expect(getReady.body.data?.sprint_id == null || String(getReady.body.data.sprint_id).trim() === "").toBe(true);
  });
});
