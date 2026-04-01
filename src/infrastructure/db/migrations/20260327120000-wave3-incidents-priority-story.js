"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("incidents", "priority", {
      type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
      allowNull: false,
      defaultValue: "MEDIUM"
    });
    await queryInterface.addColumn("incidents", "story_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "user_stories", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addIndex("incidents", ["story_id"], { name: "idx_incidents_story_id" });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("incidents", "idx_incidents_story_id");
    await queryInterface.removeColumn("incidents", "story_id");
    await queryInterface.removeColumn("incidents", "priority");
  }
};
