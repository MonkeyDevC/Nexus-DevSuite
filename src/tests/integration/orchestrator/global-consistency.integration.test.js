/**
 * ----
 * Módulo: global-consistency.integration
 * Descripción: Valida consistencia global, replay desde ledger y escenarios de fallo.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { connectDatabase, sequelize } = require("../../../config/database");
const { loadModels, getModels } = require("../../../infrastructure/db/loadModels");
const orchestratorRepository = require("../../../modules/orchestrator/orchestrator.repository");
const scopeLockService = require("../../../modules/orchestrator/scopeLock.service");
const {
  buildGlobalStateHash,
  rebuildStateFromLedger,
  recoverOutboxFromCommittedLedger
} = require("../../../modules/orchestrator/globalConsistency.service");

const TEST_MASTER_EMAIL = "test-master-global-consistency@nexus.local";
const TEST_MASTER_PASSWORD = "TestMaster123!";
const BASE_MAJOR = 98000;

let app;
let masterToken;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resetTables() {
  const tables = [
    "audit_logs",
    "outbox_events",
    "idempotency_keys",
    "scope_locks",
    "state_transition_logs",
    "ledger_replay_state",
    "commit_ledger",
    "documentation_contents",
    "release_features",
    "releases"
  ];
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of tables) {
    await sequelize.query(`TRUNCATE TABLE \`${table}\``);
  }
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function bootstrapMasterToken() {
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
  } else if (masterUser.deleted_at) {
    await masterUser.restore();
  }
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: TEST_MASTER_EMAIL, password: TEST_MASTER_PASSWORD })
    .expect(200);
  return login.body.data.access_token;
}

async function runSameSequence() {
  await resetTables();
  const seq1 = await request(app)
    .post("/api/v1/releases")
    .set("Authorization", `Bearer ${masterToken}`)
    .set("x-dedup-key", "determinism-d1")
    .send({ name: "GC", version: `${BASE_MAJOR}.0.1`, description: "determinism-r1" })
    .expect(201);
  const seq2 = await request(app)
    .post("/api/v1/releases")
    .set("Authorization", `Bearer ${masterToken}`)
    .set("x-dedup-key", "determinism-d2")
    .send({ name: "GC", version: `${BASE_MAJOR}.0.2`, description: "determinism-r2" })
    .expect(201);
  await sleep(120);
  const commits = await orchestratorRepository.listCommittedLedgerOrdered();
  const commitSeq = commits.map((c) => Number(c.commit_seq));
  const commitHashes = commits.map((c) => (c.metadata || {}).global_state_hash || null);
  const global = await buildGlobalStateHash();
  return {
    release_ids: [seq1.body.data.id, seq2.body.data.id],
    commit_seq: commitSeq,
    commit_hashes: commitHashes,
    final_hash: global.global_state_hash
  };
}

beforeAll(async () => {
  await connectDatabase();
  loadModels(sequelize);
  app = require("../../../app").app;
  masterToken = await bootstrapMasterToken();
}, 20000);

describe("Global consistency and deterministic replay", () => {
  jest.setTimeout(25000);

  test("crash después de PREPARED: replay ignora commits no confirmados", async () => {
    await resetTables();
    await orchestratorRepository.reserveCommitLedger({
      dedup_key: `prepared-only-${Date.now()}`,
      request_id: "req-prepared-only",
      before_hash: "a".repeat(64),
      status: "PREPARED"
    });
    const replay = await rebuildStateFromLedger();
    expect(replay.replay_count).toBe(0);
  });

  test("crash después de COMMIT y antes de outbox: recovery crea evento faltante", async () => {
    await resetTables();
    const commit = await orchestratorRepository.reserveCommitLedger({
      dedup_key: `committed-no-outbox-${Date.now()}`,
      request_id: "req-commit-no-outbox",
      before_hash: "b".repeat(64),
      after_hash: "c".repeat(64),
      status: "COMMITTED",
      metadata: { global_state_hash: "c".repeat(64) }
    });
    const recovered = await recoverOutboxFromCommittedLedger();
    expect(recovered.recovered_events).toBe(1);
    const outbox = await orchestratorRepository.findOutboxByCommitLedgerId(commit.id);
    expect(outbox).toBeTruthy();
  });

  test("doble ejecución concurrente: no duplica escritura", async () => {
    await resetTables();
    const dedupKey = `same-dedup-${Date.now()}`;
    const version = `${BASE_MAJOR}.1.1`;
    const reqA = request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .set("x-scope-lock-hold-ms", "200")
      .send({ name: "GC-dedup", version, description: "same dedup A" });
    await sleep(15);
    const reqB = request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedupKey)
      .send({ name: "GC-dedup", version, description: "same dedup A" });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    expect([resA.status, resB.status].sort()).toEqual([201, 409]);
  });

  test("takeover de lock expirado permitido para nuevo owner", async () => {
    await resetTables();
    const expiredAt = new Date(Date.now() - 1000);
    const scopeKey = "releases:tenant-x:row-x";
    await orchestratorRepository.createScopeLock({
      scope_key: scopeKey,
      scope_table: "releases",
      row_id: "row-x",
      tenant_id: "tenant-x",
      owner_request_id: "owner-old",
      owner_dedup_key: "dedup-old",
      expires_at: expiredAt
    });
    await scopeLockService.acquireScopes(
      [{ table: "releases", row_id: "row-x", tenant_id: "tenant-x" }],
      "owner-new",
      "dedup-new"
    );
    const lock = await orchestratorRepository.findScopeLock(scopeKey);
    expect(lock.owner_request_id).toBe("owner-new");
  });

  test("inter-block hash mismatch marca commit como ABORTED (CRITICAL_FAIL)", async () => {
    await resetTables();
    const dedup = `bad-hash-${Date.now()}`;
    await request(app)
      .post("/api/v1/releases")
      .set("Authorization", `Bearer ${masterToken}`)
      .set("x-dedup-key", dedup)
      .set("x-expected-global-hash", "ffff".repeat(16))
      .send({ name: "GC", version: `${BASE_MAJOR}.2.1`, description: "bad expected hash" })
      .expect(201);
    let commit = null;
    for (let i = 0; i < 20; i += 1) {
      commit = await orchestratorRepository.findCommitLedgerByDedupKey(dedup);
      if (commit && commit.status === "ABORTED") break;
      await sleep(150);
    }
    expect(commit.status).toBe("ABORTED");
  });

  test("determinismo: misma secuencia dos veces produce mismo hash final y commit_seq", async () => {
    const run1 = await runSameSequence();
    const replay1 = await rebuildStateFromLedger(run1.final_hash);
    const run2 = await runSameSequence();
    const replay2 = await rebuildStateFromLedger(run2.final_hash);

    expect(run1.commit_seq).toEqual(run2.commit_seq);
    expect(run1.final_hash).toEqual(run2.final_hash);
    expect(replay1.valid).toBe(true);
    expect(replay2.valid).toBe(true);
    expect(replay1.hash_final).toEqual(replay2.hash_final);
  });
});

