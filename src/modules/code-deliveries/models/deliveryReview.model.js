/**
 * Code Review System — Modelo DeliveryReview
 * Revisión humana por entrega: PENDING, APPROVED, CHANGES_REQUESTED.
 */

const { DataTypes } = require("sequelize");

const REVIEW_STATUSES = ["PENDING", "APPROVED", "CHANGES_REQUESTED"];

function defineDeliveryReviewModel(sequelize) {
  return sequelize.define(
    "DeliveryReview",
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
      reviewer_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(...REVIEW_STATUSES),
        allowNull: false,
        defaultValue: "PENDING"
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "delivery_reviews",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineDeliveryReviewModel;
module.exports.REVIEW_STATUSES = REVIEW_STATUSES;
