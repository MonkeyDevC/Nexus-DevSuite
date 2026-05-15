/**
 * Módulo Work Orders - Modelo WorkOrder
 * Orden técnica de ejecución de una User Story.
 */

const { DataTypes } = require("sequelize");

const WORK_ORDER_STATUSES = ["PENDING", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const WORK_ORDER_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const WORK_ORDER_KINDS = ["WORK", "REWORK"];

function defineWorkOrderModel(sequelize) {
  return sequelize.define(
    "WorkOrder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      ot_number: {
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
      kind: {
        type: DataTypes.ENUM(...WORK_ORDER_KINDS),
        allowNull: false,
        defaultValue: "WORK"
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
        type: DataTypes.ENUM(...WORK_ORDER_STATUSES),
        allowNull: false,
        defaultValue: "PENDING"
      },
      priority: {
        type: DataTypes.ENUM(...WORK_ORDER_PRIORITIES),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      assigned_to_user_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      delivery_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: "work_orders",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineWorkOrderModel;
module.exports.WORK_ORDER_STATUSES = WORK_ORDER_STATUSES;
module.exports.WORK_ORDER_PRIORITIES = WORK_ORDER_PRIORITIES;
module.exports.WORK_ORDER_KINDS = WORK_ORDER_KINDS;
