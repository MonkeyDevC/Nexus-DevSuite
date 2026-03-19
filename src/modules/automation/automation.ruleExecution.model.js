"use strict";

const { DataTypes } = require("sequelize");

function defineAutomationRuleExecutionModel(sequelize) {
  return sequelize.define(
    "AutomationRuleExecution",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      rule_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      execution_time_ms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: "automation_rule_executions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );
}

module.exports = defineAutomationRuleExecutionModel;

