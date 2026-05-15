"use strict";

/** Tipo de orden: trabajo productivo vs reproceso (UX WO / RW). */
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

    const has = await columnExists("work_orders", "kind");
    if (has) return;

    await queryInterface.addColumn("work_orders", "kind", {
      type: Sequelize.ENUM("WORK", "REWORK"),
      allowNull: false,
      defaultValue: "WORK"
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn("work_orders", "kind");
    } catch (_) {
      /* no destructivo */
    }
  }
};
