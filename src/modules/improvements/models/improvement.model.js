/**
 * Módulo Improvements - Modelo Improvement
 * Responsabilidad: esquema Sequelize para mejoras. Tabla improvements.
 */

const { DataTypes } = require("sequelize");

const IMPROVEMENT_STATUSES = ["DRAFT", "PROPOSED", "APPROVED", "REJECTED", "IMPLEMENTED"];

function defineImprovementModel(sequelize) {
  return sequelize.define(
    "Improvement",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      incident_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(...IMPROVEMENT_STATUSES),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      proposed_by: {
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
      implemented_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "improvements",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineImprovementModel;
module.exports.IMPROVEMENT_STATUSES = IMPROVEMENT_STATUSES;
