"use strict";

/**
 * ----
 * Módulo: Migración Workflow Activated At
 * Descripción: Agrega columna activated_at en workflow_definitions para trazabilidad mínima.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("workflow_definitions", "activated_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("workflow_definitions", "activated_at");
  }
};
