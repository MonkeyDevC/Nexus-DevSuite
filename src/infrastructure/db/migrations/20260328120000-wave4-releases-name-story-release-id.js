"use strict";

/**
 * WAVE 4 — Releases: name en releases; release_id en user_stories (fuente canónica).
 * features.release_id permanece legacy; no se elimina.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const relDesc = await queryInterface.describeTable("releases");
    if (!relDesc.name) {
      await queryInterface.addColumn("releases", "name", {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      await queryInterface.sequelize.query(
        "UPDATE releases SET name = version WHERE name IS NULL OR TRIM(name) = ''"
      );
      await queryInterface.changeColumn("releases", "name", {
        type: Sequelize.STRING(255),
        allowNull: false
      });
    }

    const stDesc = await queryInterface.describeTable("user_stories");
    if (!stDesc.release_id) {
      await queryInterface.addColumn("user_stories", "release_id", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "releases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      });
    }
    try {
      await queryInterface.addIndex("user_stories", ["release_id"], { name: "idx_user_stories_release_id" });
    } catch {
      /* index ya existe */
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("user_stories", "idx_user_stories_release_id");
    await queryInterface.removeColumn("user_stories", "release_id");
    await queryInterface.removeColumn("releases", "name");
  }
};
