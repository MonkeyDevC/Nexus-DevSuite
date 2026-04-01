"use strict";

/** Campos de workspace de feature: criterios (contrato API aditivo). */

async function hasColumn(queryInterface, tableName, columnName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    { replacements: [tableName, columnName] }
  );
  return Array.isArray(rows) && rows.length > 0;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "features";

    if (!(await hasColumn(queryInterface, table, "acceptance_criteria"))) {
      await queryInterface.addColumn(table, "acceptance_criteria", {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    if (!(await hasColumn(queryInterface, table, "implementation_criteria"))) {
      await queryInterface.addColumn(table, "implementation_criteria", {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    await queryInterface.sequelize.query(
      "UPDATE features SET acceptance_criteria = CAST('[]' AS JSON) WHERE acceptance_criteria IS NULL"
    );
    await queryInterface.sequelize.query(
      "UPDATE features SET implementation_criteria = CAST('[]' AS JSON) WHERE implementation_criteria IS NULL"
    );

    async function columnIsNullable(columnName) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
        { replacements: [table, columnName] }
      );
      return (
        Array.isArray(rows) &&
        rows.length > 0 &&
        String(rows[0].IS_NULLABLE).toUpperCase() === "YES"
      );
    }

    if (await columnIsNullable("acceptance_criteria")) {
      await queryInterface.changeColumn(table, "acceptance_criteria", {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      });
    }

    if (await columnIsNullable("implementation_criteria")) {
      await queryInterface.changeColumn(table, "implementation_criteria", {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("features", "implementation_criteria");
    await queryInterface.removeColumn("features", "acceptance_criteria");
  }
};

