/**
 * Modelo GitHubConnection — Conexión OAuth usuario/proyecto con GitHub.
 * access_token solo en backend; nunca exponer al frontend.
 */

const { DataTypes } = require("sequelize");

function defineGitHubConnectionModel(sequelize) {
  return sequelize.define(
    "GitHubConnection",
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
      repo_owner: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      repo_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: "github_connections",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = defineGitHubConnectionModel;
