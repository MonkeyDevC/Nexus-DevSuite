/**
 * GitHub Integration Service - Preparación para integración con GitHub API.
 * No implementa llamadas reales aún. createBranchPayload y createPullRequestPayload
 * devuelven objetos listos para usar con axios cuando se configure token.
 *
 * Uso futuro con axios:
 *   const axios = require("axios");
 *   const payload = createBranchPayload(repo, branch, sha);
 *   await axios({ url: payload.url, method: payload.method, data: payload.data, headers: { Authorization: `Bearer ${token}` } });
 */

/**
 * Construye el payload para crear una rama vía GitHub API (refs).
 * POST /repos/:owner/:repo/git/refs
 * @param {string} repoFullName - "owner/repo"
 * @param {string} branchName - ej. feature/TASK-145-login-validation
 * @param {string} sha - commit SHA desde el que ramificar
 * @returns {{ url: string, method: string, data: object }}
 */
function createBranchPayload(repoFullName, branchName, sha) {
  const [owner, repo] = String(repoFullName || "").split("/").filter(Boolean);
  if (!owner || !repo || !branchName || !sha) {
    return { url: "", method: "post", data: null };
  }
  const refName = branchName.startsWith("refs/") ? branchName : "refs/heads/" + branchName;
  return {
    url: `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    method: "post",
    data: {
      ref: refName,
      sha: sha
    }
  };
}

/**
 * Construye el payload para crear un Pull Request vía GitHub API.
 * POST /repos/:owner/:repo/pulls
 * @param {string} repoFullName - "owner/repo"
 * @param {string} title - Título del PR
 * @param {string} head - rama origen
 * @param {string} base - rama destino (ej. main)
 * @param {string} body - Descripción del PR (opcional)
 * @returns {{ url: string, method: string, data: object }}
 */
function createPullRequestPayload(repoFullName, title, head, base, body) {
  const [owner, repo] = String(repoFullName || "").split("/").filter(Boolean);
  if (!owner || !repo || !title || !head || !base) {
    return { url: "", method: "post", data: null };
  }
  return {
    url: `https://api.github.com/repos/${owner}/${repo}/pulls`,
    method: "post",
    data: {
      title: title,
      head: head,
      base: base || "main",
      body: body || ""
    }
  };
}

module.exports = {
  createBranchPayload,
  createPullRequestPayload
};
