/**
 * Módulo Code Deliveries - Modelo DeliveryCommit (Delivery Workspace)
 * Trazabilidad de commits realizados desde Nexus para una entrega.
 */

const { DataTypes } = require("sequelize");

function defineDeliveryCommitModel(sequelize) {
  return sequelize.define(
    "DeliveryCommit",
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
      delivery_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      work_order_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      commit_sha: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      commit_message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      author: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: "delivery_commits",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineDeliveryCommitModel;
