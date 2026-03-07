/**
 * Módulo ChangeRequest - Modelo
 * CR obligatorio para acciones estructurales en Feature/Release.
 * entity_type y entity_id son obligatorios (no se permiten CR sin entidad asociada).
 */

const { DataTypes } = require("sequelize");

const CR_TYPES = ["FEATURE", "BUGFIX", "HOTFIX", "IMPROVEMENT", "STRUCTURAL"];
const CR_IMPACT_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CR_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IMPLEMENTED"];
const CR_ENTITY_TYPES = ["FEATURE", "RELEASE"];

function defineChangeRequestModel(sequelize) {
  return sequelize.define(
    "ChangeRequest",
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
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      type: {
        type: DataTypes.ENUM(...CR_TYPES),
        allowNull: true
      },
      impact_level: {
        type: DataTypes.ENUM(...CR_IMPACT_LEVELS),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(...CR_STATUSES),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      requested_by: {
        type: DataTypes.UUID,
        allowNull: false
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true
      },
      entity_type: {
        type: DataTypes.ENUM(...CR_ENTITY_TYPES),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: false
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
      tableName: "change_requests",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at"
    }
  );
}

module.exports = defineChangeRequestModel;
module.exports.CR_TYPES = CR_TYPES;
module.exports.CR_IMPACT_LEVELS = CR_IMPACT_LEVELS;
module.exports.CR_STATUSES = CR_STATUSES;
module.exports.CR_ENTITY_TYPES = CR_ENTITY_TYPES;
