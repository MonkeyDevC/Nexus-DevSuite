/**
 * Suite QA seguridad — Autenticación y autorización
 * (a) Endpoint protegido sin token → 401
 * (b) Endpoint MASTER-only con token EMPLOYEE → 403
 * (c) GET /users/:id con ID de otro usuario (manipulación) → 403 o 404 según política
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-security@nexus-qa.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-security@nexus-qa.local";
const TEST_EMPLOYEE_PASSWORD = "TestEmployee123!";

let app;
let masterToken;
let employeeToken;
let masterUserId;
let employeeUserId;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("QA Seguridad", () => {
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
    masterUserId = masterUser.id;

    let employeeUser = await User.unscoped().findOne({ where: { email: TEST_EMPLOYEE_EMAIL } });
    if (!employeeUser) {
      employeeUser = await User.create({
        email: TEST_EMPLOYEE_EMAIL,
        password_hash: bcrypt.hashSync(TEST_EMPLOYEE_PASSWORD, 10),
        role_id: employeeRole.id,
        is_active: true
      });
    }
    employeeUserId = employeeUser.id;

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

  test("(a) GET endpoint protegido sin token devuelve 401", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBeDefined();
  });

  test("(b) GET endpoint MASTER-only con token EMPLOYEE devuelve 403", async () => {
    const res = await request(app)
      .get("/api/v1/system/metrics")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBeDefined();
  });

  test("(c) GET /users/:id con ID de otro usuario (EMPLOYEE pide MASTER) devuelve 403 o 404", async () => {
    const res = await request(app)
      .get(`/api/v1/users/${masterUserId}`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect([403, 404]).toContain(res.status);
    if (res.status === 403 || res.status === 404) {
      expect(res.body.success).toBe(false);
    }
  });
});
