/**
 * Módulo Tasks - Modelo Task
 * Unidad técnica de trabajo dentro de una User Story.
 */

const { DataTypes } = require("sequelize");

const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

function defineTaskModel(sequelize) {
  return sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      task_number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      user_story_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      work_order_id: {
        type: DataTypes.UUID,
        allowNull: true
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
        type: DataTypes.ENUM(...TASK_STATUSES),
        allowNull: false,
        defaultValue: "PENDING"
      },
      assigned_to_user_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      priority: {
        type: DataTypes.ENUM(...TASK_PRIORITIES),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      estimated_hours: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      tableName: "tasks",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineTaskModel;
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
