"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("audit_logs", "request_id", {
      type: Sequelize.STRING(36),
      allowNull: true
    });

    await queryInterface.addIndex("audit_logs", ["request_id"], {
      name: "idx_audit_logs_request_id"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("audit_logs", "idx_audit_logs_request_id");
    await queryInterface.removeColumn("audit_logs", "request_id");
  }
};
