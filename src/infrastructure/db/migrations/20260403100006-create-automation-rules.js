"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "automation_rules";

    // MySQL: comprobación best-effort
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
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      conditions: {
        type: Sequelize.JSON,
        allowNull: true
      },
      actions: {
        type: Sequelize.JSON,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Índices
    await queryInterface.addIndex(tableName, ["tenant_id", "event_type"], {
      name: `${tableName}_tenant_event_idx`
    });
    await queryInterface.addIndex(tableName, ["is_active"], {
      name: `${tableName}_active_idx`
    });
  },

  async down(queryInterface, Sequelize) {
    // No destructivo en `down` por seguridad.
  }
};

