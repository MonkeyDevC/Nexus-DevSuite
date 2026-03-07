"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("organizations", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: true
      },
      plan: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      billing_email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      next_billing_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("organizations", ["slug"], {
      unique: true,
      name: "uq_organizations_slug"
    });
    await queryInterface.addIndex("organizations", ["name"], { name: "idx_organizations_name" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("organizations");
  }
};
