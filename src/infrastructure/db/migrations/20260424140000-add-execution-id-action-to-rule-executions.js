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
    await queryInterface.addIndex(tableName, ["execution_id"], {
      name: "idx_rule_executions_execution_id"
    }).catch(() => {});
    await queryInterface.addIndex(tableName, ["action"], {
      name: "idx_rule_executions_action"
    }).catch(() => {});
  },

  async down() {
    // No destructivo por seguridad.
  }
};
