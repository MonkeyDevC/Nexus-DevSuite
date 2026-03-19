"use strict";

/**
 * Work Orders — Hardening (production-grade):
 * - Soft delete: deleted_at nullable
 * - Optimistic locking: version default 0
 * - CHECK constraints (best-effort; ENUM ya cubre en MySQL)
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

    const hasWorkOrders = await tableExists("work_orders");
    if (!hasWorkOrders) return;

    const hasDeletedAt = await columnExists("work_orders", "deleted_at");
    if (!hasDeletedAt) {
      await queryInterface.addColumn("work_orders", "deleted_at", {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    const hasVersion = await columnExists("work_orders", "version");
    if (!hasVersion) {
      await queryInterface.addColumn("work_orders", "version", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    // CHECK constraints — best-effort (en MySQL, el ENUM ya valida).
    const addCheck = async (name, sql) => {
      try {
        await queryInterface.sequelize.query(sql);
      } catch (e) {
        const msg = String(e && e.message ? e.message : e);
        // Ignore duplicates / unsupported constraint syntax.
        if (/duplicate|already exists|check constraint/i.test(msg)) return;
        if (/not supported|syntax/i.test(msg)) return;
        throw e;
      }
    };

    if (dialect === "postgresql") {
      await addCheck(
        "work_orders_status_check",
        "ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check CHECK (status IN ('PENDING','IN_PROGRESS','IN_REVIEW','DONE'))"
      );
      await addCheck(
        "work_orders_priority_check",
        "ALTER TABLE work_orders ADD CONSTRAINT work_orders_priority_check CHECK (priority IN ('LOW','MEDIUM','HIGH'))"
      );
    } else if (dialect === "mysql") {
      await addCheck(
        "work_orders_status_check",
        "ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check CHECK (status IN ('PENDING','IN_PROGRESS','IN_REVIEW','DONE'))"
      );
      await addCheck(
        "work_orders_priority_check",
        "ALTER TABLE work_orders ADD CONSTRAINT work_orders_priority_check CHECK (priority IN ('LOW','MEDIUM','HIGH'))"
      );
    }
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

    const hasWorkOrders = await tableExists("work_orders");
    if (!hasWorkOrders) return;

    // Best-effort rollback: remove columns if present.
    // (We do not drop constraints to avoid dialect-specific failures.)
    const { QueryTypes } = Sequelize;
    await queryInterface.removeColumn("work_orders", "deleted_at").catch(() => {});
    await queryInterface.removeColumn("work_orders", "version").catch(() => {});
  }
};

