"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("features", "release_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "releases", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addIndex("features", ["release_id"], { name: "idx_features_release_id" });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("features", "idx_features_release_id");
    await queryInterface.removeColumn("features", "release_id");
  }
};
