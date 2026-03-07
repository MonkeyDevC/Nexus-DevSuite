"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [indexesBefore] = await queryInterface.sequelize.query("SHOW INDEX FROM refresh_tokens");
    const hasIndex = (name) => indexesBefore.some((idx) => idx.Key_name === name);
    const tableDefinition = await queryInterface.describeTable("refresh_tokens");

    // Deduplica sesiones previas: conserva la fila mas reciente por usuario.
    await queryInterface.sequelize.query(`
      DELETE t1
      FROM refresh_tokens t1
      INNER JOIN refresh_tokens t2
        ON t1.user_id = t2.user_id
       AND (
         t1.updated_at < t2.updated_at
         OR (t1.updated_at = t2.updated_at AND t1.id < t2.id)
       )
    `);

    if (!tableDefinition.revoked_at) {
      await queryInterface.addColumn("refresh_tokens", "revoked_at", {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Migra el estado de revocacion previo (boolean) al nuevo esquema temporal.
    if (tableDefinition.revoked) {
      await queryInterface.sequelize.query(`
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE revoked = 1
      `);
      await queryInterface.removeColumn("refresh_tokens", "revoked");
    }

    if (!hasIndex("idx_refresh_tokens_token_hash")) {
      await queryInterface.addIndex("refresh_tokens", ["token_hash"], {
        name: "idx_refresh_tokens_token_hash"
      });
    }

    if (!hasIndex("uq_refresh_tokens_user_id")) {
      await queryInterface.addIndex("refresh_tokens", ["user_id"], {
        unique: true,
        name: "uq_refresh_tokens_user_id"
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const [indexesBefore] = await queryInterface.sequelize.query("SHOW INDEX FROM refresh_tokens");
    const hasIndex = (name) => indexesBefore.some((idx) => idx.Key_name === name);
    const tableDefinition = await queryInterface.describeTable("refresh_tokens");

    if (hasIndex("uq_refresh_tokens_user_id")) {
      await queryInterface.removeIndex("refresh_tokens", "uq_refresh_tokens_user_id");
    }
    if (hasIndex("idx_refresh_tokens_token_hash")) {
      await queryInterface.removeIndex("refresh_tokens", "idx_refresh_tokens_token_hash");
    }

    if (!tableDefinition.revoked) {
      await queryInterface.addColumn("refresh_tokens", "revoked", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE refresh_tokens
      SET revoked = CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END
    `);

    if (tableDefinition.revoked_at) {
      await queryInterface.removeColumn("refresh_tokens", "revoked_at");
    }
  }
};
