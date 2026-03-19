"use strict";

/**
 * Campos para backlog profesional:
 * - user_stories: story_points, backlog_position, labels
 * - features: backlog_position
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("user_stories", "story_points", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    await queryInterface.addColumn("user_stories", "backlog_position", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    await queryInterface.addColumn("user_stories", "labels", {
      type: Sequelize.JSON,
      allowNull: true
    });
    await queryInterface.addColumn("features", "backlog_position", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("user_stories", "story_points");
    await queryInterface.removeColumn("user_stories", "backlog_position");
    await queryInterface.removeColumn("user_stories", "labels");
    await queryInterface.removeColumn("features", "backlog_position");
  }
};
