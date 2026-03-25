/**
 * ----
 * Módulo: Outbox Dispatcher
 * Descripción: Procesa eventos pendientes del outbox con reintentos deterministas.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const orchestratorRepository = require("./orchestrator.repository");
const logger = require("../../config/logger");

let timer = null;

async function processEvent(eventRow) {
  const event = eventRow.toJSON ? eventRow.toJSON() : eventRow;
  if (!event.commit_ledger_id || !event.commit_ledger || event.commit_ledger.status !== "COMMITTED") {
    logger.warn(
      {
        event: "OUTBOX_BLOCKED_NON_COMMITTED_LEDGER",
        outbox_event_id: event.id,
        commit_ledger_id: event.commit_ledger_id || null
      },
      "Outbox blocked because ledger is not committed"
    );
    return;
  }
  try {
    logger.info(
      {
        event: "OUTBOX_EVENT_DISPATCHED",
        outbox_event_id: event.id,
        event_type: event.event_type,
        dedup_key: event.dedup_key
      },
      "Outbox event processed"
    );
    await orchestratorRepository.markOutboxProcessed(event.id);
  } catch (error) {
    const nextRetryCount = Number(event.retry_count || 0) + 1;
    const delayMs = Math.min(60000, 1000 * Math.pow(2, Math.min(nextRetryCount, 6)));
    const nextRetryAt = new Date(Date.now() + delayMs);
    await orchestratorRepository.markOutboxFailed(event.id, nextRetryCount, error.message, nextRetryAt);
    logger.warn(
      {
        event: "OUTBOX_EVENT_FAILED",
        outbox_event_id: event.id,
        retry_count: nextRetryCount,
        next_retry_at: nextRetryAt.toISOString(),
        err: error.message
      },
      "Outbox event failed and rescheduled"
    );
  }
}

async function tick() {
  const rows = await orchestratorRepository.lockPendingOutboxBatch(20);
  for (const row of rows) {
    await processEvent(row);
  }
}

function startOutboxDispatcher() {
  if (timer) return;
  timer = setInterval(() => {
    tick().catch((error) => {
      logger.error({ err: error }, "Outbox dispatcher tick failed");
    });
  }, 2000);
}

function stopOutboxDispatcher() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

module.exports = {
  startOutboxDispatcher,
  stopOutboxDispatcher,
  tick
};

