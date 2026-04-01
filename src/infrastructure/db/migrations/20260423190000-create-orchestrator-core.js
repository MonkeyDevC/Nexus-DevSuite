"use strict";

/**
 * ----
 * Módulo: Migración Orchestrator Core
 * Descripción: Crea tablas base de ledger, idempotencia, outbox y transiciones de estado.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("idempotency_keys", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("(UUID())")
      },
      dedup_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      method: {
        type: Sequelize.STRING(16),
        allowNull: false
      },
      path: {
        type: Sequelize.STRING(512),
        allowNull: false
      },
      request_hash: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("PROCESSING", "COMPLETED", "FAILED"),
        allowNull: false,
        defaultValue: "PROCESSING"
      },
      response_status: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      response_body: {
        type: Sequelize.JSON,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    await queryInterface.createTable("commit_ledger", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("(UUID())")
      },
      commit_seq: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        unique: true
      },
      dedup_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      request_id: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      before_hash: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      after_hash: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("PREPARED", "COMMITTED", "ABORTED"),
        allowNull: false,
        defaultValue: "PREPARED"
      },
      signature: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    await queryInterface.createTable("outbox_events", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("(UUID())")
      },
      dedup_key: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("PENDING", "PROCESSING", "PROCESSED", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      retry_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    await queryInterface.addConstraint("outbox_events", {
      fields: ["dedup_key", "event_type"],
      type: "unique",
      name: "uq_outbox_events_dedup_event_type"
    });

    await queryInterface.createTable("state_transition_logs", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("(UUID())")
      },
      entity: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      transition_version: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      from_state: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      to_state: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      request_id: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      dedup_key: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    await queryInterface.addConstraint("state_transition_logs", {
      fields: ["entity", "entity_id", "transition_version"],
      type: "unique",
      name: "uq_state_transition_logs_entity_version"
    });

    await queryInterface.addIndex("state_transition_logs", ["entity", "entity_id"], {
      name: "idx_state_transition_logs_entity_id"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("state_transition_logs", "uq_state_transition_logs_entity_version");
    await queryInterface.removeIndex("state_transition_logs", "idx_state_transition_logs_entity_id");
    await queryInterface.dropTable("state_transition_logs");
    await queryInterface.removeConstraint("outbox_events", "uq_outbox_events_dedup_event_type");
    await queryInterface.dropTable("outbox_events");
    await queryInterface.dropTable("commit_ledger");
    await queryInterface.dropTable("idempotency_keys");
  }
};

