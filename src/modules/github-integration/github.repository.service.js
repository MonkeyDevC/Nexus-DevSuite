/**
 * GitHub Repository Service — Árbol del repo y contenido de archivos para diff contra master.
 * Usa GitHub Git Data API (trees) y Contents API.
 * Delega lecturas normalizadas en github.capability; HTTP bajo nivel vía internal/github.internal.
 */

const githubInternal = require("./internal/github.internal");
const githubCapability = require("./github.capability");
const logger = require("../../config/logger");

const internals = githubInternal;

/**
 * Orquestador de integración: HTTP vía cliente construido con config resuelta (internals).
 */
function assertIds(projectId, userId) {
  if (!projectId) throw new Error("projectId requerido");
  if (!userId) throw new Error("userId requerido");
}

/**
 * Obtiene los archivos cambiados entre base...head usando Compare API.
 * GET /repos/{owner}/{repo}/compare/{base}...{head}
 * @returns {Promise<{ base_branch: string, head_branch: string, files: Array<{status:string, filename:string, previous_filename?:string}> }>}
 */
async function getCompareFiles(projectId, userId, baseBranch, headBranch) {
  const config = await internals.getConfigAsync(projectId, userId);
  if (!config || !config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = internals.createClient(config);

  const base = (baseBranch || "master").trim();
  const head = (headBranch || "").trim();
  if (!head) throw new Error("Head branch inválida");

  const url = `/repos/${config.owner}/${config.repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`;
  const { data } = await client.get(url, { params: { per_page: 100 } });
  const files = Array.isArray(data && data.files) ? data.files : [];
  return {
    base_branch: data && data.base_commit ? base : base,
    head_branch: head,
    files: files.map((f) => ({
      status: f.status,
      filename: f.filename,
      previous_filename: f.previous_filename
    }))
  };
}

/**
 * Obtiene la lista de archivos del repositorio en una rama (recursivo).
 * GET refs → commit → tree recursive=1. Solo devuelve paths de tipo blob (archivos).
 * @param {string} projectId
 * @param {string} userId
 * @param {string} [branch="master"]
 * @returns {Promise<{ paths: string[] }>}
 */
async function getRepositoryTree(projectId, userId, branch = "master") {
  const config = await internals.getConfigAsync(projectId, userId);
  if (!config || !config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = internals.createClient(config);
  const refName = branch.includes("/") ? branch : `heads/${branch}`;
  const refRes = await client
    .get(`/repos/${config.owner}/${config.repo}/git/ref/${refName}`)
    .catch((e) => {
      if (e && e.response && e.response.status === 404) return null;
      throw e;
    });
  if (!refRes || !refRes.data || !refRes.data.object || !refRes.data.object.sha) {
    throw new Error(`Rama ${branch} no encontrada`);
  }
  const commitSha = refRes.data.object.sha;
  const commitRes = await client.get(`/repos/${config.owner}/${config.repo}/git/commits/${commitSha}`);
  const treeSha = commitRes.data && commitRes.data.tree && commitRes.data.tree.sha;
  if (!treeSha) throw new Error("No se pudo obtener el árbol del commit");
  const treeRes = await client.get(`/repos/${config.owner}/${config.repo}/git/trees/${treeSha}`, {
    params: { recursive: 1 }
  });
  const tree = treeRes.data && treeRes.data.tree ? treeRes.data.tree : [];
  const paths = tree.filter((n) => n.type === "blob" && n.path).map((n) => n.path);
  return { paths };
}

/**
 * Contenido de archivo en rama. Contrato: { available, data } (data null si sin integración).
 * @returns {Promise<{ available: boolean, data: null | { found: boolean, content: string, sha: string | null } }>}
 */
async function getFileContent(projectId, userId, path, branch = "master") {
  return githubCapability.getFileContentByPath(path, branch, projectId, userId);
}

/**
 * Ramas — contrato capability.
 */
async function getBranches(projectId, userId) {
  assertIds(projectId, userId);
  return githubCapability.getBranches(projectId, userId);
}

/**
 * Pull Requests — contrato capability.
 */
async function getPullRequests(state = "open", projectId, userId) {
  assertIds(projectId, userId);
  return githubCapability.getPullRequests(state, projectId, userId);
}

/**
 * Stats agregadas — contrato capability { available, data }.
 */
async function getStats(projectId, userId) {
  assertIds(projectId, userId);
  return githubCapability.getRepositoryStats(projectId, userId);
}

/**
 * Snapshot de sincronización — contrato capability.
 */
async function syncRepository(projectId, userId) {
  assertIds(projectId, userId);
  return Promise.all([
    githubCapability.getBranches(projectId, userId),
    githubCapability.getPullRequests("open", projectId, userId)
  ]).then(([branches, prsOpen]) => {
    logger.info(
      {
        event: "GITHUB_REPOSITORY_SYNCED",
        project_id: projectId,
        branches_count: branches.data.length,
        prs_open_count: prsOpen.data.length
      },
      "Repository sync snapshot generated"
    );
    return {
      available: branches.available && prsOpen.available,
      data: { branches: branches.data, pull_requests_open: prsOpen.data }
    };
  });
}

module.exports = {
  getRepositoryTree,
  getCompareFiles,
  getFileContent,
  syncRepository,
  getBranches,
  getPullRequests,
  getStats
};
