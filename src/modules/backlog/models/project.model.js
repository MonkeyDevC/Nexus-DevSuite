/**
 * Módulo Backlog - Modelo Project
 * Responsabilidad: esquema Sequelize para proyectos. Tabla projects.
 */

const { DataTypes } = require("sequelize");

function defineProjectModel(sequelize) {
  return sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      normalized_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      acceptance_criteria: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      implementation_criteria: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      evidence_markdown: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "ARCHIVED"),
        allowNull: false,
        defaultValue: "ACTIVE"
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false
      },
      archived_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      version: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      }
    },
    {
      tableName: "projects",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { unique: true, fields: ["organization_id", "normalized_name"], name: "uq_projects_organization_normalized_name" },
        { unique: true, fields: ["organization_id", "number"], name: "uq_projects_organization_number" }
      ]
    }
  );
}

module.exports = defineProjectModel;
