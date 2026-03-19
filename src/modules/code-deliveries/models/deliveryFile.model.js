/**
 * Módulo Code Deliveries - Modelo DeliveryFile (Delivery Workspace)
 * Archivo temporal asociado a una entrega para construir commit y push.
 */

const { DataTypes } = require("sequelize");

const DELIVERY_FILE_STATUSES = ["ADDED", "MODIFIED", "DELETED", "RENAMED", "COPIED"];

function defineDeliveryFileModel(sequelize) {
  return sequelize.define(
    "DeliveryFile",
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
      file_path: {
        type: DataTypes.STRING(1024),
        allowNull: false
      },
      old_file_path: {
        type: DataTypes.STRING(1024),
        allowNull: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      content_base64: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(...DELIVERY_FILE_STATUSES),
        allowNull: false,
        defaultValue: "ADDED"
      }
    },
    {
      tableName: "delivery_files",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineDeliveryFileModel;
module.exports.DELIVERY_FILE_STATUSES = DELIVERY_FILE_STATUSES;
