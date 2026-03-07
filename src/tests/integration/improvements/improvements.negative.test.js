/**
 * Suite QA negativo ETAPA 3 - Improvements
 * Sin omisiones. MASTER y EMPLOYEE creados en BD; login real.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-improvements@nexus-etapa3.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-improvements@nexus-etapa3.local";
const TEST_EMPLOYEE_PASSWORD = "TestEmployee123!";

let app;
let masterToken;
let employeeToken;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Improvements ETAPA 3 - QA negativo", () => {
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

  test("Improvement inexistente devuelve 404", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/improvements/${fakeId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("IMPROVEMENT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Transición inválida DRAFT → APPROVED devuelve 400 IMPROVEMENT_INVALID_TRANSITION", async () => {
    const createRes = await request(app)
      .post("/api/v1/improvements")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Imp Trans " + Date.now(), description: "D" })
      .expect(201);
    const improvementId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("IMPROVEMENT_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE intenta aprobar (PROPOSED → APPROVED) devuelve 403", async () => {
    const createRes = await request(app)
      .post("/api/v1/improvements")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ title: "Imp Emp " + Date.now(), description: "D" })
      .expect(201);
    const improvementId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "PROPOSED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "APPROVED" })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("IMPROVEMENT_APPROVE_MASTER_ONLY");
    expect(res.status).not.toBe(500);
  });

  test("MASTER aprueba mejora → 200", async () => {
    const createRes = await request(app)
      .post("/api/v1/improvements")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Imp Approve " + Date.now(), description: "D" })
      .expect(201);
    const improvementId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "PROPOSED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.status).toBe("APPROVED");
    expect(res.status).not.toBe(500);
  });

  test("Cambio de status en IMPLEMENTED devuelve 400 IMPROVEMENT_CLOSED", async () => {
    const createRes = await request(app)
      .post("/api/v1/improvements")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Imp Closed " + Date.now(), description: "D" })
      .expect(201);
    const improvementId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "PROPOSED" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IMPLEMENTED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "DRAFT" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("IMPROVEMENT_CLOSED");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE intenta marcar IMPLEMENTED devuelve 403", async () => {
    const createRes = await request(app)
      .post("/api/v1/improvements")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: "Imp Impl " + Date.now(), description: "D" })
      .expect(201);
    const improvementId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "PROPOSED" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/improvements/${improvementId}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "IMPLEMENTED" })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("IMPROVEMENT_APPROVE_MASTER_ONLY");
    expect(res.status).not.toBe(500);
  });
});
