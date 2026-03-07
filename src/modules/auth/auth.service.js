const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const repository = require("./auth.repository");
const refreshTokenRepository = require("./refreshToken.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { incrementCounter } = require("../../system/metrics/metrics.store");

function createAppError(statusCode, code, message, details = null) {
  return new AppError(message, {
    statusCode,
    code,
    details
  });
}

function throwRefreshFailure(code, message) {
  incrementCounter("refresh_failures");
  throw createAppError(401, code, message);
}

function parseDurationToMs(duration, fallbackMs) {
  const match = /^(\d+)([mhd])$/.exec(duration || "");
  if (!match) {
    return fallbackMs;
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  return fallbackMs;
}

function createTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role ? user.role.name : null
  };
}

function signAccessToken(user) {
  return jwt.sign(createTokenPayload(user), env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      ...createTokenPayload(user),
      token_type: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      jwtid: crypto.randomUUID()
    }
  );
}

function normalizeRefreshToken(refreshToken) {
  return crypto.createHash("sha256").update(refreshToken).digest("hex");
}

function buildUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role ? user.role.name : null
  };
}

function getRequestMeta(context) {
  return {
    ip_address: context.ipAddress || null,
    user_agent: context.userAgent || null,
    request_id: context.requestId || null
  };
}

async function registerAuditEvent({ userId, action, entity, entityId, metadata, context }) {
  await repository.createAuditLog({
    user_id: userId || null,
    action,
    entity,
    entity_id: entityId || null,
    request_id: context.requestId || null,
    metadata: {
      ...metadata,
      request_id: context.requestId || null
    },
    ip_address: context.ipAddress || null,
    user_agent: context.userAgent || null
  });
}

async function login({ email, password, context }) {
  const user = await repository.findUserByEmailForLogin(email);
  if (!user) {
    throw createAppError(401, ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Credenciales invalidas");
  }

  if (!user.is_active) {
    throw createAppError(403, ERROR_CODES.AUTH_FORBIDDEN, "El usuario se encuentra inactivo");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw createAppError(401, ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Credenciales invalidas");
  }

  const accessToken = signAccessToken(user);
  const refreshTokenRaw = signRefreshToken(user);
  const refreshTokenHash = await bcrypt.hash(normalizeRefreshToken(refreshTokenRaw), 10);
  const refreshTokenExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiresMs);

  await refreshTokenRepository.upsertByUserId(user.id, refreshTokenHash, refreshTokenExpiresAt, null);

  await registerAuditEvent({
    userId: user.id,
    action: "AUTH_LOGIN",
    entity: "user",
    entityId: user.id,
    metadata: { ...getRequestMeta(context), strategy: "UPSERT_SINGLE_SESSION" },
    context
  });

  return {
    access_token: accessToken,
    refresh_token: refreshTokenRaw,
    user: buildUserResponse(user)
  };
}

async function refresh({ refreshToken, context }) {
  let refreshPayload;
  try {
    refreshPayload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token invalido");
  }

  const userId = refreshPayload.sub;
  const tokenRecord = await refreshTokenRepository.findByUserId(userId);

  if (!tokenRecord) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token invalido");
  }

  const isTokenMatch = await bcrypt.compare(normalizeRefreshToken(refreshToken), tokenRecord.token_hash);
  if (!isTokenMatch) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token invalido");
  }

  if (tokenRecord.revoked_at) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token revocado");
  }

  if (tokenRecord.expires_at.getTime() <= Date.now()) {
    throwRefreshFailure(ERROR_CODES.AUTH_TOKEN_EXPIRED, "Refresh token expirado");
  }

  const user = await repository.findUserById(userId);
  if (!user || !user.is_active) {
    throwRefreshFailure(ERROR_CODES.AUTH_UNAUTHORIZED, "Usuario no habilitado para refrescar sesion");
  }

  const nextRefreshTokenRaw = signRefreshToken(user);
  const nextRefreshTokenHash = await bcrypt.hash(normalizeRefreshToken(nextRefreshTokenRaw), 10);
  const refreshTokenExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);
  const nextRefreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiresMs);

  await refreshTokenRepository.upsertByUserId(user.id, nextRefreshTokenHash, nextRefreshTokenExpiresAt, null);

  await registerAuditEvent({
    userId: user.id,
    action: "AUTH_REFRESH",
    entity: "user",
    entityId: user.id,
    metadata: {
      ...getRequestMeta(context),
      strategy: "ROTATION_UPSERT"
    },
    context
  });

  return {
    access_token: signAccessToken(user),
    refresh_token: nextRefreshTokenRaw,
    user: buildUserResponse(user)
  };
}

async function logout({ refreshToken, context }) {
  let refreshPayload;
  try {
    refreshPayload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token invalido");
  }

  const userId = refreshPayload.sub;
  const tokenRecord = await refreshTokenRepository.findByUserId(userId);

  if (!tokenRecord) {
    throwRefreshFailure(ERROR_CODES.AUTH_UNAUTHORIZED, "Sesion no encontrada");
  }

  const isTokenMatch = await bcrypt.compare(normalizeRefreshToken(refreshToken), tokenRecord.token_hash);
  if (!isTokenMatch) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token invalido");
  }

  if (tokenRecord.revoked_at) {
    throwRefreshFailure(ERROR_CODES.AUTH_REFRESH_REPLAY, "Refresh token revocado");
  }

  if (tokenRecord.expires_at.getTime() <= Date.now()) {
    throwRefreshFailure(ERROR_CODES.AUTH_TOKEN_EXPIRED, "Refresh token expirado");
  }

  await refreshTokenRepository.revokeByUserId(userId, new Date());

  await registerAuditEvent({
    userId,
    action: "AUTH_LOGOUT",
    entity: "user",
    entityId: userId,
    metadata: {
      ...getRequestMeta(context),
      strategy: "REFRESH_TOKEN_LOGOUT"
    },
    context
  });
}

module.exports = {
  login,
  refresh,
  logout
};
