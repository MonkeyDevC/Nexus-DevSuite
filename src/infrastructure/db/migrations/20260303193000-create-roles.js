"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("roles", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      }
    });

    await queryInterface.addIndex("roles", ["name"], {
      unique: true,
      name: "uq_roles_name"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("roles");
  }
};
