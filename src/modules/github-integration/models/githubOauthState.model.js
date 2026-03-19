/**
 * Modelo para estado temporal del flujo OAuth (state) — vincula state id con user_id y project_id.
 */

const { DataTypes } = require("sequelize");

function defineGithubOauthStateModel(sequelize) {
  return sequelize.define(
    "GithubOauthState",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      return_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      }
    },
    {
      tableName: "github_oauth_states",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );
}

module.exports = defineGithubOauthStateModel;
