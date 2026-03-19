"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "automation_rule_executions";

    const tableExists = await queryInterface.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists && tableExists.length > 0) return;

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      rule_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      execution_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex(tableName, ["rule_id"], {
      name: `${tableName}_rule_idx`
    });
    await queryInterface.addIndex(tableName, ["event_type"], {
      name: `${tableName}_event_idx`
    });
    await queryInterface.addIndex(tableName, ["created_at"], {
      name: `${tableName}_created_idx`
    });
  },

  async down(queryInterface, Sequelize) {
    // No destructivo en `down` por seguridad.
  }
};

