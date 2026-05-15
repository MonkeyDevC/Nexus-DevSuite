/**
 * Módulo Backlog - Modelo UserStory
 * Responsabilidad: esquema Sequelize para user stories. Tabla user_stories.
 */

const { DataTypes } = require("sequelize");

function defineUserStoryModel(sequelize) {
  return sequelize.define(
    "UserStory",
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
      feature_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      number: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      acceptance_criteria: {
        type: DataTypes.JSON,
        allowNull: true
      },
      implementation_criteria: {
        type: DataTypes.JSON,
        allowNull: true
      },
      evidence_markdown: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      refinement_status: {
        type: DataTypes.ENUM("IDEA", "DRAFT", "REFINED", "READY"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      item_type: {
        type: DataTypes.ENUM("STORY", "BUG", "TECH_TASK", "IMPROVEMENT"),
        allowNull: false,
        defaultValue: "STORY"
      },
      status: {
        type: DataTypes.ENUM(
          "DRAFT",
          "READY",
          "IN_PROGRESS",
          "BLOCKED",
          "IN_REVIEW",
          "DONE",
          "ARCHIVED"
        ),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sprint_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      release_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      story_points: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      backlog_position: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
      },
      labels: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      tableName: "user_stories",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineUserStoryModel;
