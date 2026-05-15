/**
 * WAVE 1 — DELETE feature/story: reglas de negocio y contrato { data: { id } }.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-wave1-delete@nexus-etapa1.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";

let app;
let masterToken;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("WAVE 1 — DELETE features/stories", () => {
  beforeAll(async () => {
    const { User, Role } = getModels();
    const role = await Role.findOne({ where: { name: "MASTER" } });
    if (!role) throw new Error("Rol MASTER no existe");

    const existing = await User.unscoped().findOne({ where: { email: TEST_MASTER_EMAIL } });
    if (!existing) {
      await User.create({
        email: TEST_MASTER_EMAIL,
        password_hash: bcrypt.hashSync(TEST_MASTER_PASSWORD, 10),
        role_id: role.id,
        is_active: true
      });
    }

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD });
    if (res.status !== 200 || !res.body.data?.access_token) {
      throw new Error(`Login falló: ${JSON.stringify(res.body)}`);
    }
    masterToken = res.body.data.access_token;
  });

  test("DELETE feature con stories: 200, historias huérfanas (feature_id null, mismo project_id)", async () => {
    const name = "Proyecto Wave1 Del " + Date.now();
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name, description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;

    const fr = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F1", description: "d1" })
      .expect(201);
    const featureId = fr.body.data.id;

    const sr = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S1", description: "sd" })
      .expect(201);
    const storyId = sr.body.data.id;

    const del = await request(app)
      .delete(`/api/v1/features/${featureId}`)
      .set("Authorization", `Bearer ${masterToken}`);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
    expect(del.body.data).toEqual({ id: featureId });

    const getStory = await request(app)
      .get(`/api/v1/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(getStory.body.data?.feature_id == null || String(getStory.body.data.feature_id).trim() === "").toBe(true);
    expect(String(getStory.body.data?.project_id || "")).toBe(String(projectId));
  });

  test("DELETE feature sin stories devuelve 200 y data.id", async () => {
    const name = "Proyecto Wave1 Del2 " + Date.now();
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name, description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;

    const fr = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F2", description: "d2" })
      .expect(201);
    const featureId = fr.body.data.id;

    const del = await request(app)
      .delete(`/api/v1/features/${featureId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(del.body.success).toBe(true);
    expect(del.body.data).toEqual({ id: featureId });
  });

  test("DELETE story en sprint devuelve 409 STORY_IN_SPRINT", async () => {
    const name = "Proyecto Wave1 Del3 " + Date.now();
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name, description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;

    const fr = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F3", description: "d3" })
      .expect(201);
    const featureId = fr.body.data.id;

    const sr = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S3", description: "sd" })
      .expect(201);
    const storyId = sr.body.data.id;

    await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "READY" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ refinement_status: "READY" })
      .expect(200);

    const spr = await request(app)
      .post(`/api/v1/projects/${projectId}/sprints`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        name: "Sprint W1",
        goal: "g",
        start_date: "2026-07-01",
        end_date: "2026-07-15"
      })
      .expect(201);
    const sprintId = spr.body.data.id;

    await request(app)
      .patch(`/api/v1/stories/${storyId}/sprint`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ sprint_id: sprintId })
      .expect(200);

    const del = await request(app)
      .delete(`/api/v1/stories/${storyId}`)
      .set("Authorization", `Bearer ${masterToken}`);
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe("STORY_IN_SPRINT");
  });

  test("GET /features sin project_id devuelve validación 422", async () => {
    const res = await request(app).get("/api/v1/features").set("Authorization", `Bearer ${masterToken}`);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
