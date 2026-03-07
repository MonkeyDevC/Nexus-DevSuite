"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("features", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "projects", key: "id" },
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
      status: {
        type: Sequelize.ENUM("DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM"
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
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex("features", ["project_id"], { name: "idx_features_project_id" });
    await queryInterface.addIndex("features", ["status"], { name: "idx_features_status" });
    await queryInterface.addIndex("features", ["created_by"], { name: "idx_features_created_by" });
    await queryInterface.addIndex("features", ["approved_by"], { name: "idx_features_approved_by" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("features");
  }
};
