"use strict";

/**
 * ----
 * Módulo: Migración Workflow Node Start
 * Descripción: Agrega bandera is_start para definir punto de entrada del workflow.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("workflow_nodes", "is_start", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addIndex("workflow_nodes", ["workflow_id", "is_start"], {
      name: "idx_workflow_nodes_workflow_start"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("workflow_nodes", "idx_workflow_nodes_workflow_start");
    await queryInterface.removeColumn("workflow_nodes", "is_start");
  }
};
