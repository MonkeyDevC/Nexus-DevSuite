"use strict";

/**
 * ----
 * Módulo: Migración Foundation Workflow Engine
 * Descripción: Crea tablas base para definiciones, nodos, edges y reglas de workflow.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("workflow_definitions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      version: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      },
      status: {
        type: Sequelize.ENUM("draft", "active"),
        allowNull: false,
        defaultValue: "draft"
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("workflow_nodes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "workflow_definitions",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      type: {
        type: Sequelize.ENUM("task", "validation", "condition"),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      config: {
        type: Sequelize.JSON,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("workflow_edges", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      from_node_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "workflow_nodes",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      to_node_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "workflow_nodes",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      condition: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("workflow_rules", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      node_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "workflow_nodes",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      rule_type: {
        type: Sequelize.ENUM("block", "warn"),
        allowNull: false
      },
      conditions: {
        type: Sequelize.JSON,
        allowNull: false
      },
      message: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("workflow_definitions", ["name"], { name: "idx_workflow_definitions_name" });
    await queryInterface.addIndex("workflow_definitions", ["status"], { name: "idx_workflow_definitions_status" });
    await queryInterface.addIndex("workflow_nodes", ["workflow_id"], { name: "idx_workflow_nodes_workflow_id" });
    await queryInterface.addIndex("workflow_edges", ["from_node_id"], { name: "idx_workflow_edges_from_node_id" });
    await queryInterface.addIndex("workflow_edges", ["to_node_id"], { name: "idx_workflow_edges_to_node_id" });
    await queryInterface.addIndex("workflow_rules", ["node_id"], { name: "idx_workflow_rules_node_id" });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("workflow_rules");
    await queryInterface.dropTable("workflow_edges");
    await queryInterface.dropTable("workflow_nodes");
    await queryInterface.dropTable("workflow_definitions");

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "postgresql") {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_workflow_definitions_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_workflow_nodes_type";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_workflow_rules_rule_type";');
    }
  }
};
