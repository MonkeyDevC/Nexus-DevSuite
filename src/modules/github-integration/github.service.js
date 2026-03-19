/**
 * GitHub Integration Service — Conexión con la API oficial de GitHub.
 * Prioridad: conexión OAuth por project_id (tabla github_connections) y fallback a GITHUB_TOKEN/env.
 * El token solo se usa en backend; nunca se expone al frontend.
 */

const axios = require("axios");
const githubConnectionRepository = require("./githubConnection.repository");
const logger = require("../../config/logger");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const GITHUB_API_BASE = "https://api.github.com";

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  let owner = process.env.GITHUB_OWNER || process.env.GITHUB_REPO_OWNER;
  let repo = process.env.GITHUB_REPO || process.env.GITHUB_REPO_NAME;

  // Backward compatibility: allow GITHUB_REPO/GITHUB_REPO as "owner/repo".
  const parseOwnerRepo = function (value) {
    const s = String(value || "").trim();
    if (!s || s.indexOf("/") === -1) return null;
    const parts = s.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  };

  const githubRepoRaw = process.env.GITHUB_REPO;
  if ((!owner || !repo) && githubRepoRaw) {
    const pr = parseOwnerRepo(githubRepoRaw);
    if (pr) {
      owner = pr.owner;
      repo = pr.repo;
    }
  } else if (githubRepoRaw && githubRepoRaw.indexOf("/") !== -1) {
    // If GITHUB_REPO is "owner/repo" and individual vars are missing or partial, parse it anyway.
    const pr = parseOwnerRepo(githubRepoRaw);
    if (pr && (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO_NAME)) {
      owner = pr.owner;
      repo = pr.repo;
    }
  }

  const nexusRepoRaw = process.env.NEXUS_REPO;
  if ((!owner || !repo) && nexusRepoRaw) {
    const pr = parseOwnerRepo(nexusRepoRaw);
    if (pr) {
      owner = pr.owner;
      repo = pr.repo;
    }
  }

  return { token, owner, repo };
}

// Cache de config OAuth por (projectId, userId) para evitar N consultas y N logs en listFiles/compare.
const CONFIG_CACHE_TTL_MS = 5000;
const configCache = new Map();

function getConfigCacheKey(projectId, userId) {
  return `${projectId || ""}:${userId || ""}`;
}

function getEnvMissingVars(config) {
  const missing = [];
  if (!config || !config.token) missing.push("GITHUB_TOKEN");
  if (!config || !config.owner) missing.push("GITHUB_OWNER (o GITHUB_REPO_OWNER)");
  if (!config || !config.repo) missing.push("GITHUB_REPO (o GITHUB_REPO_NAME)");
  return missing;
}

function mapGitHubAxiosError(err, operation) {
  const statusCode = err && err.response && err.response.status ? err.response.status : 500;
  const ghData = err && err.response ? err.response.data : null;
  const ghMessage = ghData && (ghData.message || ghData.error || ghData.errors);
  const msg =
    (typeof ghMessage === "string" && ghMessage.trim()) ||
    (ghMessage && ghMessage.message && String(ghMessage.message).trim()) ||
    err && err.message ? err.message : `Error GitHub en ${operation}`;

  let code = ERROR_CODES.INTERNAL_SERVER_ERROR;
  if (statusCode === 401) code = ERROR_CODES.AUTH_UNAUTHORIZED;
  else if (statusCode === 403) code = ERROR_CODES.AUTH_FORBIDDEN;
  else if (statusCode === 404) code = ERROR_CODES.NOT_FOUND;
  else if (statusCode === 400) code = ERROR_CODES.VALIDATION_ERROR;

  const details = ghData || null;
  return new AppError(msg, { statusCode, code, details });
}

function validateGitHubEnvOrThrow() {
  // IMPORTANT: El contrato exige activación real: no retornamos safe mode 503.
  const enabled = String(process.env.GITHUB_ENABLED || "").toLowerCase() === "true";
  if (!enabled) {
    throw new AppError("GitHub integration no habilitada. Configura GITHUB_ENABLED=true", {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }

  const cfg = getConfig();
  const missing = getEnvMissingVars(cfg);
  if (missing.length) {
    throw new AppError("Faltan variables de GitHub: " + missing.join(", "), {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  return cfg;
}

/**
 * Obtiene config (token, owner, repo): primero conexión OAuth del usuario para el proyecto, luego env.
 * userId asegura que cada usuario (Master o Developer) use su propia conexión.
 * Cache de pocos segundos para evitar repetición de logs y DB en listFiles (N archivos = N+1 llamadas).
 */
async function getConfigAsync(projectId, userId) {
  const key = getConfigCacheKey(projectId, userId);
  const now = Date.now();
  const hit = configCache.get(key);
  if (hit && now - hit.at < CONFIG_CACHE_TTL_MS) {
    return hit.config;
  }

  // First try: OAuth connection in DB (access_token + repo info).
  let config;
  if (projectId && userId) {
    const conn = await githubConnectionRepository.findByProjectId(projectId, userId);
    if (conn) {
      const c = conn.toJSON ? conn.toJSON() : conn;
      if (c.access_token && (c.repo_owner || c.repo_name)) {
        config = {
          token: c.access_token,
          owner: c.repo_owner,
          repo: c.repo_name
        };
        logger.debug(
          { event: "GITHUB_CONNECTION_LOADED", project_id: projectId, repo: `${c.repo_owner}/${c.repo_name}` },
          "Using GitHub OAuth connection for project"
        );
        configCache.set(key, { config, at: now });
        return config;
      }
    }
  }

  // Second try: env configuration (real GitHub client).
  config = validateGitHubEnvOrThrow();
  if (projectId || userId) configCache.set(key, { config, at: now });
  return config;
}

/**
 * Cliente axios para GitHub. Si se pasa projectId, usa getConfigAsync(projectId).
 */
function createClient(config) {
  const c = config || getConfig();
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      Accept: "application/vnd.github+json",
      ...(c.token ? { Authorization: `Bearer ${c.token}` } : {})
    }
  });
}

function normalizeBranchForGitHub(branch) {
  if (branch == null) return branch;
  const s = String(branch).trim();
  // GitHub API de Pulls espera "branch" o "OWNER:branch", no "refs/heads/...".
  if (s.startsWith("refs/heads/")) return s.slice("refs/heads/".length);
  return s;
}

async function getRepoFullName(projectId, userId) {
  const cfg = projectId && userId ? await getConfigAsync(projectId, userId) : getConfig();
  return cfg.owner && cfg.repo ? `${cfg.owner}/${cfg.repo}` : null;
}

/**
 * Obtiene la rama por defecto del repositorio (main/master). projectId y userId para conexión OAuth por usuario.
 */
async function getDefaultBranch(projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  const repoFull = config.owner && config.repo ? `${config.owner}/${config.repo}` : null;
  if (!repoFull) throw new Error("GitHub repo no configurado (conexión OAuth o GITHUB_REPO/OWNER/NAME)");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}`);
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getDefaultBranch");
  }
  if (!data) throw new AppError("No se pudo obtener la rama por defecto de GitHub", { code: ERROR_CODES.INTERNAL_SERVER_ERROR });
  return data.default_branch || "main";
}

/**
 * Crea una rama desde baseBranch con el nombre newBranch. projectId y userId para conexión OAuth por usuario.
 */
async function createBranch(baseBranch, newBranch, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let refRes = null;
  try {
    refRes = await client.get(`/repos/${config.owner}/${config.repo}/git/ref/heads/${baseBranch}`);
  } catch (err) {
    if (err && err.response && err.response.status === 404) refRes = null;
    else throw mapGitHubAxiosError(err, "createBranch");
  }
  if (!refRes || !refRes.data || !refRes.data.object || !refRes.data.object.sha) {
    throw new Error(`No se pudo obtener el SHA de la rama ${baseBranch}`);
  }
  const sha = refRes.data.object.sha;
  const refName = newBranch.startsWith("refs/") ? newBranch : `refs/heads/${newBranch}`;
  try {
    await client.post(`/repos/${config.owner}/${config.repo}/git/refs`, { ref: refName, sha });
  } catch (err) {
    throw mapGitHubAxiosError(err, "createBranch");
  }
  return { branch: newBranch, sha };
}

/**
 * Crea un commit en una rama. projectId y userId para conexión OAuth por usuario.
 */
async function createCommit(branch, message, files, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let refRes = null;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/git/ref/heads/${branch}`);
    refRes = resp && resp.data ? resp : null;
  } catch (err) {
    if (err && err.response && err.response.status === 404) refRes = null;
    else throw mapGitHubAxiosError(err, "createCommit");
  }
  if (!refRes || !refRes.data || !refRes.data.object || !refRes.data.object.sha) {
    throw new Error(`Rama ${branch} no encontrada`);
  }
  const baseSha = refRes.data.object.sha;
  let commitRes;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/git/commits/${baseSha}`);
    commitRes = resp && resp.data ? resp : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "createCommit");
  }
  const baseTreeSha = commitRes.data.tree.sha;
  const blobShas = [];
  for (const f of files || []) {
    // Si el archivo viene como binario, `contentBase64` debe ser base64 directo de bytes.
    // Si viene como texto, usamos `content` (utf8) y lo convertimos a base64.
    const contentBase64 = f.contentBase64;
    const blobContentBase64 =
      contentBase64 != null && contentBase64 !== ""
        ? String(contentBase64)
        : Buffer.from(f.content || "", "utf8").toString("base64");
    let blobRes;
    try {
      const resp = await client.post(`/repos/${config.owner}/${config.repo}/git/blobs`, {
        content: blobContentBase64,
        encoding: "base64"
      });
      blobRes = resp && resp.data ? resp : null;
    } catch (err) {
      throw mapGitHubAxiosError(err, "createCommit");
    }
    blobShas.push({ path: f.path, sha: blobRes.data.sha });
  }
  const tree = blobShas.map(({ path, sha }) => ({ path, sha, mode: "100644", type: "blob" }));
  let treeRes;
  try {
    const resp = await client.post(`/repos/${config.owner}/${config.repo}/git/trees`, {
      base_tree: baseTreeSha,
      tree
    });
    treeRes = resp && resp.data ? resp : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "createCommit");
  }
  let commitRes2;
  try {
    const resp = await client.post(`/repos/${config.owner}/${config.repo}/git/commits`, {
      message,
      tree: treeRes.data.sha,
      parents: [baseSha]
    });
    commitRes2 = resp && resp.data ? resp : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "createCommit");
  }
  try {
    await client.patch(`/repos/${config.owner}/${config.repo}/git/refs/heads/${branch}`, {
      sha: commitRes2.data.sha
    });
  } catch (err) {
    throw mapGitHubAxiosError(err, "createCommit");
  }
  return { sha: commitRes2.data.sha };
}

/**
 * Crea un Pull Request. projectId y userId para conexión OAuth por usuario.
 */
async function createPullRequest(title, headBranch, baseBranch, body, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);

  const normalizedHead = normalizeBranchForGitHub(headBranch);
  const normalizedBase = normalizeBranchForGitHub(baseBranch || "main");

  try {
    const resp = await client.post(`/repos/${config.owner}/${config.repo}/pulls`, {
      title: title || "PR from Nexus DevSuite",
      head: normalizedHead,
      base: normalizedBase,
      body: body || ""
    });
    return resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "createPullRequest");
  }
}

/**
 * Lista ramas del repositorio. projectId y userId para conexión OAuth por usuario.
 */
async function getBranches(projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/branches`, { params: { per_page: 100 } });
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getBranches");
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Lista Pull Requests. projectId y userId para conexión OAuth por usuario.
 */
async function getPullRequests(state = "open", projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/pulls`, {
      params: { state, per_page: 100 }
    });
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getPullRequests");
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Obtiene el estado de un PR por número. projectId y userId para conexión OAuth por usuario.
 */
async function getPullRequestStatus(prNumber, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/pulls/${prNumber}`);
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getPullRequestStatus");
  }
  if (!data) throw new AppError("No se pudo obtener el estado del Pull Request", { statusCode: 404, code: ERROR_CODES.NOT_FOUND });
  return {
    number: data.number,
    state: data.state,
    title: data.title,
    head: data.head?.ref,
    base: data.base?.ref,
    html_url: data.html_url,
    merged_at: data.merged_at,
    user: data.user?.login
  };
}

/**
 * Lista commits recientes del repositorio. projectId y userId para OAuth.
 */
async function getCommits(projectId, userId, limit = 20) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/commits`, {
      params: { per_page: Math.min(100, Math.max(1, limit)) }
    });
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getCommits");
  }
  const list = Array.isArray(data) ? data : [];
  return list.map((c) => ({
    sha: c.sha,
    message: c.commit?.message ? c.commit.message.split("\n")[0] : "",
    author: c.commit?.author?.name || c.author?.login || "",
    date: c.commit?.author?.date || null,
    branch: null,
    url: c.html_url || null
  }));
}

/**
 * Lista releases del repositorio (GitHub API).
 * GET /repos/{owner}/{repo}/releases
 */
async function getReleases(projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/releases`, {
      params: { per_page: 100 }
    });
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getReleases");
  }
  const list = Array.isArray(data) ? data : [];
  logger.info(
    { event: "GITHUB_RELEASES_FETCHED", count: list.length, repo: `${config.owner}/${config.repo}` },
    "GitHub releases fetched"
  );
  return list.map((r) => ({
    id: r.id,
    tag_name: r.tag_name,
    name: r.name,
    body: r.body,
    published_at: r.published_at,
    html_url: r.html_url,
    target_commitish: r.target_commitish
  }));
}

/**
 * Formato normalizado de release para sincronización (version + source + commit_sha).
 */
function normalizeRelease(ghRelease) {
  const tagName = (ghRelease.tag_name || "").trim();
  return {
    version: tagName,
    source: "release",
    commit_sha: ghRelease.target_commitish || null,
    id: ghRelease.id,
    name: ghRelease.name,
    body: ghRelease.body,
    published_at: ghRelease.published_at
  };
}

/**
 * Lista tags del repositorio (GitHub API).
 * GET /repos/{owner}/{repo}/tags
 * Respuesta normalizada: { version, source: "tag", commit_sha }
 */
async function getRepositoryTags(projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/tags`, {
      params: { per_page: 100 }
    });
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getRepositoryTags");
  }
  const list = Array.isArray(data) ? data : [];
  logger.info(
    { event: "GITHUB_TAGS_FETCHED", count: list.length, repo: `${config.owner}/${config.repo}` },
    "GitHub tags fetched"
  );
  return list.map((t) => ({
    version: (t.name || "").trim(),
    source: "tag",
    commit_sha: t.commit && t.commit.sha ? t.commit.sha : null
  }));
}

/**
 * Crea un tag en el repositorio. sha = commit SHA (no nombre de rama).
 * POST /repos/{owner}/{repo}/git/refs
 * body: { ref: "refs/tags/vX.Y.Z", sha }
 */
async function createTag(tagName, sha, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const ref = tagName.startsWith("refs/tags/") ? tagName : `refs/tags/${tagName}`;
  const client = createClient(config);
  const { data } = await client.post(`/repos/${config.owner}/${config.repo}/git/refs`, {
    ref,
    sha
  });
  return data;
}

/**
 * Obtiene el SHA del commit al que apunta una rama (ej. "main").
 */
async function getBranchSha(branch, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  const refName = branch.startsWith("refs/") ? branch : `heads/${branch}`;
  const { data } = await client.get(`/repos/${config.owner}/${config.repo}/git/ref/${refName}`);
  return data.object && data.object.sha ? data.object.sha : null;
}

/**
 * Crea una GitHub Release.
 * POST /repos/{owner}/{repo}/releases
 */
async function createGitHubRelease(payload, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  const { data } = await client.post(`/repos/${config.owner}/${config.repo}/releases`, payload);
  return data;
}

/**
 * Lista contribuidores del repositorio. projectId y userId para OAuth.
 */
async function getContributors(projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  let data;
  try {
    const resp = await client.get(`/repos/${config.owner}/${config.repo}/contributors`, {
      params: { per_page: 100 }
    });
    data = resp && resp.data ? resp.data : null;
  } catch (err) {
    throw mapGitHubAxiosError(err, "getContributors");
  }
  const list = Array.isArray(data) ? data : [];
  return list.map((cc) => {
    let avatar = cc.avatar_url || null;
    if (avatar && !/^https?:\/\//i.test(avatar)) {
      avatar = cc.id ? `https://avatars.githubusercontent.com/u/${cc.id}?v=4` : null;
    }
    return {
      login: cc.login,
      id: cc.id,
      avatar: avatar,
      commits: cc.contributions != null ? cc.contributions : 0,
      profile_url: cc.html_url || (cc.login ? `https://github.com/${cc.login}` : null)
    };
  });
}

/**
 * Stats normalizadas del repositorio delegando en endpoints existentes del propio github.service.js.
 * Retorna el mismo contrato que usa el controller de /repository/stats.
 */
async function getRepositoryStats(projectId, userId) {
  const [branches, prsOpen, prsClosed, commits, contributors] = await Promise.all([
    getBranches(projectId, userId),
    getPullRequests("open", projectId, userId),
    getPullRequests("closed", projectId, userId),
    getCommits(projectId, userId, 1),
    getContributors(projectId, userId)
  ]);

  const lastCommitDate = commits && commits.length && commits[0].date ? commits[0].date : null;
  return {
    branches_count: Array.isArray(branches) ? branches.length : 0,
    pull_requests_open: Array.isArray(prsOpen) ? prsOpen.length : 0,
    pull_requests_closed: Array.isArray(prsClosed) ? prsClosed.length : 0,
    last_commit_date: lastCommitDate,
    contributors_count: Array.isArray(contributors) ? contributors.length : 0
  };
}

/**
 * Obtiene el contenido de un archivo en un ref (rama/tag/sha) por path.
 * Usa la Contents API (base64). Devuelve { content, sha } o null si no existe.
 */
async function getFileContentByPath(path, ref, projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) throw new Error("GitHub repo no configurado");
  const client = createClient(config);
  const safePath = String(path || "").replace(/^\/+/, "");
  if (!safePath) throw new Error("Path inválido");
  const url = `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(safePath).replace(/%2F/g, "/")}`;
  let res;
  try {
    res = await client.get(url, { params: ref ? { ref } : undefined });
  } catch (e) {
    if (e && e.response && e.response.status === 404) res = null;
    else throw mapGitHubAxiosError(e, "getFileContentByPath");
  }
  if (!res || !res.data) return null;
  if (Array.isArray(res.data)) return null;
  if (res.data && res.data.type && res.data.type !== "file") return null;
  const b64 = res.data.content ? String(res.data.content).replace(/\n/g, "") : "";
  const content = b64 ? Buffer.from(b64, "base64").toString("utf8") : "";
  return { content, sha: res.data.sha || null };
}

module.exports = {
  getConfig,
  getConfigAsync,
  getRepoFullName,
  createClient,
  getDefaultBranch,
  createBranch,
  createCommit,
  createPullRequest,
  getBranches,
  getPullRequests,
  getPullRequestStatus,
  getCommits,
  getFileContentByPath,
  getContributors,
  getRepositoryStats,
  getReleases,
  normalizeRelease,
  getRepositoryTags,
  createTag,
  getBranchSha,
  createGitHubRelease
};
