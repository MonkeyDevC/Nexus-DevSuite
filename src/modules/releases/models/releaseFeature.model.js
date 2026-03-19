/**
 * Release Planning — Modelo ReleaseFeature (tabla release_features).
 * Relación many-to-many entre Release y Feature para planificación por proyecto.
 */

const { DataTypes } = require("sequelize");

function defineReleaseFeatureModel(sequelize) {
  return sequelize.define(
    "ReleaseFeature",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      release_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      feature_id: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      tableName: "release_features",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );
}

module.exports = defineReleaseFeatureModel;
