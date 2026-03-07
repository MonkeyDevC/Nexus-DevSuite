"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("user_stories", "sprint_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "sprints", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addIndex("user_stories", ["sprint_id"], { name: "idx_user_stories_sprint_id" });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("user_stories", "idx_user_stories_sprint_id");
    await queryInterface.removeColumn("user_stories", "sprint_id");
  }
};
