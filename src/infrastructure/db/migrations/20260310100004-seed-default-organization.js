"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const [orgs] = await queryInterface.sequelize.query(
      "SELECT id FROM organizations WHERE slug = 'default' LIMIT 1"
    );
    let defaultOrgId;
    if (orgs && orgs.length > 0) {
      defaultOrgId = orgs[0].id;
    } else {
      defaultOrgId = uuidv4();
      await queryInterface.bulkInsert("organizations", [
        {
          id: defaultOrgId,
          name: "Default",
          slug: "default",
          settings: null,
          plan: null,
          billing_email: null,
          next_billing_date: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
    await queryInterface.sequelize.query(
      "UPDATE users SET organization_id = :id WHERE organization_id IS NULL",
      { replacements: { id: defaultOrgId } }
    );
    await queryInterface.sequelize.query(
      "UPDATE projects SET organization_id = :id WHERE organization_id IS NULL",
      { replacements: { id: defaultOrgId } }
    );
  },

  async down() {
    // Seed down: no eliminar la organización default ni poner NULL masivamente para no romper FK
  }
};
