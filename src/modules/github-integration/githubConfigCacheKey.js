/**
 * Claves de cache positivo para config GitHub (segmento enabled evita mezclar flag on/off).
 */
function buildGithubConfigCacheKey({ projectId, userId, enabled, oauthUpdatedAt }) {
  const pid = projectId != null ? String(projectId) : "";
  const uid = userId != null ? String(userId) : "";
  const en = enabled != null ? String(enabled) : "0";
  const oa = oauthUpdatedAt != null ? String(oauthUpdatedAt) : "none";
  return `gh:cfg:${pid}:${uid}:e${en}:o${oa}`;
}

function getGithubConfigCacheKeyPrefix(projectId, userId) {
  const pid = projectId != null ? String(projectId) : "";
  const uid = userId != null ? String(userId) : "";
  return `gh:cfg:${pid}:${uid}:`;
}

module.exports = {
  buildGithubConfigCacheKey,
  getGithubConfigCacheKeyPrefix
};
