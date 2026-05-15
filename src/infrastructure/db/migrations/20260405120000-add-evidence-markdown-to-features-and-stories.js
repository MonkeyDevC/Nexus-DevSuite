"use strict";

/**
 * Evidencia técnica independiente por nivel: proyecto (ya existía), feature y user story.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    async function columnExists(table, column) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1",
          { replacements: [table, column] }
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ? LIMIT 1",
        { replacements: [table, column], type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    if (!(await columnExists("features", "evidence_markdown"))) {
      await queryInterface.addColumn("features", "evidence_markdown", {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: ""
      });
    }

    if (!(await columnExists("user_stories", "evidence_markdown"))) {
      await queryInterface.addColumn("user_stories", "evidence_markdown", {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: ""
      });
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn("user_stories", "evidence_markdown");
    } catch (_) {
      /* no destructivo */
    }
    try {
      await queryInterface.removeColumn("features", "evidence_markdown");
    } catch (_) {
      /* no destructivo */
    }
  }
};
