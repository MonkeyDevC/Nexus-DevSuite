"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("users");

    if (!tableDefinition.deleted_at) {
      await queryInterface.addColumn("users", "deleted_at", {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable("users");

    if (tableDefinition.deleted_at) {
      await queryInterface.removeColumn("users", "deleted_at");
    }
  }
};
