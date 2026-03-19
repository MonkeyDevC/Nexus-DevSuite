"use strict";

/**
 * Delivery Workspace — añade work_order_id a delivery_commits.
 * Requisito: cuando se hace commit desde delivery-workspace, se guarda la Work Order asociada.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    async function tableExists(name) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '" + name.replace(/'/g, "''") + "'"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = current_database() AND table_name = '" + name.replace(/'/g, "''") + "'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    async function columnExists(table, column) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '" +
            table.replace(/'/g, "''") +
            "' AND column_name = '" +
            column.replace(/'/g, "''") +
            "'"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_database() AND table_name = '" +
          table.replace(/'/g, "''") +
          "' AND column_name = '" +
          column.replace(/'/g, "''") +
          "'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    const hasDeliveryCommits = await tableExists("delivery_commits");

    if (!hasDeliveryCommits) {
      await queryInterface.createTable("delivery_commits", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        project_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "projects", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        delivery_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "code_deliveries", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        work_order_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: "work_orders", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        commit_sha: {
          type: Sequelize.STRING(64),
          allowNull: false
        },
        commit_message: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        author: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
        }
      });

      await queryInterface.addIndex("delivery_commits", ["delivery_id"], { name: "idx_delivery_commits_delivery_id" });
      await queryInterface.addIndex("delivery_commits", ["project_id"], { name: "idx_delivery_commits_project_id" });
      await queryInterface.addIndex("delivery_commits", ["work_order_id"], { name: "idx_delivery_commits_work_order_id" });
      return;
    }

    const hasWorkOrderIdCol = await columnExists("delivery_commits", "work_order_id");
    if (hasWorkOrderIdCol) return;

    await queryInterface.addColumn("delivery_commits", "work_order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "work_orders", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addIndex("delivery_commits", ["work_order_id"], { name: "idx_delivery_commits_work_order_id" });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    async function tableExists(name) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '" + name.replace(/'/g, "''") + "'"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = current_database() AND table_name = '" + name.replace(/'/g, "''") + "'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    async function columnExists(table, column) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '" +
            table.replace(/'/g, "''") +
            "' AND column_name = '" +
            column.replace(/'/g, "''") +
            "'"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = current_database() AND table_name = '" +
          table.replace(/'/g, "''") +
          "' AND column_name = '" +
          column.replace(/'/g, "''") +
          "'",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    const hasDeliveryCommits = await tableExists("delivery_commits");
    if (!hasDeliveryCommits) return;

    const hasWorkOrderIdCol = await columnExists("delivery_commits", "work_order_id");
    if (!hasWorkOrderIdCol) return;

    await queryInterface.removeColumn("delivery_commits", "work_order_id");
    try {
      await queryInterface.removeIndex("delivery_commits", "idx_delivery_commits_work_order_id");
    } catch (_) {
      // best-effort cleanup
    }
  }
};

