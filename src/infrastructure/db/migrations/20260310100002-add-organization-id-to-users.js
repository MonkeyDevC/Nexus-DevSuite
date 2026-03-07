"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "organization_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "organizations",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
    await queryInterface.addIndex("users", ["organization_id"], { name: "idx_users_organization_id" });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("users", "idx_users_organization_id");
    await queryInterface.removeColumn("users", "organization_id");
  }
};
