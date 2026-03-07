"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("releases", "organization_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "organizations",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
    await queryInterface.addIndex("releases", ["organization_id"], { name: "idx_releases_organization_id" });
    const [orgs] = await queryInterface.sequelize.query("SELECT id FROM organizations WHERE slug = 'default' LIMIT 1");
    if (orgs && orgs.length > 0) {
      await queryInterface.sequelize.query("UPDATE releases SET organization_id = :id WHERE organization_id IS NULL", {
        replacements: { id: orgs[0].id }
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("releases", "idx_releases_organization_id");
    await queryInterface.removeColumn("releases", "organization_id");
  }
};
