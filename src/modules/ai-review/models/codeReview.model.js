/**
 * AI Code Review — Modelo CodeReview
 * Resultado del análisis de código por IA para una Code Delivery.
 */

const { DataTypes } = require("sequelize");

function defineCodeReviewModel(sequelize) {
  return sequelize.define(
    "CodeReview",
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
      delivery_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      issues: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      security_warnings: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      improvements: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      risk_level: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      model_used: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      tokens_used: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      duration_ms: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "code_reviews",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );
}

module.exports = defineCodeReviewModel;
