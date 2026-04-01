/**
 * ----
 * Módulo: documentation.integration
 * Descripción: Valida CRUD documentation_contents, dedup obligatorio, scope lock e idempotencia.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const orchestratorRepository = require("../../../modules/orchestrator/orchestrator.repository");

const TEST_MASTER_EMAIL = "test-master-documentation@nexus.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";

let app;
let masterToken;
let organizationId;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  app = require("../../../app").app;

  const { User, Role, Organization, DocumentationContent } = getModels();
  const org = await Organization.findOne({ where: { slug: "default" } });
  organizationId = org ? org.id : null;

  const masterRole = await Role.findOne({ where: { name: "MASTER" } });
  let masterUser = await User.unscoped().findOne({ where: { email: TEST_MASTER_EMAIL } });
  if (!masterUser) {
    masterUser = await User.create({
      email: TEST_MASTER_EMAIL,
      password_hash: bcrypt.hashSync(TEST_MASTER_PASSWORD, 10),
      role_id: masterRole.id,
      is_active: true,
      organization_id: organizationId
    });
  }
  if (organizationId) {
    await DocumentationContent.destroy({ where: { organization_id: organizationId } });
  }

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD })
    .expect(200);
  masterToken = login.body.data.access_token;
}, 25000);

afterEach(async () => {
  const { DocumentationContent } = getModels();
  if (organizationId) {
    await DocumentationContent.destroy({ where: { organization_id: organizationId } });
  }
});

describe("Documentation API (documentation_contents)", () => {
  jest.setTimeout(25000);

  test("POST sin x-dedup-key responde 400", async () => {
    const res = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ type: "functional", content: "<p>x</p>" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("DEDUP_KEY_REQUIRED");
  });

  test("happy path: crear, listar, obtener, actualizar, eliminar", async () => {
    const dedupCreate = `doc-create-${Date.now()}`;
    const createRes = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupCreate)
      .send({
        type: "functional",
        format: "html",
        title: "Guía",
        content: "<p>v1</p>"
      })
      .expect(201);
    const id = createRes.body.data.id;
    expect(id).toBeTruthy();

    let ledger = null;
    for (let i = 0; i < 15; i += 1) {
      ledger = await orchestratorRepository.findCommitLedgerByDedupKey(dedupCreate);
      if (ledger && ledger.status === "COMMITTED") break;
      await sleep(80);
    }
    expect(ledger).toBeTruthy();
    expect(ledger.status).toBe("COMMITTED");

    const listRes = await request(app)
      .get("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.data)).toBe(true);
    expect(listRes.body.data.data.some((r) => r.id === id)).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/documentation/${id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(getRes.body.data.title).toBe("Guía");

    const dedupPatch = `doc-patch-${Date.now()}`;
    const patchRes = await request(app)
      .patch(`/api/v1/documentation/${id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupPatch)
      .send({ title: "Guía v2", content: "<p>v2</p>" })
      .expect(200);
    expect(patchRes.body.data.title).toBe("Guía v2");

    const dedupDel = `doc-del-${Date.now()}`;
    await request(app)
      .delete(`/api/v1/documentation/${id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupDel)
      .expect(200);

    await request(app)
      .get(`/api/v1/documentation/${id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(404);
  });

  test("replay idempotente con misma dedup_key y mismo body", async () => {
    const dedupKey = `doc-idem-${Date.now()}`;
    const body = { type: "technical", format: "markdown", content: "# t", title: "T" };
    const first = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .send(body)
      .expect(201);

    const replay = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .send(body)
      .expect((res) => {
        expect([200, 201, 409]).toContain(res.status);
      });

    if (replay.status === 409) {
      await sleep(150);
      const replay2 = await request(app)
        .post("/api/v1/documentation")
        .set("Authorization", `Bearer ${masterToken}`)
        .set("x-dedup-key", dedupKey)
        .send(body)
        .expect(201);
      expect(replay2.headers["x-idempotent-replay"]).toBe("true");
      expect(replay2.body.data.id).toBe(first.body.data.id);
    } else {
      expect(replay.headers["x-idempotent-replay"]).toBe("true");
      expect(replay.body.data.id).toBe(first.body.data.id);
    }
  });

  test("mismo id concurrente: segunda mutación recibe 409 SCOPE_LOCK_CONFLICT", async () => {
    const createDedup = `doc-lock-base-${Date.now()}`;
    const created = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", createDedup)
      .send({ type: "functional", content: "<p>lock</p>", title: "L" })
      .expect(201);
    const docId = created.body.data.id;

    const dedupA = `doc-lock-a-${Date.now()}`;
    const dedupB = `doc-lock-b-${Date.now()}`;
    const reqA = request(app)
      .patch(`/api/v1/documentation/${docId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupA)
      .set("x-scope-lock-hold-ms", "350")
      .send({ title: "A" });

    await sleep(20);
    const reqB = request(app)
      .patch(`/api/v1/documentation/${docId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupB)
      .send({ title: "B" });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    const codes = [resA.status, resB.status].sort();
    expect(codes).toEqual([200, 409]);
    const conflict = resA.status === 409 ? resA : resB;
    expect(conflict.body.error.code).toBe("SCOPE_LOCK_CONFLICT");
  });

  test("PATCH sin campos permitidos → 400 DOCUMENTATION_PATCH_EMPTY", async () => {
    const dedupCreate = `doc-patch-empty-setup-${Date.now()}`;
    const created = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupCreate)
      .send({ type: "technical", format: "markdown", content: "# x", title: "E" })
      .expect(201);
    const docId = created.body.data.id;

    const dedupBad = `doc-patch-empty-${Date.now()}`;
    const res = await request(app)
      .patch(`/api/v1/documentation/${docId}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupBad)
      .send({})
      .expect(400);
    expect(res.body.error.code).toBe("DOCUMENTATION_PATCH_EMPTY");
  });

  test("content demasiado grande → 400 DOCUMENTATION_CONTENT_TOO_LARGE", async () => {
    const huge = "x".repeat(500001);
    const dedup = `doc-huge-${Date.now()}`;
    const res = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedup)
      .send({ type: "functional", content: huge })
      .expect(400);
    expect(res.body.error.code).toBe("DOCUMENTATION_CONTENT_TOO_LARGE");
  });

  test("replay idempotente de error 409 DOCUMENTATION_CONFLICT", async () => {
    const dedupFirst = `doc-conflict-a-${Date.now()}`;
    await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupFirst)
      .send({ type: "functional", content: "<p>a</p>", title: "A" })
      .expect(201);

    const dedupConflict = `doc-conflict-b-${Date.now()}`;
    const body = { type: "functional", content: "<p>b</p>", title: "B" };
    const first = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupConflict)
      .send(body)
      .expect(409);
    expect(first.body.error.code).toBe("DOCUMENTATION_CONFLICT");

    await sleep(250);
    const replay = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupConflict)
      .send(body)
      .expect(409);
    expect(replay.headers["x-idempotent-replay"]).toBe("true");
    expect(replay.body.error.code).toBe("DOCUMENTATION_CONFLICT");
  });

  test("sanitiza script en content al persistir", async () => {
    const dedup = `doc-sanitize-${Date.now()}`;
    const res = await request(app)
      .post("/api/v1/documentation")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedup)
      .send({
        type: "technical",
        format: "html",
        content: '<p>ok</p><script>alert(1)</script>',
        title: "S"
      })
      .expect(201);
    const id = res.body.data.id;
    const getRes = await request(app)
      .get(`/api/v1/documentation/${id}`)
      .set("Authorization", `Bearer ${masterToken}`)
      .expect(200);
    expect(getRes.body.data.content).not.toMatch(/<script/i);
  });
});
