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
      organization_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
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
      }
    },
    {
      tableName: "projects",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ unique: true, fields: ["organization_id", "name"], name: "uq_projects_organization_name" }]
    }
  );
}

module.exports = defineProjectModel;
