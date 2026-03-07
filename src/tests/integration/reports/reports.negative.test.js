/**
 * Suite QA negativo ETAPA 5 - Reports (Trazabilidad y reportes)
 * MASTER y EMPLOYEE; login real. Sin omisiones.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-reports@nexus-etapa5.local";
const TEST_MASTER_PASSWORD = "TestMasterReports123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-reports@nexus-etapa5.local";
const TEST_EMPLOYEE_PASSWORD = "TestEmployeeReports123!";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

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

describe("Reports ETAPA 5 - QA negativo", () => {
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

  test("GET /reports/projects/:projectId/summary con projectId inexistente → 404 PROJECT_NOT_FOUND", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/projects/${FAKE_UUID}/summary`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("PROJECT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("GET /reports/sprints/:sprintId/summary con sprintId inexistente → 404 SPRINT_NOT_FOUND", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/sprints/${FAKE_UUID}/summary`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("SPRINT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("GET /reports/users/:userId/activity con userId inexistente → 404 NOT_FOUND", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/users/${FAKE_UUID}/activity`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE pide activity de otro usuario → 403 AUTH_FORBIDDEN", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/users/${masterUserId}/activity`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("AUTH_FORBIDDEN");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE pide GET /reports/audit → 403 AUTH_FORBIDDEN", async () => {
    const res = await request(app)
      .get("/api/v1/reports/audit")
      .set("Authorization", `Bearer ${employeeToken}`)
      .query({ page: 1, limit: 10 })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("AUTH_FORBIDDEN");
    expect(res.status).not.toBe(500);
  });

  test("MASTER GET /reports/audit → 200", async () => {
    const res = await request(app)
      .get("/api/v1/reports/audit")
      .set("Authorization", `Bearer ${masterToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.auditLogs).toBeDefined();
    expect(Array.isArray(res.body.data.auditLogs)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.status).not.toBe(500);
  });

  test("Sin token → 401", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/projects/${FAKE_UUID}/summary`)
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.status).not.toBe(500);
  });
});
