"use strict";

/**
 * ----
 * Módulo: Migración Hardening Workflow Edges
 * Descripción: Agrega restricción de unicidad para evitar edges duplicados.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("workflow_edges", ["from_node_id", "to_node_id"], {
      name: "uq_workflow_edges_from_to",
      unique: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("workflow_edges", "uq_workflow_edges_from_to");
  }
};
