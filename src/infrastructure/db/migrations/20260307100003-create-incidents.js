"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("incidents", {
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
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      severity: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      status: {
        type: Sequelize.ENUM("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"),
        allowNull: false,
        defaultValue: "OPEN"
      },
      root_cause_analysis: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reported_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
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

    await queryInterface.addIndex("incidents", ["project_id"], { name: "idx_incidents_project_id" });
    await queryInterface.addIndex("incidents", ["status"], { name: "idx_incidents_status" });
    await queryInterface.addIndex("incidents", ["reported_by"], { name: "idx_incidents_reported_by" });
    await queryInterface.addIndex("incidents", ["closed_by"], { name: "idx_incidents_closed_by" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("incidents");
  }
};
