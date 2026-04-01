/**
 * Suite QA negativo ETAPA 2 - Releases
 * Sin omisiones: todos los tests se ejecutan siempre. Si login MASTER falla, la suite falla.
 * Usuario MASTER (y EMPLOYEE para 403) creados en BD en beforeAll; login real vía endpoint.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const releaseRepository = require("../../../modules/releases/release.repository");
const { parseSemVer } = require("../../../modules/releases/semver.validator");

const TEST_MASTER_EMAIL = "test-master-releases@nexus-etapa2.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-releases@nexus-etapa2.local";
const TEST_EMPLOYEE_PASSWORD = "TestEmployee123!";

let app;
let masterToken;
let employeeToken;
let baseMajor;
let BASE_VERSION;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Releases ETAPA 2 - QA negativo", () => {
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
      throw new Error(`Login MASTER falló (status=${loginMaster.status}): ${JSON.stringify(loginMaster.body)}`);
    }
    masterToken = loginMaster.body.data.access_token;

    const loginEmployee = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMPLOYEE_EMAIL, password: TEST_EMPLOYEE_PASSWORD });
    if (loginEmployee.status !== 200 || !loginEmployee.body.data?.access_token) {
      throw new Error(`Login EMPLOYEE falló (status=${loginEmployee.status}): ${JSON.stringify(loginEmployee.body)}`);
    }
    employeeToken = loginEmployee.body.data.access_token;

    const latest = await releaseRepository.findLatestReleased();
    const parsed = latest ? parseSemVer(latest.version) : null;
    baseMajor = parsed ? parsed.major + 10 : 50000 + (Date.now() % 40000);
    BASE_VERSION = `${baseMajor}.0.0`;
  });

  async function createApprovedCRForRelease(releaseId) {
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "CR", entity_type: "RELEASE", entity_id: releaseId })
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

  async function createStoryOnFeature(featureId) {
    const res = await request(app)
      .post(`/api/v1/features/${featureId}/stories`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Story " + Date.now(), description: "D" })
      .expect(201);
    return res.body.data.id;
  }

  async function attachStoryToRelease(storyId, releaseId) {
    await request(app)
      .post(`/api/v1/stories/${storyId}/assign-release`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ release_id: releaseId })
      .expect(200);
  }

  test("Sin name devuelve 400 y VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: `${baseMajor}.0.${(Date.now() % 10000000) + 200000}`, description: "Test" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.status).not.toBe(500);
  });

  test("Versión vacía / solo espacios devuelve VALIDATION_ERROR (capa HTTP)", async () => {
    const res = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "N", version: "   ", description: "Test" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.status).not.toBe(500);
  });

  test("Versión duplicada devuelve 409 y RELEASE_ALREADY_EXISTS", async () => {
    const version = `${baseMajor}.0.${(Date.now() % 10000000) + 100000}`;
    await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Primera", version, description: "Primera" })
      .expect(201);
    const res = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Dup", version, description: "Duplicada" })
      .expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_ALREADY_EXISTS");
    expect(res.status).not.toBe(500);
  });

  test("WAVE 4: version etiqueta no SemVer estricto acepta si única", async () => {
    const version = `v1.0.0-${Date.now()}`;
    const res = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Etiqueta", version, description: "D" })
      .expect(201);
    expect(res.body.data.version).toBe(version);
  });

  test("Transición inválida (PLANNED → RELEASED) devuelve 400 y RELEASE_INVALID_TRANSITION", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "T1", version: `${baseMajor}.1.0`, description: "D" })
      .expect(201);
    const crId = await createApprovedCRForRelease(createRelease.body.data.id);
    const res = await request(app)
      .patch(`/api/v1/releases/${createRelease.body.data.id}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("Pasar a RELEASED sin stories devuelve 400 y RELEASE_EMPTY", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Empty", version: `${baseMajor}.2.0`, description: "D" })
      .expect(201);
    const releaseId = createRelease.body.data.id;
    let crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "QA", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_EMPTY");
    expect(res.status).not.toBe(500);
  });

  test("Asignar feature ya en otro release devuelve 400 y FEATURE_ALREADY_IN_RELEASE", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Feat2Rel " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const release1 = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "R1", version: `${baseMajor}.3.0`, description: "R1" })
      .expect(201);
    const release2 = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "R2", version: `${baseMajor}.4.0`, description: "R2" })
      .expect(201);
    const cr1Id = await createApprovedCRForRelease(release1.body.data.id);
    await request(app)
      .post(`/api/v1/releases/${release1.body.data.id}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr1Id })
      .expect(200);
    const cr2Id = await createApprovedCRForRelease(release2.body.data.id);
    const res = await request(app)
      .post(`/api/v1/releases/${release2.body.data.id}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: cr2Id })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("FEATURE_ALREADY_IN_RELEASE");
    expect(res.status).not.toBe(500);
  });

  test("Asignar feature a release ARCHIVED devuelve 400 y RELEASE_ARCHIVED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Arch " + Date.now(), description: "D" })
      .expect(201);
    const feature1Res = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F1", description: "D" })
      .expect(201);
    const feature2Res = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F2", description: "D" })
      .expect(201);
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Arch5", version: `${baseMajor}.5.0`, description: "R" })
      .expect(201);
    const releaseId = releaseRes.body.data.id;
    let crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "QA", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .post(`/api/v1/releases/${releaseId}/features/${feature1Res.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    const storyArch5 = await createStoryOnFeature(feature1Res.body.data.id);
    await attachStoryToRelease(storyArch5, releaseId);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);
    const { Release } = getModels();
    await Release.update({ status: "ARCHIVED" }, { where: { id: releaseId } });

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/features/${feature2Res.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_ARCHIVED");
    expect(res.status).not.toBe(500);
  });

  test("Cambiar status de release con token EMPLOYEE devuelve 403", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "E6", version: `${baseMajor}.6.0`, description: "D" })
      .expect(201);
    const crId = await createApprovedCRForRelease(createRelease.body.data.id);
    const res = await request(app)
      .patch(`/api/v1/releases/${createRelease.body.data.id}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(403);
    expect(res.status).not.toBe(500);
  });

  test("PATCH release con version en body devuelve VALIDATION_ERROR (use PUT para version)", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "V7", version: `${baseMajor}.7.0`, description: "D" })
      .expect(201);
    const crId = await createApprovedCRForRelease(createRelease.body.data.id);
    const res = await request(app)
      .patch(`/api/v1/releases/${createRelease.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: `${baseMajor}.7.99`, change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.status).not.toBe(500);
  });

  test("Bloqueo ARCHIVED: cambiar status de release archivada devuelve RELEASE_ARCHIVED", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "S8", version: `${baseMajor}.8.0`, description: "D" })
      .expect(201);
    const releaseId = createRelease.body.data.id;
    let crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "QA", change_request_id: crId })
      .expect(200);
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj ArchStatus " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    const storyS8 = await createStoryOnFeature(featureRes.body.data.id);
    await attachStoryToRelease(storyS8, releaseId);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);
    const { Release: ReleaseSt } = getModels();
    await ReleaseSt.update({ status: "ARCHIVED" }, { where: { id: releaseId } });

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_ARCHIVED");
    expect(res.status).not.toBe(500);
  });

  test("Bloqueo ARCHIVED: editar description de release archivada devuelve RELEASE_ARCHIVED", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "D9", version: `${baseMajor}.9.0`, description: "D" })
      .expect(201);
    const releaseId = createRelease.body.data.id;
    let crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "QA", change_request_id: crId })
      .expect(200);
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj ArchDesc " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    const storyD9 = await createStoryOnFeature(featureRes.body.data.id);
    await attachStoryToRelease(storyD9, releaseId);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);
    const { Release: ReleaseDesc } = getModels();
    await ReleaseDesc.update({ status: "ARCHIVED" }, { where: { id: releaseId } });

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .patch(`/api/v1/releases/${releaseId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ description: "Nueva descripción", change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_ARCHIVED");
    expect(res.status).not.toBe(500);
  });
});
