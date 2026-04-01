/**
 * Repositorio de conexiones GitHub (OAuth). Solo backend; access_token nunca se expone.
 */

const { getModels } = require("../../infrastructure/db/loadModels");

/**
 * Busca la conexión GitHub para un proyecto y, si se indica, para un usuario.
 * Así cada usuario (Master o Developer) tiene su propia conexión por proyecto.
 */
async function findByProjectId(projectId, userId) {
  if (!projectId) return null;
  const models = getModels();
  const where = { project_id: projectId };
  if (userId) where.user_id = userId;
  const row = await models.GitHubConnection.findOne({
    where,
    attributes: ["id", "user_id", "project_id", "repo_owner", "repo_name", "access_token", "updated_at"],
    order: [["updated_at", "DESC"]]
  });
  return row;
}

function parseOwnerRepoFromEnv() {
  const owner =
    process.env.GITHUB_OWNER ||
    process.env.GITHUB_REPO_OWNER ||
    null;
  const repoName = process.env.GITHUB_REPO || process.env.GITHUB_REPO_NAME || null;

  // Compatibilidad: si GITHUB_REPO viene como "owner/repo" o NEXUS_REPO viene como "owner/repo".
  const rawRepo = process.env.GITHUB_REPO || process.env.NEXUS_REPO || process.env.GITHUB_REPO_NAME || "";
  const s = String(rawRepo || "").trim();
  if (s && s.includes("/") && (!owner || !repoName || repoName === s)) {
    const parts = s.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  }

  if (owner && repoName) return { owner, repo: repoName };
  return { owner: null, repo: null };
}

/**
 * Devuelve { connected, repo_owner, repo_name } sin access_token para el frontend.
 * Filtrado por usuario para que cada uno vea solo su conexión.
 */
async function getConnectionStatusByProjectId(projectId, userId) {
  const row = await findByProjectId(projectId, userId);
  if (!row) {
    const env = parseOwnerRepoFromEnv();
    if (env.owner && env.repo) {
      return { connected: true, repo_owner: env.owner, repo_name: env.repo };
    }
    return { connected: false, repo_owner: null, repo_name: null };
  }
  const c = row.toJSON ? row.toJSON() : row;
  return {
    connected: true,
    repo_owner: c.repo_owner || null,
    repo_name: c.repo_name || null
  };
}

module.exports = {
  findByProjectId,
  getConnectionStatusByProjectId
};
