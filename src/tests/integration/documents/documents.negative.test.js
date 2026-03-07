/**
 * Suite QA negativo ETAPA 4 - Documents (Sistema documental ISO)
 * MASTER y EMPLOYEE; login real. Sin omisiones.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-documents@nexus-etapa4.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const TEST_EMPLOYEE_EMAIL = "test-employee-documents@nexus-etapa4.local";
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

describe("Documents ETAPA 4 - QA negativo", () => {
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

  test("Crear documento con code duplicado devuelve 409 DOCUMENT_CODE_ALREADY_EXISTS", async () => {
    const code = "DOC-QA-DUP-" + Date.now();
    await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code, title: "Doc 1", description: "D" })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code, title: "Doc 2", description: "D" })
      .expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_CODE_ALREADY_EXISTS");
    expect(res.status).not.toBe(500);
  });

  test("Documento inexistente devuelve 404 DOCUMENT_NOT_FOUND", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/documents/${fakeId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Crear versión en documento inexistente devuelve 404", async () => {
    const fakeDocId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .post(`/api/v1/documents/${fakeDocId}/versions`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ change_reason: "R", content: "C" })
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("Transición inválida DRAFT → ARCHIVED devuelve 400 DOCUMENT_VERSION_INVALID_TRANSITION", async () => {
    const createRes = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code: "DOC-TRANS-" + Date.now(), title: "T" })
      .expect(201);
    const documentId = createRes.body.data.id;
    const listRes = await request(app).get(`/api/v1/documents/${documentId}/versions`).set("Authorization", `Bearer ${masterToken}`).expect(200);
    const versionId = listRes.body.data.data[0].id;

    const res = await request(app)
      .patch(`/api/v1/documents/${documentId}/versions/${versionId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "ARCHIVED" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_VERSION_INVALID_TRANSITION");
    expect(res.status).not.toBe(500);
  });

  test("EMPLOYEE intenta aprobar versión (DRAFT → APPROVED) devuelve 403", async () => {
    const createRes = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ code: "DOC-EMP-" + Date.now(), title: "T" })
      .expect(201);
    const documentId = createRes.body.data.id;
    const versionsRes = await request(app)
      .get(`/api/v1/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .expect(200);
    const versionId = versionsRes.body.data.data[0].id;

    const res = await request(app)
      .patch(`/api/v1/documents/${documentId}/versions/${versionId}/status`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ status: "APPROVED", change_reason: "R" })
      .expect(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_APPROVE_MASTER_ONLY");
    expect(res.status).not.toBe(500);
  });

  test("MASTER aprueba versión con change_reason → 200", async () => {
    const createRes = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code: "DOC-APPROVE-" + Date.now(), title: "T" })
      .expect(201);
    const documentId = createRes.body.data.id;
    const versionsRes = await request(app)
      .get(`/api/v1/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const versionId = versionsRes.body.data.data[0].id;

    const res = await request(app)
      .patch(`/api/v1/documents/${documentId}/versions/${versionId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED", change_reason: "Primera aprobación" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.status).toBe("APPROVED");
    expect(res.status).not.toBe(500);
  });

  test("Modificar versión APPROVED devuelve 400 DOCUMENT_VERSION_IMMUTABLE", async () => {
    const createRes = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code: "DOC-IMMUT-" + Date.now(), title: "T" })
      .expect(201);
    const documentId = createRes.body.data.id;
    const versionsRes = await request(app)
      .get(`/api/v1/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const versionId = versionsRes.body.data.data[0].id;
    await request(app)
      .patch(`/api/v1/documents/${documentId}/versions/${versionId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED", change_reason: "R" })
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/documents/${documentId}/versions/${versionId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ content: "Nuevo contenido" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_VERSION_IMMUTABLE");
    expect(res.status).not.toBe(500);
  });

  test("Versión inexistente devuelve 404 DOCUMENT_VERSION_NOT_FOUND", async () => {
    const createRes = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code: "DOC-404-" + Date.now(), title: "T" })
      .expect(201);
    const documentId = createRes.body.data.id;
    const fakeVersionId = "00000000-0000-0000-0000-000000000000";

    const res = await request(app)
      .get(`/api/v1/documents/${documentId}/versions/${fakeVersionId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_VERSION_NOT_FOUND");
    expect(res.status).not.toBe(500);
  });

  test("DRAFT → APPROVED sin change_reason devuelve 400 DOCUMENT_CHANGE_REASON_REQUIRED", async () => {
    const createRes = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ code: "DOC-NOREA-" + Date.now(), title: "T" })
      .expect(201);
    const documentId = createRes.body.data.id;
    const versionsRes = await request(app)
      .get(`/api/v1/documents/${documentId}/versions`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    const versionId = versionsRes.body.data.data[0].id;

    const res = await request(app)
      .patch(`/api/v1/documents/${documentId}/versions/${versionId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ status: "APPROVED" })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("DOCUMENT_CHANGE_REASON_REQUIRED");
    expect(res.status).not.toBe(500);
  });
});
