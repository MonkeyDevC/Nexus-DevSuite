const { getModels } = require("../../infrastructure/db/loadModels");

function getRefreshTokenModel() {
  const { RefreshToken } = getModels();
  return RefreshToken;
}

async function findByUserId(userId) {
  const RefreshToken = getRefreshTokenModel();
  return RefreshToken.findOne({ where: { user_id: userId } });
}

async function upsertByUserId(userId, tokenHash, expiresAt, revokedAt = null) {
  const RefreshToken = getRefreshTokenModel();
  const existingToken = await findByUserId(userId);

  if (existingToken) {
    await existingToken.update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: revokedAt
    });
    return existingToken;
  }

  return RefreshToken.create({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    revoked_at: revokedAt
  });
}

async function revokeByUserId(userId, revokedAt = new Date()) {
  const RefreshToken = getRefreshTokenModel();
  const [affectedRows] = await RefreshToken.update(
    { revoked_at: revokedAt },
    { where: { user_id: userId } }
  );

  return affectedRows;
}

module.exports = {
  findByUserId,
  upsertByUserId,
  revokeByUserId
};
