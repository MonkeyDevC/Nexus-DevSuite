"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("releases", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      version: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          "PLANNED",
          "IN_PROGRESS",
          "QA",
          "RELEASED",
          "ROLLED_BACK",
          "ARCHIVED"
        ),
        allowNull: false,
        defaultValue: "PLANNED"
      },
      description: {
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
      released_at: {
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

    await queryInterface.addIndex("releases", ["version"], { unique: true, name: "uq_releases_version" });
    await queryInterface.addIndex("releases", ["status"], { name: "idx_releases_status" });
    await queryInterface.addIndex("releases", ["created_by"], { name: "idx_releases_created_by" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("releases");
  }
};
