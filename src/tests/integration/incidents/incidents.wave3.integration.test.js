/**
 * WAVE 3 — Incidents: raíz /incidents, PUT, DELETE OPEN, POST transiciones, story_id.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-incidents-wave3@nexus-w3.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";

let app;
let masterToken;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("WAVE 3 — Incidents integración", () => {
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

  async function seedProjectWithStory() {
    const pr = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj W3 " + Date.now(), description: "d" })
      .expect(201);
    const projectId = pr.body.data.id;
    const fr = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F W3", description: "df" })
      .expect(201);
    const featureId = fr.body.data.id;
    const sr = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S W3", description: "ds" })
      .expect(201);
    const storyId = sr.body.data.id;
    return { projectId, featureId, storyId };
  }

  test("GET /incidents?project_id= lista con meta", async () => {
    const { projectId } = await seedProjectWithStory();
    await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "List W3 " + Date.now(),
        severity: "LOW",
        priority: "HIGH"
      })
      .expect(201);

    const res = await request(app)
      .get(`/api/v1/incidents?project_id=${projectId}&limit=10`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.meta).toBeDefined();
    expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
  });

  test("POST /incidents crea con story_id", async () => {
    const { projectId, storyId } = await seedProjectWithStory();
    const res = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "Story link " + Date.now(),
        severity: "MEDIUM",
        priority: "MEDIUM",
        story_id: storyId
      })
      .expect(201);
    expect(res.body.data.story_id).toBe(storyId);
  });

  test("PUT actualiza story_id y permite null", async () => {
    const { projectId, storyId } = await seedProjectWithStory();
    const ir = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "PUT story " + Date.now(),
        severity: "MEDIUM",
        priority: "LOW"
      })
      .expect(201);
    const incidentId = ir.body.data.id;

    await request(app)
      .put(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ story_id: storyId })
      .expect(200);

    const g1 = await request(app)
      .get(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(g1.body.data.story_id).toBe(storyId);

    await request(app)
      .put(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ story_id: null })
      .expect(200);

    const g2 = await request(app)
      .get(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(g2.body.data.story_id).toBeNull();
  });

  test("story_id inexistente (UUID válido) → STORY_NOT_FOUND", async () => {
    const { projectId } = await seedProjectWithStory();
    const fakeStory = "00000000-0000-4000-8000-000000000001";
    const res = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "Bad story " + Date.now(),
        severity: "MEDIUM",
        priority: "MEDIUM",
        story_id: fakeStory
      })
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("STORY_NOT_FOUND");
  });

  test("story_id de otro proyecto → STORY_PROJECT_MISMATCH", async () => {
    const a = await seedProjectWithStory();
    const b = await seedProjectWithStory();
    const res = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: a.projectId,
        title: "Mismatch " + Date.now(),
        severity: "MEDIUM",
        priority: "MEDIUM",
        story_id: b.storyId
      })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("STORY_PROJECT_MISMATCH");
  });

  test("DELETE solo OPEN y contrato data.id", async () => {
    const { projectId } = await seedProjectWithStory();
    const ir = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "Del open " + Date.now(),
        severity: "HIGH",
        priority: "HIGH"
      })
      .expect(201);
    const incidentId = ir.body.data.id;

    const del = await request(app)
      .delete(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(del.body).toEqual({
      success: true,
      data: { id: incidentId },
      meta: {}
    });
  });

  test("DELETE no OPEN → INCIDENT_INVALID_STATE", async () => {
    const { projectId } = await seedProjectWithStory();
    const ir = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "Del prog " + Date.now(),
        severity: "MEDIUM",
        priority: "MEDIUM"
      })
      .expect(201);
    const incidentId = ir.body.data.id;
    await request(app)
      .post(`/api/v1/incidents/${incidentId}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(200);

    const res = await request(app)
      .delete(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(409);
    expect(res.body.error.code).toBe("INCIDENT_INVALID_STATE");
  });

  test("POST start / resolve / close flujo válido", async () => {
    const { projectId } = await seedProjectWithStory();
    const ir = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "Flow " + Date.now(),
        severity: "LOW",
        priority: "LOW"
      })
      .expect(201);
    const incidentId = ir.body.data.id;

    await request(app)
      .post(`/api/v1/incidents/${incidentId}/start`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(200);

    await request(app)
      .put(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ root_cause_analysis: "RCA before resolve" })
      .expect(200);

    await request(app)
      .post(`/api/v1/incidents/${incidentId}/resolve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(200);

    const close = await request(app)
      .post(`/api/v1/incidents/${incidentId}/close`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ root_cause_analysis: "RCA final ISO" })
      .expect(200);
    expect(close.body.data.status).toBe("CLOSED");
  });

  test("POST resolve desde OPEN → INCIDENT_INVALID_TRANSITION", async () => {
    const { projectId } = await seedProjectWithStory();
    const ir = await request(app)
      .post(`/api/v1/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({
        project_id: projectId,
        title: "Bad trans " + Date.now(),
        severity: "MEDIUM",
        priority: "MEDIUM"
      })
      .expect(201);
    const incidentId = ir.body.data.id;
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/resolve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({})
      .expect(400);
    expect(res.body.error.code).toBe("INCIDENT_INVALID_TRANSITION");
  });
});
