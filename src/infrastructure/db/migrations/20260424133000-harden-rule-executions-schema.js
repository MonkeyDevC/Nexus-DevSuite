"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "rule_executions";
    const tableExists = await queryInterface.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!tableExists || tableExists.length === 0) return;

    const columns = await queryInterface.describeTable(tableName);

    if (!columns.entity_type) {
      await queryInterface.addColumn(tableName, "entity_type", {
        type: Sequelize.ENUM("story", "work_order", "delivery"),
        allowNull: false,
        defaultValue: "story"
      });
    }
    if (!columns.entity_id) {
      await queryInterface.addColumn(tableName, "entity_id", {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: "00000000-0000-0000-0000-000000000000"
      });
    }
    if (!columns.execution_id) {
      await queryInterface.addColumn(tableName, "execution_id", {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: "00000000-0000-0000-0000-000000000000"
      });
    }
    if (!columns.action) {
      await queryInterface.addColumn(tableName, "action", {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "UNKNOWN_ACTION"
      });
    }
    if (!columns.tenant_id) {
      await queryInterface.addColumn(tableName, "tenant_id", {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: "00000000-0000-0000-0000-000000000001"
      });
    }
    if (!columns.profile_id) {
      await queryInterface.addColumn(tableName, "profile_id", {
        type: Sequelize.UUID,
        allowNull: true
      });
    }
    if (!columns.target_entity) {
      await queryInterface.addColumn(tableName, "target_entity", {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: "story"
      });
    }
    if (!columns.trigger_event) {
      await queryInterface.addColumn(tableName, "trigger_event", {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: "UNKNOWN_EVENT"
      });
    }
    if (!columns.dry_run) {
      await queryInterface.addColumn(tableName, "dry_run", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!columns.blocked) {
      await queryInterface.addColumn(tableName, "blocked", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!columns.request_id) {
      await queryInterface.addColumn(tableName, "request_id", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    if (!columns.actor_user_id) {
      await queryInterface.addColumn(tableName, "actor_user_id", {
        type: Sequelize.UUID,
        allowNull: true
      });
    }
    if (!columns.evaluation_json) {
      await queryInterface.addColumn(tableName, "evaluation_json", {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      });
    }
    if (!columns.rule_name) {
      await queryInterface.addColumn(tableName, "rule_name", {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "UNKNOWN_RULE"
      });
    }
    if (!columns.allowed) {
      await queryInterface.addColumn(tableName, "allowed", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!columns.errors) {
      await queryInterface.addColumn(tableName, "errors", {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      });
    }
    if (!columns.warnings) {
      await queryInterface.addColumn(tableName, "warnings", {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      });
    }
    if (!columns.created_at) {
      await queryInterface.addColumn(tableName, "created_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      });
    }

    await queryInterface.addIndex(tableName, ["entity_type", "entity_id"], {
      name: "idx_rule_executions_entity"
    }).catch(() => {});
    await queryInterface.addIndex(tableName, ["rule_name"], {
      name: "idx_rule_executions_rule_name"
    }).catch(() => {});
    await queryInterface.addIndex(tableName, ["created_at"], {
      name: "idx_rule_executions_created_at"
    }).catch(() => {});
  },

  async down() {
    // No destructivo por seguridad.
  }
};
