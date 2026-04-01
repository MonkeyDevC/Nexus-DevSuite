/**
 * Suite QA negativo ETAPA 1 - Backlog
 * Sin omisiones: todos los tests se ejecutan siempre. Si login MASTER falla, la suite falla.
 * Usuario MASTER creado en BD en beforeAll; login real vía endpoint.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-backlog@nexus-etapa1.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";

let app;
let masterToken;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Backlog ETAPA 1 - QA negativo", () => {
  beforeAll(async () => {
    const { User, Role } = getModels();
    const role = await Role.findOne({ where: { name: "MASTER" } });
    if (!role) {
      throw new Error("Rol MASTER no existe en BD. Ejecute migraciones y seed.");
    }

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
      throw new Error(`Login MASTER falló (status=${res.status}): ${JSON.stringify(res.body)}`);
    }
    masterToken = res.body.data.access_token;
  });

  async function createApprovedCRForFeature(featureId) {
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "CR", entity_type: "FEATURE", entity_id: featureId })
      .expect(201);
    const crId = crRes.body.data.id;
    await request(app)
      .patch(`/api/v1/change-requests/${crId}/submit`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/change-requests/${crId}/approve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    return crId;
  }

  test("Crear proyecto duplicado devuelve 409 y PROJECT_NAME_DUPLICATE", async () => {
    const name = "Proyecto QA Duplicado " + Date.now();
    await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name, description: "Desc" })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name, description: "Otro" })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("PROJECT_NAME_DUPLICATE");
    expect(res.status).not.toBe(500);
  });

  test("Transición inválida en Feature devuelve 400 y FEATURE_INVALID_TRANSITION", async () => {
    const createProject = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Trans " + Date.now(), description: "D" })
      .expect(201);
    const projectId = createProject.body.data.id;

    const createFeature = await request(app)
      .post(`/api/v1/projects/${projectId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F1", description: "Desc" })
      .expect(201);
    const featureId = createFeature.body.data.id;
    const crId = await createApprovedCRForFeature(featureId);

    const res = await request(app)
      .patch(`/api/v1/features/${featureId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "DONE", change_request_id: crId })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("FEATURE_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("Crear Feature en proyecto inexistente devuelve 404 PROJECT_NOT_FOUND", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/v1/projects/${fakeId}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(404);
    expect(res.body.error && res.body.error.code).toBe("PROJECT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Crear Story en feature inexistente devuelve 404 FEATURE_NOT_FOUND", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/v1/features/${fakeId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S", description: "D" })
      .expect(404);
    expect(res.body.error && res.body.error.code).toBe("FEATURE_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("PATCH story status con transición inválida devuelve 400 y STORY_INVALID_TRANSITION", async () => {
    const createProject = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Story " + Date.now(), description: "D" })
      .expect(201);
    const createFeature = await request(app)
      .post(`/api/v1/projects/${createProject.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const createStory = await request(app)
      .post(`/api/v1/features/${createFeature.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S", description: "D" })
      .expect(201);
    const storyId = createStory.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/stories/${storyId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "DONE" })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("STORY_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("Crear Feature en proyecto archivado devuelve 400 y PROJECT_ARCHIVED", async () => {
    const createProject = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Archivado " + Date.now(), description: "D" })
      .expect(201);
    const pid = createProject.body.data.id;
    const expectedVersion = createProject.body.data.version;
    await request(app)
      .patch(`/api/v1/projects/${pid}/archive`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ expected_version: expectedVersion })
      .expect(200);
    const res = await request(app)
      .post(`/api/v1/projects/${pid}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("PROJECT_ARCHIVED");
    expect(res.status).not.toBe(500);
  });

  test("Asignar story a usuario inexistente devuelve 400 e INVALID_ASSIGNMENT", async () => {
    const createProject = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Assign " + Date.now(), description: "D" })
      .expect(201);
    const createFeature = await request(app)
      .post(`/api/v1/projects/${createProject.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const createStory = await request(app)
      .post(`/api/v1/features/${createFeature.body.data.id}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "S", description: "D" })
      .expect(201);
    const storyId = createStory.body.data.id;

    const fakeUserId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    const res = await request(app)
      .patch(`/api/v1/stories/${storyId}/assign`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ assigned_to: fakeUserId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("INVALID_ASSIGNMENT");
    expect(res.status).not.toBe(500);
  });

  test("Sin token devuelve 401 en rutas protegidas", async () => {
    const res = await request(app).get("/api/v1/projects").expect(401);
    expect(res.status).not.toBe(500);
  });
});
