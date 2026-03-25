/**
 * ----
 * Módulo: Rule Execution Model
 * Descripción: Modelo de persistencia para historial auditable de evaluaciones de reglas.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const { DataTypes } = require("sequelize");

function defineRuleExecutionModel(sequelize) {
  return sequelize.define(
    "RuleExecution",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      execution_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: DataTypes.ENUM("story", "work_order", "delivery"),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      profile_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      target_entity: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      trigger_event: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      dry_run: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      blocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      request_id: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      actor_user_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      evaluation_json: {
        type: DataTypes.JSON,
        allowNull: false
      },
      rule_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      allowed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      errors: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      warnings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      }
    },
    {
      tableName: "rule_executions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );
}

module.exports = defineRuleExecutionModel;
