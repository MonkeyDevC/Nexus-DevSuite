/**
 * Modulo Users - Capa Service
 * Responsabilidad: coordinar operaciones de usuarios, hashing y sanitizacion de salida.
 */

const bcrypt = require("bcryptjs");
const usersRepository = require("./users.repository");
const refreshTokenRepository = require("../auth/refreshToken.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const source = typeof user.toJSON === "function" ? user.toJSON() : user;
  const {
    id,
    email,
    name,
    profile_photo_url,
    role_id,
    role,
    is_active,
    deleted_at,
    created_at,
    updated_at
  } = source;

  return {
    id,
    email,
    name: name || null,
    profile_photo_url: profile_photo_url || null,
    role_id,
    role: role ? { id: role.id, name: role.name } : null,
    is_active,
    deleted_at,
    created_at,
    updated_at
  };
}

async function buildPersistencePayload(payload, { isUpdate = false } = {}) {
  const nextPayload = { ...payload };

  if (!isUpdate && !nextPayload.password) {
    throw new AppError("La contrasena es obligatoria", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }

  if (nextPayload.password) {
    nextPayload.password_hash = await bcrypt.hash(nextPayload.password, 10);
    delete nextPayload.password;
  }

  return nextPayload;
}

async function createUser(payload, organizationId) {
  const persistencePayload = await buildPersistencePayload(payload);
  if (organizationId) persistencePayload.organization_id = organizationId;
  const user = await usersRepository.create(persistencePayload);
  return sanitizeUser(user);
}

async function getUserById(id, options = {}) {
  const user = await usersRepository.findById(id);
  if (!user) {
    throw new AppError("Usuario no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
  const { requester, organizationId } = options;
  if (organizationId != null && user.organization_id !== organizationId) {
    throw new AppError("No tiene permisos para consultar este usuario", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  if (requester && requester.role !== "MASTER" && requester.id !== id) {
    throw new AppError("No tiene permisos para consultar este usuario", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }
  return sanitizeUser(user);
}

async function getUserByEmail(email) {
  const user = await usersRepository.findByEmail(email);
  return sanitizeUser(user);
}

async function listUsers(params) {
  // Decision funcional: aplicar defaults y hard cap de paginacion a nivel service.
  const requestedPage = Number.isInteger(params?.page) ? params.page : 1;
  const requestedLimit = Number.isInteger(params?.limit) ? params.limit : 10;
  const page = requestedPage > 0 ? requestedPage : 1;
  const limit = Math.min(Math.max(requestedLimit, 1), 50);

  const result = await usersRepository.list({
    page,
    limit,
    filters: {
      email: params?.filters?.email || undefined,
      role_id: params?.filters?.role_id || undefined,
      is_active: typeof params?.filters?.is_active === "boolean" ? params.filters.is_active : undefined,
      organization_id: params?.organizationId || params?.filters?.organization_id
    }
  });

  const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);

  return {
    data: result.items.map((item) => sanitizeUser(item)),
    meta: {
      total: result.total,
      page,
      limit,
      totalPages
    }
  };
}

async function updateUser(id, payload) {
  const persistencePayload = await buildPersistencePayload(payload, { isUpdate: true });
  const user = await usersRepository.update(id, persistencePayload);
  if (!user) {
    throw new AppError("Usuario no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
  return sanitizeUser(user);
}

async function softDeleteUser(id) {
  const deleted = await usersRepository.softDelete(id);
  if (!deleted) {
    throw new AppError("Usuario no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }
}

async function invalidateUserRefreshTokens(userId) {
  return refreshTokenRepository.revokeByUserId(userId, new Date());
}

async function changeUserPassword({ targetUserId, actor, currentPassword, newPassword }) {
  const targetUser = await usersRepository.findByIdWithPassword(targetUserId);
  if (!targetUser) {
    throw new AppError("Usuario no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    });
  }

  const isMaster = actor && actor.role === "MASTER";
  const isSelf = actor && actor.id === targetUserId;
  if (!isMaster && !isSelf) {
    throw new AppError("No tiene permisos para cambiar la contrasena de este usuario", {
      statusCode: 403,
      code: ERROR_CODES.AUTH_FORBIDDEN
    });
  }

  if (!isMaster) {
    if (!currentPassword || typeof currentPassword !== "string" || !currentPassword.trim()) {
      throw new AppError("La contrasena actual es obligatoria", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, targetUser.password_hash);
    if (!isCurrentPasswordValid) {
      throw new AppError("La contrasena actual es incorrecta", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await usersRepository.update(targetUserId, { password_hash: newPasswordHash });
  await invalidateUserRefreshTokens(targetUserId);
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  listUsers,
  updateUser,
  softDeleteUser,
  changeUserPassword
};
