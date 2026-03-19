/**
 * GitHub Delivery Service - Preparación para integración con GitHub API.
 * NO implementa llamadas reales aún. Solo payloads listos para futura integración.
 * Uso: createBranchPayload(), createPullRequestPayload(); con axios (npm install axios) cuando se configure token.
 */

/**
 * Construye el payload para crear una rama vía GitHub API (refs).
 * POST /repos/:owner/:repo/git/refs
 * @param {string} repoFullName - "owner/repo"
 * @param {string} branchName - ej. feature/TASK-145-login-validation
 * @param {string} sha - commit SHA desde el que ramificar (ej. HEAD de main)
 * @returns {object} - { url, method, data } para axios
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
 * @param {string} head - rama origen (ej. feature/TASK-145-login-validation)
 * @param {string} base - rama destino (ej. main)
 * @param {string} body - Descripción del PR (opcional)
 * @returns {object} - { url, method, data } para axios
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

/**
 * Ejemplo de llamada futura con axios (cuando se tenga token).
 * await axios({ ...createBranchPayload(...), headers: { Authorization: `Bearer ${token}` } });
 */
module.exports = {
  createBranchPayload,
  createPullRequestPayload
};
