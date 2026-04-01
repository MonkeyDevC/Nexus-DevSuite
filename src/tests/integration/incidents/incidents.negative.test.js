/**
 * Suite QA negativo ETAPA 3 - Incidents
 * Sin omisiones. MASTER y EMPLOYEE creados en BD; login real.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-incidents@nexus-etapa3.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-incidents@nexus-etapa3.local";
const TEST_EMPLOYEE_PASSWORD = "TestEmployee123!";

let app;
let masterToken;
let employeeToken;

function incidentCreateBody(overrides = {}) {
  return {
    title: "Inc " + Date.now(),
    severity: "MEDIUM",
    priority: "MEDIUM",
    ...overrides
  };
}

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Incidents ETAPA 3 - QA negativo", () => {
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

  test("Crear incidente en proyecto inexistente devuelve 404", async () => {
    const fakeProjectId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/v1/projects/${fakeProjectId}/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(incidentCreateBody({ title: "Incident 1", description: "Test" }))
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("PROJECT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Transición inválida OPEN → CLOSED devuelve 400 INCIDENT_INVALID_TRANSITION", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Inc Trans " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const incidentRes = await request(app)
      .post(`/api/v1/projects/${projectId}/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(incidentCreateBody({ title: "Inc Trans " + Date.now() }))
      .expect(201);
    const incidentId = incidentRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("INCIDENT_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE intenta cerrar incidente (RESOLVED → CLOSED) devuelve 403", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Inc Emp " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const incidentRes = await request(app)
      .post(`/api/v1/projects/${projectId}/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(incidentCreateBody({ title: "Inc Emp " + Date.now() }))
      .expect(201);
    const incidentId = incidentRes.body.data.id;

    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RESOLVED", root_cause_analysis: "RCA" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "CLOSED" })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("INCIDENT_CLOSE_MASTER_ONLY");
    expect(res.status).not.toBe(500);
  });

  test("MASTER cierra incidente con root_cause → 200", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Inc Close " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const incidentRes = await request(app)
      .post(`/api/v1/projects/${projectId}/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(incidentCreateBody({ title: "Inc Close " + Date.now() }))
      .expect(201);
    const incidentId = incidentRes.body.data.id;

    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ root_cause_analysis: "Causa raíz" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RESOLVED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.status).toBe("CLOSED");
    expect(res.body.data?.closed_at).toBeDefined();
    expect(res.status).not.toBe(500);
  });

  test("Actualizar incidente CLOSED devuelve 400 INCIDENT_CLOSED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Inc Patch " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const incidentRes = await request(app)
      .post(`/api/v1/projects/${projectId}/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(incidentCreateBody({ title: "Inc Patch " + Date.now() }))
      .expect(201);
    const incidentId = incidentRes.body.data.id;

    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ root_cause_analysis: "RCA" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RESOLVED" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ assigned_to: null })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("INCIDENT_CLOSED");
    expect(res.status).not.toBe(500);
  });

  test("Cerrar sin root_cause_analysis devuelve 400 INCIDENT_ROOT_CAUSE_REQUIRED", async () => {
    const projectRes = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ name: "Proj Inc RCA " + Date.now(), description: "D" })
      .expect(201);
    const projectId = projectRes.body.data.id;

    const incidentRes = await request(app)
      .post(`/api/v1/projects/${projectId}/incidents`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send(incidentCreateBody({ title: "Inc RCA " + Date.now() }))
      .expect(201);
    const incidentId = incidentRes.body.data.id;

    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);
    await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "RESOLVED" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "CLOSED" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("INCIDENT_ROOT_CAUSE_REQUIRED");
    expect(res.status).not.toBe(500);
  });

  test("Incidente inexistente devuelve 404", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/incidents/${fakeId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("INCIDENT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });
});
