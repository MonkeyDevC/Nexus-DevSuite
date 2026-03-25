/**
 * ----
 * Módulo: scope-locks.integration
 * Descripción: Valida aislamiento de scopes, conflictos y coexistencia con idempotencia.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const releaseRepository = require("../../../modules/releases/release.repository");
const { parseSemVer } = require("../../../modules/releases/semver.validator");

const TEST_MASTER_EMAIL = "test-master-concurrency@nexus.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";

let app;
let masterToken;
let baseMajor;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createApprovedCRForRelease(releaseId) {
  let crRes;
  for (let i = 0; i < 5; i += 1) {
    crRes = await request(app)
      .post("/api/v1/change-requests")
      .set("Authorization", `Bearer ${masterToken}`)
      .send({ title: `CR Scope ${Date.now()}-${i}`, entity_type: "RELEASE", entity_id: releaseId });
    if (crRes.status === 201) break;
    await sleep(30);
  }
  if (!crRes || crRes.status !== 201) {
    throw new Error(`No fue posible crear CR aprobado para release ${releaseId}`);
  }
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

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  app = require("../../../app").app;

  const { User, Role } = getModels();
  const masterRole = await Role.findOne({ where: { name: "MASTER" } });
  let masterUser = await User.unscoped().findOne({ where: { email: TEST_MASTER_EMAIL } });
  if (!masterUser) {
    masterUser = await User.create({
      email: TEST_MASTER_EMAIL,
      password_hash: bcrypt.hashSync(TEST_MASTER_PASSWORD, 10),
      role_id: masterRole.id,
      is_active: true
    });
  }
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD })
    .expect(200);
  masterToken = login.body.data.access_token;

  const latest = await releaseRepository.findLatestReleased();
  const parsed = latest ? parseSemVer(latest.version) : null;
  baseMajor = parsed ? parsed.major + 50 : 90000 + (Date.now() % 5000);
}, 20000);

describe("Scope lock concurrency", () => {
  jest.setTimeout(20000);
  test("mismo row: segunda request queda bloqueada por conflicto", async () => {
    const createRelease = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", `dedup-lock-r1-${Date.now()}`)
      .send({ version: `${baseMajor}.0.${Date.now() % 900000}`, description: "R1" })
      .expect(201);
    const releaseId = createRelease.body.data.id;

    const crIdA = await createApprovedCRForRelease(releaseId);
    const crIdB = await createApprovedCRForRelease(releaseId);

    const reqA = request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", `dedup-status-a-${Date.now()}`)
      .set("x-scope-lock-hold-ms", "350")
      .send({ status: "IN_PROGRESS", change_request_id: crIdA });

    await sleep(20);
    const reqB = request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", `dedup-status-b-${Date.now()}`)
      .send({ status: "IN_PROGRESS", change_request_id: crIdB });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    const statusCodes = [resA.status, resB.status].sort();
    expect(statusCodes).toEqual([200, 409]);
    const conflict = resA.status === 409 ? resA : resB;
    expect(conflict.body.error.code).toBe("SCOPE_LOCK_CONFLICT");
  });

  test("distinto row: paralelismo permitido", async () => {
    const releaseA = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", `dedup-par-a-${Date.now()}`)
      .send({ version: `${baseMajor}.1.${Date.now() % 900000}`, description: "RA" })
      .expect(201);
    const releaseB = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", `dedup-par-b-${Date.now()}`)
      .send({ version: `${baseMajor}.2.${Date.now() % 900000}`, description: "RB" })
      .expect(201);

    const [crA, crB] = await Promise.all([
      createApprovedCRForRelease(releaseA.body.data.id),
      createApprovedCRForRelease(releaseB.body.data.id)
    ]);

    const [resA, resB] = await Promise.all([
      request(app)
        .patch(`/api/v1/releases/${releaseA.body.data.id}/status`)
        .set("Authorization", `Bearer ${masterToken}`)
        .set("x-dedup-key", `dedup-par-status-a-${Date.now()}`)
        .send({ status: "IN_PROGRESS", change_request_id: crA }),
      request(app)
        .patch(`/api/v1/releases/${releaseB.body.data.id}/status`)
        .set("Authorization", `Bearer ${masterToken}`)
        .set("x-dedup-key", `dedup-par-status-b-${Date.now()}`)
        .send({ status: "IN_PROGRESS", change_request_id: crB })
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
  });

  test("reintento con dedup_key no duplica", async () => {
    const dedupKey = `dedup-retry-${Date.now()}`;
    const version = `${baseMajor}.3.${Date.now() % 900000}`;
    const first = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .send({ version, description: "retry test" })
      .expect(201);

    const replay = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .send({ version, description: "retry test" })
      .expect((res) => {
        expect([201, 409]).toContain(res.status);
      });

    if (replay.status === 409) {
      await sleep(150);
      const replay2 = await request(app)
        .post("/api/v1/releases")
        .set("Authorization", `Bearer ${masterToken}`)
        .set("x-dedup-key", dedupKey)
        .send({ version, description: "retry test" })
        .expect(201);
      expect(replay2.headers["x-idempotent-replay"]).toBe("true");
      expect(first.body.data.id).toBe(replay2.body.data.id);
    } else {
      expect(replay.headers["x-idempotent-replay"]).toBe("true");
      expect(first.body.data.id).toBe(replay.body.data.id);
    }
  });

  test("idempotency + lock: solicitud concurrente con mismo dedup_key no duplica", async () => {
    const release = await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", `dedup-lock-base-${Date.now()}`)
      .send({ version: `${baseMajor}.4.${Date.now() % 900000}`, description: "R lock idem" })
      .expect(201);
    const releaseId = release.body.data.id;

    const crA = await createApprovedCRForRelease(releaseId);
    const crB = await createApprovedCRForRelease(releaseId);
    const dedupKey = `dedup-shared-${Date.now()}`;

    const reqA = request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .set("x-scope-lock-hold-ms", "250")
      .send({ status: "IN_PROGRESS", change_request_id: crA });
    await sleep(20);
    const reqB = request(app)
      .patch(`/api/v1/releases/${releaseId}/status`)
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .send({ status: "IN_PROGRESS", change_request_id: crB });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    const ok = resA.status === 200 ? resA : resB;
    const conflict = resA.status === 409 ? resA : resB;
    expect(ok.status).toBe(200);
    expect(conflict.status).toBe(409);
    expect(["IDEMPOTENCY_IN_PROGRESS", "SCOPE_LOCK_CONFLICT"]).toContain(conflict.body.error.code);
  });
});

