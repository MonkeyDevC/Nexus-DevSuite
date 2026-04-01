/**
 * Modulo Users - Capa Model
 * Responsabilidad: definir el esquema Sequelize de usuarios con soft delete.
 */

function defineUserModel(sequelize, DataTypes) {
  if (sequelize.models.User) {
    // Decision de integracion: reutilizar el modelo ya registrado para evitar duplicidad.
    return sequelize.models.User;
  }

  // Decision de seguridad: por defecto nunca se expone password_hash.
  const safeAttributes = {
    exclude: ["password_hash"]
  };

  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      profile_photo_url: {
        type: DataTypes.STRING(512),
        allowNull: true
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
      hooks: {
        /**
         * Evita colisiones por email en suites de QA cuando existe un usuario
         * soft-deleted con el mismo email: se "revive" en lugar de intentar insertar duplicado.
         */
        beforeValidate: async (instance, options) => {
          if (!instance.isNewRecord || !instance.email) return;
          const existing = await User.unscoped().findOne({
            where: { email: instance.email },
            paranoid: false,
            transaction: options?.transaction
          });
          if (!existing) return;
          instance.set("id", existing.id);
          instance.set("deleted_at", null);
          instance.isNewRecord = false;
        }
      },
      defaultScope: {
        attributes: safeAttributes
      }
    }
  );

  User.associate = (models) => {
    if (models.Role) {
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role"
      });
    }
  };

  return User;
}

module.exports = {
  defineUserModel
};
