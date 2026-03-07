"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("audit_logs", ["user_id"], {
      name: "idx_audit_logs_user_id"
    });

    await queryInterface.addIndex("audit_logs", ["created_at"], {
      name: "idx_audit_logs_created_at"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  }
};
