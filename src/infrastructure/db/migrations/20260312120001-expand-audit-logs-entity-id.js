"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("audit_logs", "entity_id", {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("audit_logs", "entity_id", {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  }
};

