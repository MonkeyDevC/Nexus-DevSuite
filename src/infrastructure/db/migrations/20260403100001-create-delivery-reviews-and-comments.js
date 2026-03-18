"use strict";

/**
 * Code Review System (nivel GitHub):
 * delivery_reviews — decisión por revisor (PENDING, APPROVED, CHANGES_REQUESTED)
 * review_comments — comentarios por archivo/línea con respuestas
 * Índice file_path usa prefijo (255) por límite de longitud de clave en MySQL utf8mb4.
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

    const hasDeliveryReviews = await tableExists("delivery_reviews");
    if (!hasDeliveryReviews) {
      await queryInterface.createTable("delivery_reviews", {
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
        reviewer_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        status: {
          type: Sequelize.ENUM("PENDING", "APPROVED", "CHANGES_REQUESTED"),
          allowNull: false,
          defaultValue: "PENDING"
        },
        submitted_at: {
          type: Sequelize.DATE,
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
      await queryInterface.addIndex("delivery_reviews", ["delivery_id"], { name: "idx_delivery_reviews_delivery_id" });
      await queryInterface.addIndex("delivery_reviews", ["project_id"], { name: "idx_delivery_reviews_project_id" });
      await queryInterface.addIndex("delivery_reviews", ["reviewer_id"], { name: "idx_delivery_reviews_reviewer_id" });
      await queryInterface.addIndex("delivery_reviews", ["delivery_id", "reviewer_id"], {
        name: "uq_delivery_reviews_delivery_reviewer",
        unique: true
      });
    }

    const hasReviewComments = await tableExists("review_comments");
    if (!hasReviewComments) {
      await queryInterface.createTable("review_comments", {
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
        author_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        file_path: {
          type: Sequelize.STRING(1024),
          allowNull: false
        },
        line_number: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        parent_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: "review_comments", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
        }
      });
      await queryInterface.addIndex("review_comments", ["delivery_id"], { name: "idx_review_comments_delivery_id" });
      await queryInterface.addIndex("review_comments", ["project_id"], { name: "idx_review_comments_project_id" });
      await queryInterface.addIndex("review_comments", ["parent_id"], { name: "idx_review_comments_parent_id" });
    }

    if (dialect === "mysql") {
      const [indexRows] = await queryInterface.sequelize.query(
        "SELECT 1 as ok FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'review_comments' AND index_name = 'idx_review_comments_file_line'"
      );
      const hasFileLineIndex = Array.isArray(indexRows) && indexRows.length > 0;
      if (!hasFileLineIndex) {
        await queryInterface.sequelize.query(
          "CREATE INDEX idx_review_comments_file_line ON review_comments (file_path(255), line_number);"
        );
      }
    } else {
      try {
        await queryInterface.addIndex("review_comments", ["file_path", "line_number"], { name: "idx_review_comments_file_line" });
      } catch (e) {
        if (e.name !== "SequelizeDatabaseError" || !/already exists|Duplicate/.test(String(e.message))) throw e;
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("review_comments");
    await queryInterface.dropTable("delivery_reviews");
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "postgresql") {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_delivery_reviews_status";');
    }
  }
};
