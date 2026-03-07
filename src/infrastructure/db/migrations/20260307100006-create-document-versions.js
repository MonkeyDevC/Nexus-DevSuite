"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("document_versions", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "documents", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "APPROVED", "ARCHIVED"),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      change_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex("document_versions", ["document_id"], { name: "idx_document_versions_document_id" });
    await queryInterface.addIndex("document_versions", ["status"], { name: "idx_document_versions_status" });
    await queryInterface.addIndex("document_versions", ["created_by"], { name: "idx_document_versions_created_by" });
    await queryInterface.addIndex("document_versions", ["approved_by"], { name: "idx_document_versions_approved_by" });
    await queryInterface.addIndex("document_versions", ["document_id", "version_number"], {
      unique: true,
      name: "uq_document_versions_document_version"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("document_versions");
  }
};
