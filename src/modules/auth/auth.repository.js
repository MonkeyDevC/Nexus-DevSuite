const { getModels } = require("../../infrastructure/db/loadModels");

function getAuthModels() {
  const { User, Role, RefreshToken, AuditLog } = getModels();
  return { User, Role, RefreshToken, AuditLog };
}

async function findUserByEmail(email) {
  const { User, Role } = getAuthModels();

  return User.findOne({
    where: { email },
    include: [{ model: Role, as: "role" }]
  });
}

/** Usado solo para login: devuelve usuario con password_hash para verificación. */
async function findUserByEmailForLogin(email) {
  const { User, Role } = getAuthModels();

  return User.unscoped().findOne({
    where: { email },
    include: [{ model: Role, as: "role" }]
  });
}

async function findUserById(userId) {
  const { User, Role } = getAuthModels();

  return User.findByPk(userId, {
    include: [{ model: Role, as: "role" }]
  });
}

async function createRefreshToken(payload) {
  const { RefreshToken } = getAuthModels();
  return RefreshToken.create(payload);
}

async function createAuditLog(payload) {
  const { AuditLog } = getAuthModels();
  await AuditLog.create(payload);
}

async function findAllRoles() {
  const { Role } = getAuthModels();
  return Role.findAll({
    attributes: ["id", "name", "description"],
    order: [["name", "ASC"]]
  });
}

module.exports = {
  findUserByEmail,
  findUserByEmailForLogin,
  findUserById,
  createRefreshToken,
  createAuditLog,
  findAllRoles
};
