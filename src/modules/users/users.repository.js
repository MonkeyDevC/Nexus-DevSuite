/**
 * Modulo Users - Capa Repository
 * Responsabilidad: encapsular acceso a datos para usuarios.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { Op } = require("sequelize");

// Decision de seguridad: atributos permitidos para respuestas de usuarios.
const SAFE_USER_ATTRIBUTES = [
  "id",
  "email",
  "name",
  "profile_photo_url",
  "role_id",
  "organization_id",
  "is_active",
  "deleted_at",
  "created_at",
  "updated_at"
];

function getAuthModels() {
  const { User, Role } = getModels();
  if (!User) {
    throw new Error("Modelo User no registrado en loadModels");
  }
  return { User, Role };
}

function getUserModel() {
  return getAuthModels().User;
}

async function create(payload) {
  const { User } = getAuthModels();
  const created = await User.create(payload);
  return findById(created.id);
}

async function findById(id, options = {}) {
  const { User, Role } = getAuthModels();
  return User.findByPk(id, {
    attributes: SAFE_USER_ATTRIBUTES,
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    ...options
  });
}

async function findByIdWithPassword(id) {
  const User = getUserModel();
  return User.findByPk(id, {
    attributes: ["id", "email", "password_hash", "role_id", "is_active", "created_at", "updated_at"]
  });
}

async function findByEmail(email, options = {}) {
  const User = getUserModel();
  return User.findOne({
    where: { email },
    attributes: SAFE_USER_ATTRIBUTES,
    ...options
  });
}

async function list({ page = 1, limit = 10, filters = {} } = {}) {
  const { User, Role } = getAuthModels();
  const offset = (page - 1) * limit;
  const where = {};

  if (typeof filters.is_active === "boolean") {
    where.is_active = filters.is_active;
  }

  if (filters.role_id) {
    where.role_id = filters.role_id;
  }

  if (filters.email) {
    where.email = {
      [Op.like]: `%${filters.email}%`
    };
  }

  if (filters.organization_id) {
    where.organization_id = filters.organization_id;
  }

  const result = await User.findAndCountAll({
    where,
    attributes: SAFE_USER_ATTRIBUTES,
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });

  return {
    items: result.rows,
    total: result.count
  };
}

async function update(id, payload) {
  const { User, Role } = getAuthModels();
  const [updatedRows] = await User.unscoped().update(payload, { where: { id } });
  if (!updatedRows) {
    return null;
  }
  // Tras actualizar, leer el usuario sin scope (unscoped) para devolverlo siempre.
  // findById(id) usa paranoid y devolvería null si deleted_at está puesto, provocando 404.
  return User.unscoped().findByPk(id, {
    attributes: SAFE_USER_ATTRIBUTES,
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }]
  });
}

async function softDelete(id) {
  const User = getUserModel();
  const user = await findById(id);
  if (!user) {
    return false;
  }
  await user.destroy();
  return true;
}

module.exports = {
  create,
  findById,
  findByIdWithPassword,
  findByEmail,
  list,
  update,
  softDelete
};
