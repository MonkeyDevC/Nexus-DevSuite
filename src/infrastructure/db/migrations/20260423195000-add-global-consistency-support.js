"use strict";

/**
 * ----
 * Módulo: Migración Global Consistency
 * Descripción: Agrega referencia outbox->ledger y tabla de replay determinista.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("outbox_events", "commit_ledger_id", {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addConstraint("outbox_events", {
      fields: ["commit_ledger_id"],
      type: "foreign key",
      name: "fk_outbox_events_commit_ledger_id",
      references: {
        table: "commit_ledger",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });

    await queryInterface.addIndex("outbox_events", ["commit_ledger_id"], {
      name: "idx_outbox_events_commit_ledger_id"
    });

    await queryInterface.createTable("ledger_replay_state", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("(UUID())")
      },
      commit_seq: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true
      },
      dedup_key: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      request_id: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      after_hash: {
        type: Sequelize.STRING(64),
        allowNull: false
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ledger_replay_state");
    await queryInterface.removeIndex("outbox_events", "idx_outbox_events_commit_ledger_id");
    await queryInterface.removeConstraint("outbox_events", "fk_outbox_events_commit_ledger_id");
    await queryInterface.removeColumn("outbox_events", "commit_ledger_id");
  }
};

