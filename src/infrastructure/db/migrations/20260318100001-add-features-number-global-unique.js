"use strict";

/**
 * Añade el campo number a features y lo hace único globalmente (FT-1, FT-2, ... en toda la app).
 * - Añade columna number (nullable).
 * - Renumera todas las features por created_at, id.
 * - Cambia number a NOT NULL y añade índice único.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("features", "number", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM features ORDER BY created_at ASC, id ASC"
    );
    for (let i = 0; i < rows.length; i++) {
      await queryInterface.sequelize.query(
        "UPDATE features SET number = :num WHERE id = :id",
        { replacements: { num: i + 1, id: rows[i].id } }
      );
    }
    await queryInterface.changeColumn("features", "number", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false
    });
    await queryInterface.addIndex("features", ["number"], {
      unique: true,
      name: "uq_features_number"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("features", "uq_features_number");
    await queryInterface.removeColumn("features", "number");
  }
};
