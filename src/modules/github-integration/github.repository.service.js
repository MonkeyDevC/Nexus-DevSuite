/**
 * GitHub Repository Service — Árbol del repo y contenido de archivos para diff contra master.
 * Usa GitHub Git Data API (trees) y Contents API.
 */

const githubService = require("./github.service");
const logger = require("../../config/logger");

/**
 * Orquestador de integración: el módulo de repositorio NO hace HTTP aquí.
 * Solo delega a github.service.js y valida inputs.
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
  const config = await githubService.getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = githubService.createClient(config);

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
  const config = await githubService.getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = githubService.createClient(config);
  const refName = branch.includes("/") ? branch : `heads/${branch}`;
  const refRes = await client.get(
    `/repos/${config.owner}/${config.repo}/git/ref/${refName}`
  ).catch((e) => {
    if (e && e.response && e.response.status === 404) return null;
    throw e;
  });
  if (!refRes || !refRes.data || !refRes.data.object || !refRes.data.object.sha) {
    throw new Error(`Rama ${branch} no encontrada`);
  }
  const commitSha = refRes.data.object.sha;
  const commitRes = await client.get(
    `/repos/${config.owner}/${config.repo}/git/commits/${commitSha}`
  );
  const treeSha = commitRes.data && commitRes.data.tree && commitRes.data.tree.sha;
  if (!treeSha) throw new Error("No se pudo obtener el árbol del commit");
  const treeRes = await client.get(
    `/repos/${config.owner}/${config.repo}/git/trees/${treeSha}`,
    { params: { recursive: 1 } }
  );
  const tree = treeRes.data && treeRes.data.tree ? treeRes.data.tree : [];
  const paths = tree
    .filter((n) => n.type === "blob" && n.path)
    .map((n) => n.path);
  return { paths };
}

/**
 * Obtiene el contenido de un archivo en una rama. Decodifica base64.
 * @param {string} projectId
 * @param {string} userId
 * @param {string} path - Ruta del archivo en el repo
 * @param {string} [branch="master"]
 * @returns {Promise<{ content: string, sha: string | null } | null>}
 */
async function getFileContent(projectId, userId, path, branch = "master") {
  return githubService.getFileContentByPath(path, branch, projectId, userId);
}

/**
 * Obtiene ramas (delegado en github.service.js).
 */
async function getBranches(projectId, userId) {
  assertIds(projectId, userId);
  return githubService.getBranches(projectId, userId);
}

/**
 * Obtiene Pull Requests (delegado en github.service.js).
 */
async function getPullRequests(state = "open", projectId, userId) {
  assertIds(projectId, userId);
  return githubService.getPullRequests(state, projectId, userId);
}

/**
 * Stats agregadas (delegado y normalizado).
 * Nota: solo orquesta llamadas existentes en github.service.js.
 */
async function getStats(projectId, userId) {
  assertIds(projectId, userId);
  const [branches, prsOpen, prsClosed, commits, contributors] = await Promise.all([
    githubService.getBranches(projectId, userId),
    githubService.getPullRequests("open", projectId, userId),
    githubService.getPullRequests("closed", projectId, userId),
    githubService.getCommits(projectId, userId, 1),
    githubService.getContributors(projectId, userId)
  ]);

  const lastCommitDate = commits && commits.length && commits[0].date ? commits[0].date : null;
  return {
    branches_count: (branches || []).length,
    pull_requests_open: (prsOpen || []).length,
    pull_requests_closed: (prsClosed || []).length,
    last_commit_date: lastCommitDate,
    contributors_count: (contributors || []).length
  };
}

/**
 * Sincroniza estado mínimo del repositorio (orquestación).
 * No persiste nada por ahora; devuelve un snapshot para que el caller decida.
 */
async function syncRepository(projectId, userId) {
  assertIds(projectId, userId);
  const [branches, prsOpen] = await Promise.all([githubService.getBranches(projectId, userId), githubService.getPullRequests("open", projectId, userId)]);
  logger.info(
    { event: "GITHUB_REPOSITORY_SYNCED", project_id: projectId, branches_count: branches.length, prs_open_count: prsOpen.length },
    "Repository sync snapshot generated"
  );
  return { branches, pull_requests_open: prsOpen };
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
