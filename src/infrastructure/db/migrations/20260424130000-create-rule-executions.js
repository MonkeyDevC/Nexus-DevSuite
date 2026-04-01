"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "rule_executions";
    const tableExists = await queryInterface.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (tableExists && tableExists.length > 0) return;

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      execution_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.ENUM("story", "work_order", "delivery"),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      target_entity: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      trigger_event: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      dry_run: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      blocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      request_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      actor_user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      evaluation_json: {
        type: Sequelize.JSON,
        allowNull: false
      },
      rule_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      allowed: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      errors: {
        type: Sequelize.JSON,
        allowNull: false
      },
      warnings: {
        type: Sequelize.JSON,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex(tableName, ["entity_type", "entity_id"], {
      name: "idx_rule_executions_entity"
    });
    await queryInterface.addIndex(tableName, ["rule_name"], {
      name: "idx_rule_executions_rule_name"
    });
    await queryInterface.addIndex(tableName, ["created_at"], {
      name: "idx_rule_executions_created_at"
    });
  },

  async down() {
    // No destructivo por seguridad.
  }
};
