"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sprints", {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      goal: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("PLANNED", "IN_PROGRESS", "CLOSED"),
        allowNull: false,
        defaultValue: "PLANNED"
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      closed_by: {
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
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex("sprints", ["project_id"], { name: "idx_sprints_project_id" });
    await queryInterface.addIndex("sprints", ["status"], { name: "idx_sprints_status" });
    await queryInterface.addIndex("sprints", ["created_by"], { name: "idx_sprints_created_by" });
    await queryInterface.addIndex("sprints", ["closed_by"], { name: "idx_sprints_closed_by" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sprints");
  }
};
