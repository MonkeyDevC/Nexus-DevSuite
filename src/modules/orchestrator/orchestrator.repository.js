/**
 * ----
 * Módulo: Orchestrator Repository
 * Descripción: Persistencia de idempotencia, ledger, outbox y state transitions.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { Op } = require("sequelize");
const { getModels } = require("../../infrastructure/db/loadModels");

function getOrchestratorModels() {
  const { IdempotencyKey, CommitLedger, OutboxEvent, StateTransitionLog, ScopeLock, LedgerReplayState } = getModels();
  return { IdempotencyKey, CommitLedger, OutboxEvent, StateTransitionLog, ScopeLock, LedgerReplayState };
}

async function findIdempotencyByDedupKey(dedupKey) {
  const { IdempotencyKey } = getOrchestratorModels();
  return IdempotencyKey.findOne({ where: { dedup_key: dedupKey } });
}

async function reserveIdempotency(payload) {
  const { IdempotencyKey } = getOrchestratorModels();
  return IdempotencyKey.create(payload);
}

async function updateIdempotency(dedupKey, payload) {
  const { IdempotencyKey } = getOrchestratorModels();
  await IdempotencyKey.update(payload, { where: { dedup_key: dedupKey } });
  return findIdempotencyByDedupKey(dedupKey);
}

async function reserveCommitLedger(payload) {
  const { CommitLedger } = getOrchestratorModels();
  return CommitLedger.create(payload);
}

async function findCommitLedgerByDedupKey(dedupKey) {
  const { CommitLedger } = getOrchestratorModels();
  return CommitLedger.findOne({ where: { dedup_key: dedupKey } });
}

async function findCommitLedgerById(id) {
  const { CommitLedger } = getOrchestratorModels();
  return CommitLedger.findByPk(id);
}

async function updateCommitLedger(dedupKey, payload) {
  const { CommitLedger } = getOrchestratorModels();
  await CommitLedger.update(payload, { where: { dedup_key: dedupKey } });
  return findCommitLedgerByDedupKey(dedupKey);
}

async function enqueueOutbox(payload) {
  const { OutboxEvent } = getOrchestratorModels();
  return OutboxEvent.create(payload);
}

async function lockPendingOutboxBatch(limit) {
  const { OutboxEvent, CommitLedger } = getOrchestratorModels();
  const now = new Date();
  const rows = await OutboxEvent.findAll({
    where: {
      status: { [Op.in]: ["PENDING", "FAILED"] },
      [Op.or]: [{ next_retry_at: null }, { next_retry_at: { [Op.lte]: now } }]
    },
    include: [{ model: CommitLedger, as: "commit_ledger", required: false }],
    order: [["created_at", "ASC"]],
    limit
  });
  const eligible = rows.filter((row) => {
    const commitLedger = row.commit_ledger;
    return commitLedger && commitLedger.status === "COMMITTED";
  });
  const ids = eligible.map((row) => row.id);
  if (!ids.length) return [];
  await OutboxEvent.update({ status: "PROCESSING" }, { where: { id: ids } });
  return OutboxEvent.findAll({
    where: { id: ids },
    include: [{ model: CommitLedger, as: "commit_ledger", required: false }]
  });
}

async function markOutboxProcessed(id) {
  const { OutboxEvent } = getOrchestratorModels();
  return OutboxEvent.update(
    { status: "PROCESSED", processed_at: new Date(), last_error: null },
    { where: { id } }
  );
}

async function markOutboxFailed(id, retryCount, errorMessage, nextRetryAt) {
  const { OutboxEvent } = getOrchestratorModels();
  return OutboxEvent.update(
    {
      status: "FAILED",
      retry_count: retryCount,
      last_error: errorMessage,
      next_retry_at: nextRetryAt
    },
    { where: { id } }
  );
}

async function getLastTransitionVersion(entity, entityId) {
  const { StateTransitionLog } = getOrchestratorModels();
  const row = await StateTransitionLog.findOne({
    where: { entity, entity_id: String(entityId) },
    order: [["transition_version", "DESC"]]
  });
  return row ? row.transition_version : 0;
}

async function createStateTransition(payload) {
  const { StateTransitionLog } = getOrchestratorModels();
  return StateTransitionLog.create(payload);
}

async function findOutboxByCommitLedgerId(commitLedgerId) {
  const { OutboxEvent } = getOrchestratorModels();
  return OutboxEvent.findOne({ where: { commit_ledger_id: commitLedgerId } });
}

async function listCommittedLedgerOrdered() {
  const { CommitLedger } = getOrchestratorModels();
  return CommitLedger.findAll({
    where: { status: "COMMITTED" },
    order: [["commit_seq", "ASC"]]
  });
}

async function clearLedgerReplayState() {
  const { LedgerReplayState } = getOrchestratorModels();
  return LedgerReplayState.destroy({ where: {} });
}

async function createLedgerReplayState(payload) {
  const { LedgerReplayState } = getOrchestratorModels();
  return LedgerReplayState.create(payload);
}

async function listLedgerReplayState() {
  const { LedgerReplayState } = getOrchestratorModels();
  return LedgerReplayState.findAll({ order: [["commit_seq", "ASC"]] });
}

async function findScopeLock(scopeKey, options = {}) {
  const { ScopeLock } = getOrchestratorModels();
  return ScopeLock.findOne({
    where: { scope_key: scopeKey },
    transaction: options.transaction,
    lock: options.lock
  });
}

async function createScopeLock(payload, options = {}) {
  const { ScopeLock } = getOrchestratorModels();
  return ScopeLock.create(payload, { transaction: options.transaction });
}

async function updateScopeLock(scopeKey, payload, options = {}) {
  const { ScopeLock } = getOrchestratorModels();
  await ScopeLock.update(payload, {
    where: { scope_key: scopeKey },
    transaction: options.transaction
  });
  return findScopeLock(scopeKey, options);
}

async function deleteScopeLocksByOwner(ownerRequestId) {
  const { ScopeLock } = getOrchestratorModels();
  return ScopeLock.destroy({ where: { owner_request_id: ownerRequestId } });
}

module.exports = {
  findIdempotencyByDedupKey,
  reserveIdempotency,
  updateIdempotency,
  reserveCommitLedger,
  findCommitLedgerByDedupKey,
  findCommitLedgerById,
  updateCommitLedger,
  enqueueOutbox,
  lockPendingOutboxBatch,
  markOutboxProcessed,
  markOutboxFailed,
  getLastTransitionVersion,
  createStateTransition,
  findOutboxByCommitLedgerId,
  listCommittedLedgerOrdered,
  clearLedgerReplayState,
  createLedgerReplayState,
  listLedgerReplayState,
  findScopeLock,
  createScopeLock,
  updateScopeLock,
  deleteScopeLocksByOwner
};

