"use strict";

/**
 * ----
 * Módulo: Migración Scope Locks
 * Descripción: Crea tabla de locks por scope para control de concurrencia.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("scope_locks", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("(UUID())")
      },
      scope_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      scope_table: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      row_id: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      owner_request_id: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      owner_dedup_key: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("scope_locks", ["scope_table", "row_id", "tenant_id"], {
      name: "idx_scope_locks_lookup"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("scope_locks", "idx_scope_locks_lookup");
    await queryInterface.dropTable("scope_locks");
  }
};

