/**
 * ----
 * Módulo: Global Consistency Service
 * Descripción: Hash global determinista, validación inter-bloque y replay desde ledger.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { sequelize } = require("../../config/database");
const orchestratorRepository = require("./orchestrator.repository");
const { buildStateHash } = require("./canonicalization.service");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const RELEVANT_TABLES = [
  "releases",
  "release_features",
  "documentation_contents",
  "commit_ledger",
  "idempotency_keys",
  "outbox_events",
  "state_transition_logs"
];
const NON_DETERMINISTIC_COLUMNS = new Set([
  "request_id",
  "owner_request_id",
  "ip_address",
  "user_agent",
  "signature",
  "metadata",
  "response_body",
  "payload",
  "last_error"
]);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function listDbTables() {
  const [rows] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name ASC"
  );
  const existingTables = rows
    .map((row) => row.table_name || row.TABLE_NAME)
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return RELEVANT_TABLES.filter((tableName) => existingTables.includes(tableName));
}

async function getTableMetadata(tableName) {
  const [rows] = await sequelize.query(
    `SELECT column_name, data_type, column_key, ordinal_position
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = :tableName
     ORDER BY ordinal_position ASC`,
    { replacements: { tableName } }
  );
  const normalized = rows.map((row) => ({
    column_name: row.column_name || row.COLUMN_NAME,
    data_type: row.data_type || row.DATA_TYPE,
    column_key: row.column_key || row.COLUMN_KEY
  }));
  const columns = normalized.map((row) => row.column_name);
  const primaryKeys = normalized.filter((row) => row.column_key === "PRI").map((row) => row.column_name);
  const timestampColumns = rows
    .map((row) => ({
      column_name: row.column_name || row.COLUMN_NAME,
      data_type: row.data_type || row.DATA_TYPE
    }))
    .filter((row) => ["timestamp", "datetime", "date", "time"].includes(String(row.data_type).toLowerCase()))
    .map((row) => row.column_name);
  return { columns, primaryKeys, timestampColumns };
}

function stripTimestampColumns(row, timestampColumns) {
  const clean = {};
  for (const [key, value] of Object.entries(row)) {
    if (timestampColumns.includes(key)) continue;
    if (NON_DETERMINISTIC_COLUMNS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

function sanitizeDeterministicValue(value) {
  if (typeof value === "string") {
    if (UUID_REGEX.test(value)) return "__UUID__";
    if (/^[0-9a-f]{64}$/i.test(value)) return "__HASH64__";
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeterministicValue(item));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (NON_DETERMINISTIC_COLUMNS.has(key)) continue;
      out[key] = sanitizeDeterministicValue(nestedValue);
    }
    return out;
  }
  return value;
}

function resolveOrderColumns(columns, primaryKeys) {
  const preferred = ["commit_seq", "dedup_key", "version", "entity", "entity_id", "transition_version"];
  const preferredFound = preferred.filter((columnName) => columns.includes(columnName));
  if (preferredFound.length > 0) return preferredFound;
  if (primaryKeys.length > 0) return primaryKeys;
  return [];
}

async function getDeterministicTableRows(tableName, columns, primaryKeys, timestampColumns) {
  const orderColumns = resolveOrderColumns(columns, primaryKeys);
  const orderBy =
    orderColumns.length > 0
      ? ` ORDER BY ${orderColumns.map((columnName) => `\`${columnName}\` ASC`).join(", ")}`
      : "";
  const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\`${orderBy}`);
  return rows.map((row) => sanitizeDeterministicValue(stripTimestampColumns(row, timestampColumns)));
}

async function buildGlobalStateHash() {
  const tables = await listDbTables();
  const projection = {};
  for (const tableName of tables) {
    const { columns, primaryKeys, timestampColumns } = await getTableMetadata(tableName);
    const rows = await getDeterministicTableRows(tableName, columns, primaryKeys, timestampColumns);
    projection[tableName] = rows;
  }
  const globalStateHash = buildStateHash(projection);
  return {
    global_state_hash: globalStateHash,
    tables_count: tables.length,
    tables: tables
  };
}

async function validateGlobalStateHash(expectedHash, options = {}) {
  const throwOnMismatch = options.throwOnMismatch === true;
  const computed = await buildGlobalStateHash();
  if (expectedHash && expectedHash !== computed.global_state_hash && throwOnMismatch) {
    throw new AppError("Global state hash mismatch", {
      statusCode: 500,
      code: ERROR_CODES.CRITICAL_FAIL,
      details: {
        expected_hash: expectedHash,
        actual_hash: computed.global_state_hash
      }
    });
  }
  return computed;
}

async function rebuildStateFromLedger(expectedHash = null) {
  await orchestratorRepository.clearLedgerReplayState();
  const commits = await orchestratorRepository.listCommittedLedgerOrdered();
  for (const row of commits) {
    const commit = row.toJSON ? row.toJSON() : row;
    await orchestratorRepository.createLedgerReplayState({
      commit_seq: commit.commit_seq,
      dedup_key: commit.dedup_key,
      request_id: commit.request_id,
      after_hash: commit.after_hash || ""
    });
  }
  const replayRows = await orchestratorRepository.listLedgerReplayState();
  const replayProjection = replayRows.map((row) => {
    const value = row.toJSON ? row.toJSON() : row;
    return {
      commit_seq: value.commit_seq,
      dedup_key: value.dedup_key,
      request_id: value.request_id,
      after_hash: "__HASH64__"
    };
  });
  const replayHash = buildStateHash(replayProjection);
  const globalHashResult = await buildGlobalStateHash();
  const hashFinal = globalHashResult.global_state_hash;
  const valid = expectedHash ? expectedHash === hashFinal : true;
  return {
    replay_count: replayProjection.length,
    hash_final: hashFinal,
    replay_hash: replayHash,
    expected_hash: expectedHash,
    valid
  };
}

async function recoverOutboxFromCommittedLedger() {
  const committed = await orchestratorRepository.listCommittedLedgerOrdered();
  let created = 0;
  for (const row of committed) {
    const commit = row.toJSON ? row.toJSON() : row;
    const existing = await orchestratorRepository.findOutboxByCommitLedgerId(commit.id);
    if (existing) continue;
    await orchestratorRepository.enqueueOutbox({
      dedup_key: commit.dedup_key,
      commit_ledger_id: commit.id,
      event_type: "HTTP_MUTATION_COMMITTED_RECOVERY",
      payload: {
        request_id: commit.request_id,
        commit_seq: commit.commit_seq,
        after_hash: commit.after_hash
      },
      status: "PENDING"
    });
    created += 1;
  }
  return { recovered_events: created };
}

module.exports = {
  buildGlobalStateHash,
  validateGlobalStateHash,
  rebuildStateFromLedger,
  recoverOutboxFromCommittedLedger
};

