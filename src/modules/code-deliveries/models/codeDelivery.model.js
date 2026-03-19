/**
 * Módulo Code Deliveries - Modelo CodeDelivery
 * Entrega técnica de código asociada a una Task.
 */

const { DataTypes } = require("sequelize");

const DELIVERY_TYPES = ["FEATURE", "BUGFIX", "REFACTOR", "HOTFIX"];
const DELIVERY_STATUSES = ["PREPARING", "DRAFT", "READY", "LOCKED", "COMMITTED", "PR_CREATED", "MERGED"];

function defineCodeDeliveryModel(sequelize) {
  return sequelize.define(
    "CodeDelivery",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      delivery_number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
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
        allowNull: true
      },
      user_story_id: {
        type: DataTypes.UUID,
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
      branch_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      commit_hash: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      base_commit_hash: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      pull_request_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      delivery_type: {
        type: DataTypes.ENUM(...DELIVERY_TYPES),
        allowNull: false,
        defaultValue: "FEATURE"
      },
      status: {
        type: DataTypes.ENUM(...DELIVERY_STATUSES),
        allowNull: false,
        defaultValue: "PREPARING"
      },
      created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      git_snapshot_json: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: "code_deliveries",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineCodeDeliveryModel;
module.exports.DELIVERY_TYPES = DELIVERY_TYPES;
module.exports.DELIVERY_STATUSES = DELIVERY_STATUSES;
