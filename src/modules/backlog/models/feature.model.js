/**
 * Módulo Backlog - Modelo Feature
 * Responsabilidad: esquema Sequelize para features. Tabla features.
 */

const { DataTypes } = require("sequelize");

function defineFeatureModel(sequelize) {
  return sequelize.define(
    "Feature",
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
      title: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM"
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
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      release_id: {
        type: DataTypes.UUID,
        allowNull: true
      }
    },
    {
      tableName: "features",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineFeatureModel;
