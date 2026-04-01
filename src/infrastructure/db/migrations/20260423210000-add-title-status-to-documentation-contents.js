"use strict";

/**
 * ----
 * Módulo: Migración documentation_contents — título y estado
 * Descripción: Permite CRUD documental de plataforma con campos mínimos de producto y archivo lógico.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("documentation_contents", "title", {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn("documentation_contents", "status", {
      type: Sequelize.ENUM("ACTIVE", "ARCHIVED"),
      allowNull: false,
      defaultValue: "ACTIVE"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("documentation_contents", "status");
    await queryInterface.removeColumn("documentation_contents", "title");
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_documentation_contents_status;");
    } catch (_) {
      // MySQL no usa tipos nombrados como Postgres
    }
  }
};
