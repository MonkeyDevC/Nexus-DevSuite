/**
 * ----
 * Módulo: Workflow Models
 * Descripción: Define los modelos Sequelize para foundation del workflow engine.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { DataTypes } = require("sequelize");

function defineWorkflowModels(sequelize) {
  const WorkflowDefinition = sequelize.define(
    "WorkflowDefinition",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      version: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      },
      status: {
        type: DataTypes.ENUM("draft", "active"),
        allowNull: false,
        defaultValue: "draft"
      },
      activated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      tableName: "workflow_definitions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  const WorkflowNode = sequelize.define(
    "WorkflowNode",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      workflow_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM("task", "validation", "condition"),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      is_start: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      }
    },
    {
      tableName: "workflow_nodes",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  const WorkflowEdge = sequelize.define(
    "WorkflowEdge",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      from_node_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      to_node_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      condition: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "workflow_edges",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  const WorkflowRule = sequelize.define(
    "WorkflowRule",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      node_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      rule_type: {
        type: DataTypes.ENUM("block", "warn"),
        allowNull: false
      },
      conditions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      message: {
        type: DataTypes.STRING(500),
        allowNull: false
      }
    },
    {
      tableName: "workflow_rules",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  return {
    WorkflowDefinition,
    WorkflowNode,
    WorkflowEdge,
    WorkflowRule
  };
}

module.exports = {
  defineWorkflowModels
};
