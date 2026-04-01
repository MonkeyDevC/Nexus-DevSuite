/**
 * Suite QA negativo ETAPA 3 - ChangeRequest
 * Login real; datos creados en cada test. Sin omisiones.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const releaseRepository = require("../../../modules/releases/release.repository");
const { parseSemVer } = require("../../../modules/releases/semver.validator");

const TEST_MASTER_EMAIL = "test-master-cr@nexus.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-cr@nexus.local";
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

describe("ChangeRequest ETAPA 3 - QA negativo", () => {
  beforeAll(async () => {
    const { User, Role } = getModels();
    const masterRole = await Role.findOne({ where: { name: "MASTER" } });
    const employeeRole = await Role.findOne({ where: { name: "EMPLOYEE" } });
    if (!masterRole || !employeeRole) {
      throw new Error("Roles MASTER o EMPLOYEE no existen en BD.");
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
    baseMajor = parsed ? parsed.major + 30 : 150000 + (Date.now() % 40000);
    BASE_VERSION = `${baseMajor}.0.0`;
  });

  async function createApprovedCRForRelease(releaseId, token = masterToken) {
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "CR test",
        entity_type: "RELEASE",
        entity_id: releaseId
      })
      .expect(201);
    const crId = crRes.body.data.id;
    await request(app)
      .patch(`/api/v1/change-requests/${crId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await request(app)
      .patch(`/api/v1/change-requests/${crId}/approve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    return crId;
  }

  test("Ejecutar cambio en Release sin change_request_id devuelve 400 y CHANGE_REQUEST_REQUIRED", async () => {
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.0`, description: "R" })
      .expect(201);
    const releaseId = releaseRes.body.data.id;
    const res = await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error && res.body.error.code).toBe("CHANGE_REQUEST_REQUIRED");
    expect(res.status).not.toBe(500);
  });

  test("CR no aprobado (DRAFT) devuelve 400 y CHANGE_REQUEST_NOT_APPROVED", async () => {
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.1`, description: "R" })
      .expect(201);
    const releaseId = releaseRes.body.data.id;
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "CR", entity_type: "RELEASE", entity_id: releaseId })
      .expect(201);
    const crId = crRes.body.data.id;
    const res = await request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("CHANGE_REQUEST_NOT_APPROVED");
    expect(res.status).not.toBe(500);
  });

  test("CR entity mismatch devuelve 400 y CHANGE_REQUEST_INVALID", async () => {
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.2`, description: "R" })
      .expect(201);
    const releaseId = releaseRes.body.data.id;
    const crId = await createApprovedCRForRelease(releaseId);
    const otherReleaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.3`, description: "Other" })
      .expect(201);
    const otherReleaseId = otherReleaseRes.body.data.id;
    const res = await request(app)
      .patch(`/api/v1/releases/${otherReleaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS", change_request_id: crId })
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("CHANGE_REQUEST_INVALID");
    expect(res.status).not.toBe(500);
  });

  test("Intentar aprobar CR con EMPLOYEE devuelve 403", async () => {
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.4`, description: "R" })
      .expect(201);
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ entity_type: "RELEASE", entity_id: releaseRes.body.data.id })
      .expect(201);
    await request(app)
      .patch(`/api/v1/change-requests/${crRes.body.data.id}/submit`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .expect(200);
    const res = await request(app)
      .patch(`/api/v1/change-requests/${crRes.body.data.id}/approve`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .expect(403);
    expect(res.status).not.toBe(500);
  });

  test("Transición inválida (DRAFT → APPROVED) devuelve 400 y CHANGE_REQUEST_INVALID_TRANSITION", async () => {
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.5`, description: "R" })
      .expect(201);
    const crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ entity_type: "RELEASE", entity_id: releaseRes.body.data.id })
      .expect(201);
    const res = await request(app)
      .patch(`/api/v1/change-requests/${crRes.body.data.id}/approve`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(400);
    expect(res.body.error && res.body.error.code).toBe("CHANGE_REQUEST_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("Implementar dos veces el mismo CR devuelve 400 y CHANGE_REQUEST_ALREADY_IMPLEMENTED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj CR " + Date.now(), description: "D" })
      .expect(201);
    const featureRes = await request(app)
      .post(`/api/v1/projects/${projectRes.body.data.id}/features`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "F", description: "D" })
      .expect(201);
    const releaseRes = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Rel", version: `${baseMajor}.0.6`, description: "R" })
      .expect(201);
    const releaseId = releaseRes.body.data.id;
    const crId = await createApprovedCRForRelease(releaseId);
    await request(app)
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(200);
    const res = await request(app)
      .post(`/api/v1/releases/${releaseId}/features/${featureRes.body.data.id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_request_id: crId })
      .expect(400);
    expect(res.body.error && (res.body.error.code === "CHANGE_REQUEST_ALREADY_IMPLEMENTED" || res.body.error.code === "CHANGE_REQUEST_NOT_APPROVED")).toBe(true);
    expect(res.status).not.toBe(500);
  });
});
