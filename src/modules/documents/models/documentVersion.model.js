/**
 * Módulo Documents - Modelo DocumentVersion
 * Cada versión del documento. version_number incremental por document_id; status DRAFT|APPROVED|ARCHIVED.
 */

const { DataTypes } = require("sequelize");

const VERSION_STATUSES = ["DRAFT", "APPROVED", "ARCHIVED"];

function defineDocumentVersionModel(sequelize) {
  return sequelize.define(
    "DocumentVersion",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      document_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(...VERSION_STATUSES),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      change_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "document_versions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineDocumentVersionModel;
module.exports.VERSION_STATUSES = VERSION_STATUSES;
