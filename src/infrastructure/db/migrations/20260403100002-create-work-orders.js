"use strict";

/**
 * Work Orders — infraestructura de tabla work_orders.
 *
 * - status: PENDING -> IN_PROGRESS -> IN_REVIEW -> DONE
 * - priority: LOW | MEDIUM | HIGH
 * - assigned_to_user_id: nullable
 * - delivery_id: nullable (CodeDelivery)
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

    const hasWorkOrders = await tableExists("work_orders");
    if (hasWorkOrders) return;

    await queryInterface.createTable("work_orders", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      ot_number: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "projects", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      user_story_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "user_stories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("PENDING", "IN_PROGRESS", "IN_REVIEW", "DONE"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
        allowNull: false,
        defaultValue: "MEDIUM"
      },
      assigned_to_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      delivery_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "code_deliveries", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
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

    await queryInterface.addIndex("work_orders", ["project_id"], { name: "idx_work_orders_project_id" });
    await queryInterface.addIndex("work_orders", ["user_story_id"], { name: "idx_work_orders_user_story_id" });
    await queryInterface.addIndex("work_orders", ["status"], { name: "idx_work_orders_status" });
    await queryInterface.addIndex("work_orders", ["assigned_to_user_id"], { name: "idx_work_orders_assigned_to_user_id" });
    await queryInterface.addIndex("work_orders", ["delivery_id"], { name: "idx_work_orders_delivery_id" });
    await queryInterface.addIndex("work_orders", ["project_id", "ot_number"], { name: "uq_work_orders_project_ot_number", unique: true });
  },

  async down(queryInterface) {
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
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    const hasWorkOrders = await tableExists("work_orders");
    if (!hasWorkOrders) return;

    await queryInterface.dropTable("work_orders");

    // Nota: si hay ENUM types (Postgres) deben eliminarse aquí; en MySQL esto suele manejarse automáticamente.
    // (Se deja intencionalmente sin borrar tipos explícitos para evitar errores en dialectos.)
  }
};

