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
    if (!columns.tenant_id) {
      await queryInterface.addColumn(tableName, "tenant_id", {
        type: Sequelize.UUID,
        allowNull: true
      });
    }
  },

  async down() {
    // No destructivo por seguridad.
  }
};
