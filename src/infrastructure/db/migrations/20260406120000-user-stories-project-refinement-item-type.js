/**
 * Product Backlog Hardening: project_id, refinement_status, item_type, feature_id nullable.
 */

"use strict";

/** @param {import("sequelize").QueryInterface} queryInterface */
/** @param {import("sequelize").Sequelize} Sequelize */
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const t = await qi.sequelize.transaction();
    try {
      const desc = await qi.describeTable("user_stories");
      if (!desc.project_id) {
        await qi.addColumn(
          "user_stories",
          "project_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: "projects", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
          },
          { transaction: t }
        );

        await qi.sequelize.query(
          `UPDATE user_stories us
           INNER JOIN features f ON us.feature_id = f.id
           SET us.project_id = f.project_id
           WHERE us.project_id IS NULL`,
          { transaction: t }
        );

        const [rows] = await qi.sequelize.query(`SELECT COUNT(*) AS c FROM user_stories WHERE project_id IS NULL`, {
          transaction: t
        });
        const cnt = rows && rows[0] ? Number(rows[0].c) : 0;
        if (cnt > 0) {
          throw new Error(`user_stories migration: ${cnt} rows still have null project_id`);
        }

        await qi.changeColumn(
          "user_stories",
          "project_id",
          {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "projects", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
          },
          { transaction: t }
        );
      }

      if (!desc.refinement_status) {
        await qi.addColumn(
          "user_stories",
          "refinement_status",
          {
            type: Sequelize.ENUM("IDEA", "DRAFT", "REFINED", "READY"),
            allowNull: false,
            defaultValue: "DRAFT"
          },
          { transaction: t }
        );

        await qi.sequelize.query(
          `UPDATE user_stories SET refinement_status = CASE
          WHEN status = 'DRAFT' THEN 'DRAFT'
          WHEN status = 'READY' THEN 'READY'
          WHEN status IN ('IN_PROGRESS','IN_REVIEW','BLOCKED') THEN 'REFINED'
          WHEN status IN ('DONE','ARCHIVED') THEN 'REFINED'
          ELSE 'DRAFT'
        END`,
          { transaction: t }
        );
      }

      const desc2 = await qi.describeTable("user_stories");
      if (!desc2.item_type) {
        await qi.addColumn(
          "user_stories",
          "item_type",
          {
            type: Sequelize.ENUM("STORY", "BUG", "TECH_TASK", "IMPROVEMENT"),
            allowNull: false,
            defaultValue: "STORY"
          },
          { transaction: t }
        );
      }

      const desc3 = await qi.describeTable("user_stories");
      const featureCol = desc3.feature_id;
      const featureAllowsNull =
        featureCol && (featureCol.allowNull === true || featureCol.allowNull === "YES" || featureCol.allowNull === 1);
      if (!featureAllowsNull) {
        const fkRefs = await qi.getForeignKeyReferencesForTable("user_stories");
        const featureFkConstraints = (fkRefs || []).filter((r) => r.columnName === "feature_id");
        for (const fk of featureFkConstraints) {
          await qi.removeConstraint("user_stories", fk.constraintName, { transaction: t });
        }
        await qi.changeColumn(
          "user_stories",
          "feature_id",
          {
            type: Sequelize.UUID,
            allowNull: true
          },
          { transaction: t }
        );
        await qi.addConstraint("user_stories", {
          fields: ["feature_id"],
          type: "foreign key",
          name: "user_stories_feature_id_fkey_pb",
          references: { table: "features", field: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          transaction: t
        });
      }

      const idxList = await qi.showIndex("user_stories");
      const hasProjectIdx = (idxList || []).some((idx) => idx.name === "idx_user_stories_project_id");
      if (!hasProjectIdx) {
        await qi.addIndex("user_stories", ["project_id"], {
          name: "idx_user_stories_project_id",
          transaction: t
        });
      }

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    const t = await qi.sequelize.transaction();
    try {
      await qi.removeIndex("user_stories", "idx_user_stories_project_id", { transaction: t });
      await qi.removeColumn("user_stories", "item_type", { transaction: t });
      await qi.removeColumn("user_stories", "refinement_status", { transaction: t });
      await qi.changeColumn(
        "user_stories",
        "feature_id",
        {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "features", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        { transaction: t }
      );
      await qi.removeColumn("user_stories", "project_id", { transaction: t });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
};
