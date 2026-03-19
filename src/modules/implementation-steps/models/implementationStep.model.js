/**
 * Módulo Implementation Steps - Modelo ImplementationStep
 * Paso técnico del plan de ejecución (tracking: started_at, completed_at, retry_count).
 */

const { DataTypes } = require("sequelize");

const STEP_STATUSES = ["PENDING", "RUNNING", "COMPLETED", "FAILED"];

function defineImplementationStepModel(sequelize) {
  return sequelize.define(
    "ImplementationStep",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      task_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      work_order_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      step_number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(...STEP_STATUSES),
        allowNull: false,
        defaultValue: "PENDING"
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      retry_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      cursor_execution_id: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: "implementation_steps",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineImplementationStepModel;
module.exports.STEP_STATUSES = STEP_STATUSES;
