/**
 * Módulo Sprints - Modelo Sprint
 * Responsabilidad: esquema Sequelize para sprints. Tabla sprints.
 */

const { DataTypes } = require("sequelize");

const SPRINT_STATUSES = ["PLANNED", "IN_PROGRESS", "CLOSED"];

function defineSprintModel(sequelize) {
  return sequelize.define(
    "Sprint",
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      goal: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(...SPRINT_STATUSES),
        allowNull: false,
        defaultValue: "PLANNED"
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false
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
      tableName: "sprints",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineSprintModel;
module.exports.SPRINT_STATUSES = SPRINT_STATUSES;
