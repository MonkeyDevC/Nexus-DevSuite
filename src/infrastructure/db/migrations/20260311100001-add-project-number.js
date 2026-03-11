"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("projects", "number", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM projects ORDER BY created_at ASC, id ASC"
    );
    for (let i = 0; i < rows.length; i++) {
      await queryInterface.sequelize.query(
        "UPDATE projects SET number = :num WHERE id = :id",
        { replacements: { num: i + 1, id: rows[i].id } }
      );
    }
    await queryInterface.changeColumn("projects", "number", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false
    });
    await queryInterface.addIndex("projects", ["number"], {
      unique: true,
      name: "uq_projects_number"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("projects", "uq_projects_number");
    await queryInterface.removeColumn("projects", "number");
  }
};
