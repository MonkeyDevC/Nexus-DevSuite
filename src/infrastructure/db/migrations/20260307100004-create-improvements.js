"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("improvements", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "projects", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      incident_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "incidents", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "PROPOSED", "APPROVED", "REJECTED", "IMPLEMENTED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      proposed_by: {
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
      implemented_at: {
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

    await queryInterface.addIndex("improvements", ["project_id"], { name: "idx_improvements_project_id" });
    await queryInterface.addIndex("improvements", ["incident_id"], { name: "idx_improvements_incident_id" });
    await queryInterface.addIndex("improvements", ["status"], { name: "idx_improvements_status" });
    await queryInterface.addIndex("improvements", ["proposed_by"], { name: "idx_improvements_proposed_by" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("improvements");
  }
};
