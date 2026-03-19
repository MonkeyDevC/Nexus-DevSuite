"use strict";

/**
 * Work Orders — Add missing columns (robust for existing installations).
 *
 * Motivo:
 * - En instalaciones previas, la tabla `work_orders` pudo existir sin las columnas
 *   `priority`, `assigned_to_user_id`, `delivery_id` (y otros).
 * - El hardening (soft delete + optimistic locking) ya se ejecutó, pero este migration
 *   asegura consistencia de columnas usadas por el modelo/servicios.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    async function columnExists(table, column) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '" +
            table.replace(/'/g, "''") +
            "' AND column_name = '" +
            column.replace(/'/g, "''") +
            "' LIMIT 1"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.columns WHERE table_name = '" +
          table.replace(/'/g, "''") +
          "' AND column_name = '" +
          column.replace(/'/g, "''") +
          "' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    async function tableExists(name) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '" + name.replace(/'/g, "''") + "' LIMIT 1"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = current_database() AND table_name = '" + name.replace(/'/g, "''") + "' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    const hasWorkOrders = await tableExists("work_orders");
    if (!hasWorkOrders) return;

    // priority (NOT NULL, default)
    const hasPriority = await columnExists("work_orders", "priority");
    if (!hasPriority) {
      await queryInterface.addColumn("work_orders", "priority", {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
        allowNull: false,
        defaultValue: "MEDIUM"
      });
    }

    // assigned_to_user_id (nullable)
    const hasAssigned = await columnExists("work_orders", "assigned_to_user_id");
    if (!hasAssigned) {
      await queryInterface.addColumn("work_orders", "assigned_to_user_id", {
        type: Sequelize.UUID,
        allowNull: true
      });
    }

    // delivery_id (nullable)
    const hasDelivery = await columnExists("work_orders", "delivery_id");
    if (!hasDelivery) {
      await queryInterface.addColumn("work_orders", "delivery_id", {
        type: Sequelize.UUID,
        allowNull: true
      });
    }

    // version (optimistic locking)
    const hasVersion = await columnExists("work_orders", "version");
    if (!hasVersion) {
      await queryInterface.addColumn("work_orders", "version", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }

    // deleted_at (soft delete)
    const hasDeletedAt = await columnExists("work_orders", "deleted_at");
    if (!hasDeletedAt) {
      await queryInterface.addColumn("work_orders", "deleted_at", {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Foreign keys best-effort: en MySQL, si los constraints ya existen o el dialecto
    // no soporta el addConstraint, este bloque no debe romper despliegues.
    async function addFKIfPossible({ name, table, column, referencedTable, referencedColumn, onDelete }) {
      try {
        await queryInterface.addConstraint(name, {
          fields: [column],
          type: "foreign key",
          name,
          references: {
            table: referencedTable,
            field: referencedColumn
          },
          onDelete: onDelete || "SET NULL",
          onUpdate: "CASCADE"
        });
      } catch (_) {
        // ignore best-effort
      }
    }

    await addFKIfPossible({
      name: "fk_work_orders_project_id",
      table: "work_orders",
      column: "project_id",
      referencedTable: "projects",
      referencedColumn: "id",
      onDelete: "CASCADE"
    });
    await addFKIfPossible({
      name: "fk_work_orders_assigned_to_user_id",
      table: "work_orders",
      column: "assigned_to_user_id",
      referencedTable: "users",
      referencedColumn: "id",
      onDelete: "SET NULL"
    });
    await addFKIfPossible({
      name: "fk_work_orders_delivery_id",
      table: "work_orders",
      column: "delivery_id",
      referencedTable: "code_deliveries",
      referencedColumn: "id",
      onDelete: "SET NULL"
    });
  },

  async down(queryInterface, Sequelize) {
    // Down deliberadamente no destructivo para evitar romper instalaciones existentes.
    // Este migration solo añade columnas/constraints si faltan.
  }
};

