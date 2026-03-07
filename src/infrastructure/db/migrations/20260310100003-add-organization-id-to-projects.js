"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("projects", "organization_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "organizations",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
    await queryInterface.addIndex("projects", ["organization_id"], { name: "idx_projects_organization_id" });
    await queryInterface.removeIndex("projects", "uq_projects_name");
    await queryInterface.addIndex("projects", ["organization_id", "name"], {
      unique: true,
      name: "uq_projects_organization_name"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("projects", "uq_projects_organization_name");
    await queryInterface.addIndex("projects", ["name"], { unique: true, name: "uq_projects_name" });
    await queryInterface.removeIndex("projects", "idx_projects_organization_id");
    await queryInterface.removeColumn("projects", "organization_id");
  }
};
