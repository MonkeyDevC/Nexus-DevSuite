"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("change_requests", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM("FEATURE", "BUGFIX", "HOTFIX", "IMPROVEMENT", "STRUCTURAL"),
        allowNull: true
      },
      impact_level: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IMPLEMENTED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      requested_by: {
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
      entity_type: {
        type: Sequelize.ENUM("FEATURE", "RELEASE"),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: false
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

    await queryInterface.addIndex("change_requests", ["code"], { unique: true, name: "uq_cr_code" });
    await queryInterface.addIndex("change_requests", ["status"], { name: "idx_cr_status" });
    await queryInterface.addIndex("change_requests", ["entity_type", "entity_id"], { name: "idx_cr_entity" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("change_requests");
  }
};
