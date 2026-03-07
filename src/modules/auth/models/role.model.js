const { DataTypes } = require("sequelize");

function defineRoleModel(sequelize) {
  return sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: "roles",
      underscored: true,
      timestamps: false
    }
  );
}

module.exports = defineRoleModel;
