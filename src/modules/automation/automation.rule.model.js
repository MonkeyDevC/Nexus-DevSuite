"use strict";

const { DataTypes } = require("sequelize");

function defineAutomationRuleModel(sequelize) {
  return sequelize.define(
    "AutomationRule",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tenant_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      conditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      actions: {
        type: DataTypes.JSON,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: "automation_rules",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineAutomationRuleModel;

