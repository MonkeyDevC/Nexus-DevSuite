const { DataTypes } = require("sequelize");

function defineRefreshTokenModel(sequelize) {
  return sequelize.define(
    "RefreshToken",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "refresh_tokens",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineRefreshTokenModel;
