/**
 * ----
 * Módulo: Orchestrator Models
 * Descripción: Modelos persistentes para idempotencia, commit ledger, outbox y transiciones.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { DataTypes } = require("sequelize");

function defineOrchestratorModels(sequelize) {
  const IdempotencyKey = sequelize.define(
    "IdempotencyKey",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      dedup_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      method: { type: DataTypes.STRING(16), allowNull: false },
      path: { type: DataTypes.STRING(512), allowNull: false },
      request_hash: { type: DataTypes.STRING(64), allowNull: false },
      status: {
        type: DataTypes.ENUM("PROCESSING", "COMPLETED", "FAILED"),
        allowNull: false,
        defaultValue: "PROCESSING"
      },
      response_status: { type: DataTypes.INTEGER, allowNull: true },
      response_body: { type: DataTypes.JSON, allowNull: true },
      completed_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: "idempotency_keys",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  const CommitLedger = sequelize.define(
    "CommitLedger",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      commit_seq: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true, autoIncrement: true },
      dedup_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      request_id: { type: DataTypes.STRING(128), allowNull: false },
      before_hash: { type: DataTypes.STRING(64), allowNull: false },
      after_hash: { type: DataTypes.STRING(64), allowNull: true },
      status: {
        type: DataTypes.ENUM("PREPARED", "COMMITTED", "ABORTED"),
        allowNull: false,
        defaultValue: "PREPARED"
      },
      signature: { type: DataTypes.TEXT, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true }
    },
    {
      tableName: "commit_ledger",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  const OutboxEvent = sequelize.define(
    "OutboxEvent",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      dedup_key: { type: DataTypes.STRING(255), allowNull: false },
      commit_ledger_id: { type: DataTypes.UUID, allowNull: true },
      event_type: { type: DataTypes.STRING(120), allowNull: false },
      payload: { type: DataTypes.JSON, allowNull: false },
      status: {
        type: DataTypes.ENUM("PENDING", "PROCESSING", "PROCESSED", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      retry_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      next_retry_at: { type: DataTypes.DATE, allowNull: true },
      processed_at: { type: DataTypes.DATE, allowNull: true },
      last_error: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      tableName: "outbox_events",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ unique: true, fields: ["dedup_key", "event_type"], name: "uq_outbox_events_dedup_event_type" }]
    }
  );

  const StateTransitionLog = sequelize.define(
    "StateTransitionLog",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      entity: { type: DataTypes.STRING(80), allowNull: false },
      entity_id: { type: DataTypes.STRING(80), allowNull: false },
      transition_version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      from_state: { type: DataTypes.STRING(80), allowNull: true },
      to_state: { type: DataTypes.STRING(80), allowNull: false },
      request_id: { type: DataTypes.STRING(128), allowNull: false },
      dedup_key: { type: DataTypes.STRING(255), allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true }
    },
    {
      tableName: "state_transition_logs",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { unique: true, fields: ["entity", "entity_id", "transition_version"], name: "uq_state_transition_logs_entity_version" },
        { fields: ["entity", "entity_id"], name: "idx_state_transition_logs_entity_id" }
      ]
    }
  );

  const ScopeLock = sequelize.define(
    "ScopeLock",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      scope_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      scope_table: { type: DataTypes.STRING(80), allowNull: false },
      row_id: { type: DataTypes.STRING(80), allowNull: true },
      tenant_id: { type: DataTypes.STRING(80), allowNull: true },
      owner_request_id: { type: DataTypes.STRING(128), allowNull: false },
      owner_dedup_key: { type: DataTypes.STRING(255), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false }
    },
    {
      tableName: "scope_locks",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { unique: true, fields: ["scope_key"], name: "scope_locks_scope_key_key" },
        { fields: ["scope_table", "row_id", "tenant_id"], name: "idx_scope_locks_lookup" }
      ]
    }
  );

  const LedgerReplayState = sequelize.define(
    "LedgerReplayState",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      commit_seq: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
      dedup_key: { type: DataTypes.STRING(255), allowNull: false },
      request_id: { type: DataTypes.STRING(128), allowNull: false },
      after_hash: { type: DataTypes.STRING(64), allowNull: false }
    },
    {
      tableName: "ledger_replay_state",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  return {
    IdempotencyKey,
    CommitLedger,
    OutboxEvent,
    StateTransitionLog,
    ScopeLock,
    LedgerReplayState
  };
}

module.exports = {
  defineOrchestratorModels
};

