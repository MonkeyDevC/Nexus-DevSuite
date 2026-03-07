/**
 * Módulo Documents - Modelo Document
 * Identidad del documento (código, título). project_id nullable = organizacional o de proyecto.
 */

const { DataTypes } = require("sequelize");

function defineDocumentModel(sequelize) {
  return sequelize.define(
    "Document",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      tableName: "documents",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineDocumentModel;
