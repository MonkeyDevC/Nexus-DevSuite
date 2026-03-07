"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_stories", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      feature_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "features", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      acceptance_criteria: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      closed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("user_stories", ["feature_id"], { name: "idx_user_stories_feature_id" });
    await queryInterface.addIndex("user_stories", ["assigned_to"], { name: "idx_user_stories_assigned_to" });
    await queryInterface.addIndex("user_stories", ["status"], { name: "idx_user_stories_status" });
    await queryInterface.addIndex("user_stories", ["created_by"], { name: "idx_user_stories_created_by" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_stories");
  }
};
