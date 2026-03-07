/**
 * Módulo Incidents - Modelo Incident
 * Responsabilidad: esquema Sequelize para incidentes. Tabla incidents.
 */

const { DataTypes } = require("sequelize");

const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const INCIDENT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function defineIncidentModel(sequelize) {
  return sequelize.define(
    "Incident",
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
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      severity: {
        type: DataTypes.ENUM(...INCIDENT_SEVERITIES),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      status: {
        type: DataTypes.ENUM(...INCIDENT_STATUSES),
        allowNull: false,
        defaultValue: "OPEN"
      },
      root_cause_analysis: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reported_by: {
        type: DataTypes.UUID,
        allowNull: false
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true
      },
      closed_by: {
        type: DataTypes.UUID,
        allowNull: true
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "incidents",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineIncidentModel;
module.exports.INCIDENT_SEVERITIES = INCIDENT_SEVERITIES;
module.exports.INCIDENT_STATUSES = INCIDENT_STATUSES;
