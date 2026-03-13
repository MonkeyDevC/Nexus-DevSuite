const { DataTypes } = require("sequelize");

function defineAuditLogModel(sequelize) {
  return sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      entity: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      },
      request_id: {
        type: DataTypes.STRING(36),
        allowNull: true
      },
      ip_address: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "audit_logs",
      underscored: true,
      timestamps: false
    }
  );
}

module.exports = defineAuditLogModel;
