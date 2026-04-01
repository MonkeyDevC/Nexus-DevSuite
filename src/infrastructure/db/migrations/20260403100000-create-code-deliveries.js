"use strict";

/**
 * Code Deliveries — tabla base `code_deliveries`.
 *
 * Motivo:
 * - Varias migraciones posteriores agregan FKs a `code_deliveries` (work_orders, delivery_commits, reviews/comments).
 * - En un entorno limpio, esas FKs fallan si la tabla no existe.
 *
 * Nota:
 * - Se crean columnas alineadas al modelo `CodeDelivery`.
 * - Se agregan FKs solo hacia tablas que existen en esta etapa (projects, user_stories, users).
 * - `task_id` se crea como columna requerida pero sin FK (la tabla `tasks` no tiene migración en esta ola).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    async function tableExists(name) {
      if (dialect === "mysql") {
        const [rows] = await queryInterface.sequelize.query(
          "SELECT 1 as ok FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '" +
            name.replace(/'/g, "''") +
            "' LIMIT 1"
        );
        return Array.isArray(rows) && rows.length > 0;
      }
      const r = await queryInterface.sequelize.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = current_database() AND table_name = '" +
          name.replace(/'/g, "''") +
          "' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Array.isArray(r) && r.length > 0;
    }

    const hasCodeDeliveries = await tableExists("code_deliveries");
    if (hasCodeDeliveries) return;

    await queryInterface.createTable("code_deliveries", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      delivery_number: {
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
      task_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      work_order_id: {
        type: Sequelize.UUID,
        allowNull: true
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
      branch_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      commit_hash: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      base_commit_hash: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      pull_request_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      delivery_type: {
        type: Sequelize.ENUM("FEATURE", "BUGFIX", "REFACTOR", "HOTFIX"),
        allowNull: false,
        defaultValue: "FEATURE"
      },
      status: {
        type: Sequelize.ENUM("PREPARING", "DRAFT", "READY", "LOCKED", "COMMITTED", "PR_CREATED", "MERGED"),
        allowNull: false,
        defaultValue: "PREPARING"
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      git_snapshot_json: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("code_deliveries", ["project_id"], { name: "idx_code_deliveries_project_id" });
    await queryInterface.addIndex("code_deliveries", ["user_story_id"], { name: "idx_code_deliveries_user_story_id" });
    await queryInterface.addIndex("code_deliveries", ["created_by_user_id"], { name: "idx_code_deliveries_created_by_user_id" });
    await queryInterface.addIndex("code_deliveries", ["project_id", "delivery_number"], {
      name: "uq_code_deliveries_project_delivery_number",
      unique: true
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("code_deliveries");
  }
};

