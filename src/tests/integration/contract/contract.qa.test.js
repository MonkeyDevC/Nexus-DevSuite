/**
 * Suite QA contrato API — Response Layer v1
 * Verifica header X-Response-Version: 1 en respuestas exitosas y de error.
 */

const request = require("supertest");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels } = require("../../../infrastructure/db/loadModels");

let app;

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  const appModule = require("../../../app");
  app = appModule.app;
}, 15000);

describe("Contrato API — X-Response-Version", () => {
  test("Respuesta 200 incluye X-Response-Version: 1", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-response-version"]).toBe("1");
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.meta?.request_id).toBeDefined();
  });

  test("Respuesta 4xx incluye X-Response-Version: 1", async () => {
    const res = await request(app)
      .get("/api/v1/users/00000000-0000-0000-0000-000000000001")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
    expect(res.headers["x-response-version"]).toBe("1");
  });
});
