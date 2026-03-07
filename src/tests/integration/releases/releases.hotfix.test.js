/**
 * Suite QA Hotfix - Subflujo formal de hotfix sobre releases RELEASED.
 * beforeAll: MASTER (y EMPLOYEE para 403); login real. Si login falla → throw Error.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const releaseRepository = require("../../../modules/releases/release.repository");
const { parseSemVer } = require("../../../modules/releases/semver.validator");

const TEST_MASTER_EMAIL = "test-master-hotfix@nexus.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-hotfix@nexus.local";
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

describe("Releases - Hotfix", () => {
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
    baseMajor = parsed ? parsed.major + 20 : 100000 + (Date.now() % 40000);
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

  test("Hotfix sobre release IN_PROGRESS devuelve 400 y RELEASE_HOTFIX_NOT_ALLOWED", async () => {
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: BASE_VERSION, description: "D" })
      .expect(201);
    const releaseId = releaseRes.body.data.id;
    const crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(200);

    const crId2 = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/hotfix`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId2 })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_HOTFIX_NOT_ALLOWED");
    expect(res.status).not.toBe(500);
  });

  test("Hotfix sobre release ARCHIVED devuelve 400 y RELEASE_ARCHIVED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Hotfix Arch " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: `${baseMajor}.0.1`, description: "R" })
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
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "ARCHIVED", change_request_id: crId })
      .expect(200);

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/hotfix`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_ARCHIVED");
    expect(res.status).not.toBe(500);
  });

  test("Hotfix sobre release inexistente devuelve 404 y RELEASE_NOT_FOUND", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ entity_type: "RELEASE", entity_id: fakeId })
      .expect(201);
    await request(app)
      .patch(`/api/v1/change-requests/${crRes.body.data.id}/submit`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/change-requests/${crRes.body.data.id}/approve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const res = await request(app)
      .post(`/api/v1/releases/${fakeId}/hotfix`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crRes.body.data.id })
      .expect(404);
    expect(res.body.error && res.body.error.code).toBe("RELEASE_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Hotfix incrementa correctamente PATCH (1.2.3 → 1.2.4)", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Hotfix Patch " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const originVersion = `${baseMajor}.1.${10000 + (Date.now() % 80000)}`;
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: originVersion, description: "Origin" })
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
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/hotfix`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(201);
    expect(res.body.success).toBe(true);
    const [major, minor, patch] = originVersion.split(".").map(Number);
    expect(res.body.data.version).toBe(`${major}.${minor}.${patch + 1}`);
    expect(res.body.data.id).not.toBe(releaseId);
    expect(res.status).not.toBe(500);
  });

  test("Hotfix crea nueva release en estado IN_PROGRESS", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Hotfix Status " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: `${baseMajor}.2.0`, description: "R" })
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
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/hotfix`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(201);
    expect(res.body.data.status).toBe("IN_PROGRESS");
    expect(res.body.data.released_at == null).toBe(true);
    expect(res.status).not.toBe(500);
  });

  test("Hotfix no copia features; nueva release tiene 0 features", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Hotfix NoCopy " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: `${baseMajor}.3.0`, description: "R" })
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
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);

    crId = await createApprovedCRForRelease(releaseId);
    const hotfixRes = await request(app)
      .post(`/api/v1/releases/${releaseId}/hotfix`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(201);
    const hotfixId = hotfixRes.body.data.id;
    const listRes = await request(app)
      .get("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .query({ status: "IN_PROGRESS" })
      .expect(200);
    const hotfixRelease = listRes.body.data.items.find((r) => r.id === hotfixId);
    expect(hotfixRelease).toBeDefined();
    const { Feature } = getModels();
    const count = await Feature.count({ where: { release_id: hotfixId } });
    expect(count).toBe(0);
    expect(hotfixRes.status).not.toBe(500);
  });

  test("Intentar hotfix con EMPLOYEE devuelve 403", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Hotfix 403 " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ version: `${baseMajor}.4.0`, description: "R" })
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
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RELEASED", change_request_id: crId })
      .expect(200);

    crId = await createApprovedCRForRelease(releaseId);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/hotfix`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ change_request_id: crId })
      .expect(403);
    expect(res.status).not.toBe(500);
  });
});
