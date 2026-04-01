/**
 * Módulo Releases - Modelo Release
 * Responsabilidad: esquema Sequelize para releases. Tabla releases.
 * Estados: PLANNED, IN_PROGRESS, QA, RELEASED, ROLLED_BACK, ARCHIVED.
 */

const { DataTypes } = require("sequelize");

const RELEASE_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "QA",
  "RELEASED",
  "ROLLED_BACK",
  "ARCHIVED"
];

function defineReleaseModel(sequelize) {
  return sequelize.define(
    "Release",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      version: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      status: {
        type: DataTypes.ENUM(...RELEASE_STATUSES),
        allowNull: false,
        defaultValue: "PLANNED"
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      released_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "releases",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineReleaseModel;
module.exports.RELEASE_STATUSES = RELEASE_STATUSES;
