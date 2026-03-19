/**
 * Code Review System — Modelo ReviewComment
 * Comentarios por archivo/línea con respuestas (parent_id).
 */

const { DataTypes } = require("sequelize");

function defineReviewCommentModel(sequelize) {
  return sequelize.define(
    "ReviewComment",
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
      author_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      file_path: {
        type: DataTypes.STRING(1024),
        allowNull: false
      },
      line_number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true
      }
    },
    {
      tableName: "review_comments",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );
}

module.exports = defineReviewCommentModel;
