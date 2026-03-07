/**
 * Módulo Organizations - Modelo Organization
 * Tabla organizations. Campos de preparación billing: plan, billing_email, next_billing_date.
 */

const { DataTypes } = require("sequelize");

function defineOrganizationModel(sequelize) {
  return sequelize.define(
    "Organization",
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
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true
      },
      plan: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      billing_email: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      next_billing_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      tableName: "organizations",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineOrganizationModel;
