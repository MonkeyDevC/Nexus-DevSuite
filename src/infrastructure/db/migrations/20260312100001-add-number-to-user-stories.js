"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("user_stories", "number", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, feature_id FROM user_stories ORDER BY feature_id ASC, created_at ASC, id ASC"
    );
    const byFeature = {};
    for (const row of rows) {
      const fid = row.feature_id;
      if (!byFeature[fid]) byFeature[fid] = [];
      byFeature[fid].push(row.id);
    }
    for (const featureId of Object.keys(byFeature)) {
      const ids = byFeature[featureId];
      for (let i = 0; i < ids.length; i++) {
        await queryInterface.sequelize.query(
          "UPDATE user_stories SET number = :num WHERE id = :id",
          { replacements: { num: i + 1, id: ids[i] } }
        );
      }
    }
    await queryInterface.changeColumn("user_stories", "number", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false
    });
    await queryInterface.addIndex("user_stories", ["feature_id", "number"], {
      unique: true,
      name: "uq_user_stories_feature_number"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("user_stories", "uq_user_stories_feature_number");
    await queryInterface.removeColumn("user_stories", "number");
  }
};
