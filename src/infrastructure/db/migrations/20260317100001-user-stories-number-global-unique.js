"use strict";

/**
 * Hace que el campo number de user_stories sea único globalmente (US-1, US-2, ... en toda la app).
 * - Quita el índice único (feature_id, number).
 * - Renumera todas las stories por orden created_at, id.
 * - Añade índice único sobre number.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex("user_stories", "uq_user_stories_feature_number");
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM user_stories ORDER BY created_at ASC, id ASC"
    );
    for (let i = 0; i < rows.length; i++) {
      await queryInterface.sequelize.query(
        "UPDATE user_stories SET number = :num WHERE id = :id",
        { replacements: { num: i + 1, id: rows[i].id } }
      );
    }
    await queryInterface.addIndex("user_stories", ["number"], {
      unique: true,
      name: "uq_user_stories_number"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("user_stories", "uq_user_stories_number");
    await queryInterface.addIndex("user_stories", ["feature_id", "number"], {
      unique: true,
      name: "uq_user_stories_feature_number"
    });
  }
};
