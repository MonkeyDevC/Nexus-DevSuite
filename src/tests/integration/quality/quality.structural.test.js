/**
 * Suite QA estructural (smoke) — ETAPA 6 Sistema de calidad interno
 * Verifica que la aplicación responde y que los módulos críticos están montados.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");

const TEST_MASTER_EMAIL = "test-master-quality@nexus-etapa6.local";
const TEST_MASTER_PASSWORD = "TestMasterQuality123!";

let app;
let masterToken;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Quality structural (smoke)", () => {
  beforeAll(async () => {
    const { User, Role } = getModels();
    const masterRole = await Role.findOne({ where: { name: "MASTER" } });
    if (!masterRole) throw new Error("Rol MASTER no existe en BD.");

    let masterUser = await User.unscoped().findOne({ where: { email: TEST_MASTER_EMAIL } });
    if (!masterUser) {
      masterUser = await User.create({
        email: TEST_MASTER_EMAIL,
        password_hash: bcrypt.hashSync(TEST_MASTER_PASSWORD, 10),
        role_id: masterRole.id,
        is_active: true
      });
    }

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD });
    if (loginRes.status !== 200 || !loginRes.body.data?.access_token) {
      throw new Error(`Login MASTER falló: ${JSON.stringify(loginRes.body)}`);
    }
    masterToken = loginRes.body.data.access_token;
  });

  test("GET /health → 200 con body success según contrato", async () => {
    const res = await request(app).get("/api/v1/health").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.request_id).toBeDefined();
  });

  test("POST /api/v1/auth/login con credenciales inválidas → 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "invalid@test.local", password: "wrongpassword" })
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBeDefined();
  });

  test("GET /api/v1/reports/audit sin token → 401", async () => {
    const res = await request(app).get("/api/v1/reports/audit").expect(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/v1/system/metrics con token MASTER → 200", async () => {
    const res = await request(app)
      .get("/api/v1/system/metrics")
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.scope).toBe("instance");
    expect(typeof res.body.data.total_requests).toBe("number");
    expect(typeof res.body.data.total_errors).toBe("number");
    expect(typeof res.body.data.auth_failures).toBe("number");
    expect(typeof res.body.data.refresh_failures).toBe("number");
  });
});
