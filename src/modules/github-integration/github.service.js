/**
 * GitHub Integration Service — Conexión con la API oficial de GitHub.
 * Prioridad: conexión OAuth por project_id (tabla github_connections) y fallback a GITHUB_TOKEN/env.
 * El token solo se usa en backend; nunca se expone al frontend.
 *
 * `isGitHubEnabled(projectId, userId)` (legacy): GITHUB_ENABLED=true **o** OAuth completo en BD.
 * En resultados/outcomes: `available` = solo GITHUB_ENABLED; `integrated` = solo OAuth completo.
 * `usable` = available && integrated && systemReady (control de ejecución API).
 * `getConfigAsync` no lanza si GitHub está apagado: devuelve `null` (interno).
 *
 * **Controllers y módulos HTTP:** usar `github.capability.js` (contrato `{ available, data }`), no importar este archivo.
 */

const axios = require("axios");
const githubConnectionRepository = require("./githubConnection.repository");
const { buildGithubConfigCacheKey, getGithubConfigCacheKeyPrefix } = require("./githubConfigCacheKey");
const {
  executeGithubRequest,
  getGithubApiTimeoutMs,
  normalizeGithubHttpError
} = require("./githubRequest.executor");
const { getGithubRequestStore } = require("./githubRequestContext");
const logger = require("../../config/logger");
const { AppError } = require("../../shared/errors/AppError");
const { GITHUB_ERROR_CODES } = require("./github.errorCodes");

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

/** Solo entradas positivas (config resuelto). Nunca se cachea `null` (evita estado obsoleto sin invalidación explícita). */
const positiveConfigCache = new Map();

/** Dedupe concurrente cuando no hay AsyncLocalStorage (workers/scripts). */
const inflightConfigWithoutStore = new Map();

function getConfigCacheTtlMs() {
  const n = parseInt(process.env.GITHUB_CONFIG_CACHE_TTL, 10);
  return Number.isFinite(n) && n >= 0 ? n : 5000;
}

function getConfigCacheKey(projectId, userId) {
  return `${projectId || ""}:${userId || ""}`;
}

function oauthUpdatedAtSegment(connRow) {
  if (!connRow) return "none";
  const c = connRow.toJSON ? connRow.toJSON() : connRow;
  return c.updated_at != null ? String(c.updated_at) : "none";
}

function positiveConfigCacheKey(projectId, userId, connRow) {
  return buildGithubConfigCacheKey({
    projectId,
    userId,
    enabled: isGitHubEnvFlagEnabled() ? "1" : "0",
    oauthUpdatedAt: oauthUpdatedAtSegment(connRow)
  });
}

function logGithubFeatureOffOnce(projectId, userId) {
  if (process.env.NODE_ENV === "production") {
    const store = getGithubRequestStore();
    if (store) store.featureOffLogged = true;
    return;
  }
  const store = getGithubRequestStore();
  if (store && store.featureOffLogged) return;
  if (store) store.featureOffLogged = true;
  logger.debug(
    { event: "GITHUB_FEATURE_OFF", project_id: projectId || null, user_id: userId || null },
    "GitHub no habilitado (sin GITHUB_ENABLED=true ni OAuth completo)"
  );
}

function logGithubEnvIncompleteOnce(missing) {
  const store = getGithubRequestStore();
  if (store && store.envIncompleteLogged) return;
  if (store) store.envIncompleteLogged = true;
  logger.debug(
    { event: "GITHUB_ENV_INCOMPLETE", missing },
    "GitHub: variables de entorno incompletas; sin cliente por env"
  );
}

/**
 * Invalida cache positivo para un par proyecto/usuario (p. ej. tras guardar OAuth).
 * @param {string} [projectId]
 * @param {string} [userId]
 */
function invalidateGithubConfigCache(projectId, userId) {
  const pid = projectId || "";
  const uid = userId || "";
  if (!pid && !uid) {
    positiveConfigCache.clear();
    return;
  }
  const prefix = getGithubConfigCacheKeyPrefix(pid, uid);
  for (const k of positiveConfigCache.keys()) {
    if (k.startsWith(prefix)) positiveConfigCache.delete(k);
  }
}

function getEnvMissingVars(config) {
  const missing = [];
  if (!config || !config.token) missing.push("GITHUB_TOKEN");
  if (!config || !config.owner) missing.push("GITHUB_OWNER (o GITHUB_REPO_OWNER)");
  if (!config || !config.repo) missing.push("GITHUB_REPO (o GITHUB_REPO_NAME)");
  return missing;
}

function mapGitHubAxiosError(err, operation) {
  const n = normalizeGithubHttpError(err, operation);
  const statusCode = n.statusCode != null ? n.statusCode : 500;
  const details = err && err.response ? err.response.data : null;
  return new AppError(n.message, { statusCode, code: n.code, details });
}

/** process.env.GITHUB_ENABLED === "true" */
function isGitHubEnvFlagEnabled() {
  return String(process.env.GITHUB_ENABLED || "").toLowerCase() === "true";
}

function oauthRowIsComplete(c) {
  return !!(c && c.access_token && (c.repo_owner || c.repo_name));
}

async function hasOAuthGithubConfigInDb(projectId, userId) {
  if (!projectId || !userId) return false;
  const conn = await githubConnectionRepository.findByProjectId(projectId, userId);
  if (!conn) return false;
  const c = conn.toJSON ? conn.toJSON() : conn;
  return oauthRowIsComplete(c);
}

/**
 * Fuente de verdad: GITHUB_ENABLED=true o fila OAuth completa en BD.
 * @param {{ oauthLookupDone?: boolean, connectionRow?: object|null }} [opts]
 *        Si oauthLookupDone=true, usa connectionRow del find ya hecho (evita doble query).
 */
async function isGitHubEnabled(projectId, userId, opts = {}) {
  if (isGitHubEnvFlagEnabled()) return true;
  if (opts.oauthLookupDone) {
    const row = opts.connectionRow;
    if (!row) return false;
    const c = row.toJSON ? row.toJSON() : row;
    return oauthRowIsComplete(c);
  }
  return hasOAuthGithubConfigInDb(projectId, userId);
}

/** Config env sin lanzar (lecturas). */
function tryLoadEnvGitHubConfig() {
  const cfg = getConfig();
  const missing = getEnvMissingVars(cfg);
  if (missing.length) {
    logGithubEnvIncompleteOnce(missing);
    return null;
  }
  return cfg;
}

/** Env listo por configuración (independiente del feature flag). */
function envGithubConfigReady() {
  const cfg = getConfig();
  return getEnvMissingVars(cfg).length === 0;
}

/**
 * `available`: únicamente feature flag GITHUB_ENABLED.
 * `integrated`: fila OAuth completa (independiente de env/flag).
 * @param {object|null} connRow
 */
function computeGithubIntegrationFlags(connRow) {
  const available = isGitHubEnvFlagEnabled();
  let integrated = false;
  if (connRow) {
    const c = connRow.toJSON ? connRow.toJSON() : connRow;
    if (oauthRowIsComplete(c)) integrated = true;
  }
  return { available, integrated };
}

/**
 * Resolución real de config: cache positivo (TTL) + OAuth/env.
 * `fromCache === true` solo si el objeto config salió del Map positivo (TTL vigente).
 * Tras persistir OAuth, llamar `invalidateGithubConfigCache(projectId, userId)`.
 * Siempre preserva `config` si existe (OAuth/env), aunque `available` sea false.
 * @returns {Promise<{ config: object|null, fromCache: boolean, available: boolean, integrated: boolean, usable: boolean, systemReady: boolean }>}
 */
async function resolveGithubConfigResolution(projectId, userId) {
  let connRow = null;
  const ttl = getConfigCacheTtlMs();

  if (projectId && userId) {
    connRow = await githubConnectionRepository.findByProjectId(projectId, userId);
  }

  const { available, integrated } = computeGithubIntegrationFlags(connRow);
  const systemReady = envGithubConfigReady();
  const usable = available && integrated && systemReady;

  if (projectId && userId) {
    const cacheKey = positiveConfigCacheKey(projectId, userId, connRow);
    const cached = positiveConfigCache.get(cacheKey);
    if (cached && Date.now() - cached.at < ttl) {
      return {
        config: cached.config,
        fromCache: true,
        available,
        integrated,
        usable,
        systemReady
      };
    }
  }

  if (projectId && userId && connRow) {
    const c = connRow.toJSON ? connRow.toJSON() : connRow;
    if (oauthRowIsComplete(c)) {
      const config = {
        token: c.access_token,
        owner: c.repo_owner,
        repo: c.repo_name
      };
      logger.debug(
        { event: "GITHUB_CONNECTION_LOADED", project_id: projectId, repo: `${c.repo_owner}/${c.repo_name}` },
        "Using GitHub OAuth connection for project"
      );
      const cacheKey = positiveConfigCacheKey(projectId, userId, connRow);
      positiveConfigCache.set(cacheKey, { config, at: Date.now() });
      if (!available) logGithubFeatureOffOnce(projectId, userId);
      return { config, fromCache: false, available, integrated, usable, systemReady };
    }
  }

  const fromEnv = tryLoadEnvGitHubConfig();
  if (!fromEnv) {
    if (!available) logGithubFeatureOffOnce(projectId, userId);
    return { config: null, fromCache: false, available, integrated, usable, systemReady };
  }

  if (projectId && userId) {
    const cacheKey = positiveConfigCacheKey(projectId, userId, connRow);
    positiveConfigCache.set(cacheKey, { config: fromEnv, at: Date.now() });
  }
  if (!available) logGithubFeatureOffOnce(projectId, userId);
  return { config: fromEnv, fromCache: false, available, integrated, usable, systemReady };
}

/**
 * Igual que getConfigAsync pero expone si el config vino del cache positivo (TTL).
 * Memo por request (ALS) o inflight global.
 */
async function getGithubConfigResolutionAsync(projectId, userId) {
  const memoKey = getConfigCacheKey(projectId, userId);
  const store = getGithubRequestStore();
  if (store) {
    if (!store.memoGetConfig.has(memoKey)) {
      store.memoGetConfig.set(memoKey, resolveGithubConfigResolution(projectId, userId));
    }
    return store.memoGetConfig.get(memoKey);
  }
  if (inflightConfigWithoutStore.has(memoKey)) {
    return inflightConfigWithoutStore.get(memoKey);
  }
  const p = resolveGithubConfigResolution(projectId, userId).finally(() => {
    inflightConfigWithoutStore.delete(memoKey);
  });
  inflightConfigWithoutStore.set(memoKey, p);
  return p;
}

/**
 * Config (token, owner, repo): OAuth por proyecto/usuario, luego env.
 */
async function getConfigAsync(projectId, userId) {
  const r = await getGithubConfigResolutionAsync(projectId, userId);
  return r.config;
}

/**
 * Cliente axios para GitHub. Si se pasa projectId, usa getConfigAsync(projectId).
 */
function createClient(config) {
  const c = config || getConfig();
  return axios.create({
    baseURL: GITHUB_API_BASE,
    timeout: getGithubApiTimeoutMs(),
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
  if (projectId && userId) {
    const { config: cfg, fromCache, available, integrated } = await getGithubConfigResolutionAsync(projectId, userId);
    if (cfg && cfg.owner && cfg.repo) {
      return {
        available,
        integrated,
        full_name: `${cfg.owner}/${cfg.repo}`,
        fromCache,
        githubApiExecuted: false
      };
    }
    return { available, integrated, full_name: null, githubApiExecuted: false };
  }
  const available = isGitHubEnvFlagEnabled();
  const integrated = false;
  const c = getConfig();
  if (c.owner && c.repo) {
    return {
      available,
      integrated,
      full_name: `${c.owner}/${c.repo}`,
      githubApiExecuted: false
    };
  }
  return { available, integrated: false, full_name: null, githubApiExecuted: false };
}

/**
 * Resultado estructurado (sin throw por fallo HTTP tras reintentos).
 */
async function getDefaultBranchResult(projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return {
      integrated,
      available,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.VALIDATION,
        message:
          "GitHub no configurado: conecta OAuth del proyecto o habilita GITHUB_ENABLED y variables de entorno.",
        statusCode: 400
      },
      githubApiExecuted: false
    };
  }
  const client = createClient(config);
  const exec = await executeGithubRequest(
    () => client.get(`/repos/${config.owner}/${config.repo}`),
    { operation: "getDefaultBranch", projectId, userId }
  );
  if (!exec.ok) {
    return {
      integrated,
      available,
      data: null,
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const data = exec.data;
  if (!data) {
    return {
      integrated,
      available,
      data: null,
      error: { code: GITHUB_ERROR_CODES.UNKNOWN, message: "No se pudo obtener la rama por defecto de GitHub" },
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  return {
    integrated,
    available,
    data: data.default_branch || "main",
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

/**
 * @deprecated Preferir getDefaultBranchResult; mantiene throw para llamadas legacy.
 */
async function getDefaultBranch(projectId, userId) {
  const r = await getDefaultBranchResult(projectId, userId);
  if (!r.integrated && r.error) {
    throw new AppError(r.error.message, { statusCode: r.error.statusCode || 400, code: r.error.code });
  }
  if (r.error) {
    throw new AppError(r.error.message, {
      statusCode: r.error.statusCode || 502,
      code: r.error.code,
      details: null
    });
  }
  return r.data;
}

/**
 * Crea rama — contrato escritura normalizado (sin throw).
 */
async function createBranchOutcome(baseBranch, newBranch, projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return {
      available,
      integrated,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.VALIDATION,
        message: "GitHub no configurado para este proyecto.",
        statusCode: 400
      },
      githubApiExecuted: false
    };
  }
  const client = createClient(config);
  const refExec = await executeGithubRequest(
    () => client.get(`/repos/${config.owner}/${config.repo}/git/ref/heads/${baseBranch}`),
    { operation: "createBranch_getRef", projectId, userId }
  );
  if (!refExec.ok) {
    if (refExec.error && refExec.error.statusCode === 404) {
      return {
        available,
        integrated,
        data: null,
        error: {
          code: GITHUB_ERROR_CODES.VALIDATION,
          message: `No se pudo obtener el SHA de la rama ${baseBranch}`,
          statusCode: 400
        },
        fromCache,
        githubApiExecuted: true,
        retryCount: refExec.retryCount
      };
    }
    return {
      available,
      integrated,
      data: null,
      error: refExec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: refExec.retryCount
    };
  }
  const refRes = refExec.data;
  if (!refRes || !refRes.object || !refRes.object.sha) {
    return {
      available,
      integrated,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.VALIDATION,
        message: `No se pudo obtener el SHA de la rama ${baseBranch}`,
        statusCode: 400
      },
      fromCache,
      githubApiExecuted: true,
      retryCount: refExec.retryCount
    };
  }
  const sha = refRes.object.sha;
  const refName = newBranch.startsWith("refs/") ? newBranch : `refs/heads/${newBranch}`;
  const postExec = await executeGithubRequest(
    () => client.post(`/repos/${config.owner}/${config.repo}/git/refs`, { ref: refName, sha }),
    { operation: "createBranch_postRef", projectId, userId }
  );
  if (!postExec.ok) {
    return {
      available,
      integrated,
      data: null,
      error: postExec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: Math.max(refExec.retryCount, postExec.retryCount)
    };
  }
  return {
    available,
    integrated,
    data: { branch: newBranch, sha },
    fromCache,
    githubApiExecuted: true,
    retryCount: Math.max(refExec.retryCount, postExec.retryCount)
  };
}

/** @deprecated Usar createBranchOutcome; lanza AppError para compatibilidad. */
async function createBranch(baseBranch, newBranch, projectId, userId) {
  const o = await createBranchOutcome(baseBranch, newBranch, projectId, userId);
  if (o.error) {
    throw new AppError(o.error.message, { statusCode: o.error.statusCode || 400, code: o.error.code });
  }
  return o.data;
}

/**
 * Crea un commit en una rama. projectId y userId para conexión OAuth por usuario.
 */
async function createCommitOutcome(branch, message, files, projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return {
      available,
      integrated,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.VALIDATION,
        message: "GitHub no configurado para este proyecto.",
        statusCode: 400
      },
      githubApiExecuted: false
    };
  }
  const client = createClient(config);
  const refExec = await executeGithubRequest(
    () => client.get(`/repos/${config.owner}/${config.repo}/git/ref/heads/${branch}`),
    { operation: "createCommit_getRef", projectId, userId }
  );
  if (!refExec.ok) {
    if (refExec.error && refExec.error.statusCode === 404) {
      return {
        available,
        integrated,
        data: null,
        error: { code: GITHUB_ERROR_CODES.VALIDATION, message: `Rama ${branch} no encontrada`, statusCode: 400 },
        fromCache,
        githubApiExecuted: true,
        retryCount: refExec.retryCount
      };
    }
    return {
      available,
      integrated,
      data: null,
      error: refExec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: refExec.retryCount
    };
  }
  const refBody = refExec.data;
  if (!refBody || !refBody.object || !refBody.object.sha) {
    return {
      available,
      integrated,
      data: null,
      error: { code: GITHUB_ERROR_CODES.VALIDATION, message: `Rama ${branch} no encontrada`, statusCode: 400 },
      fromCache,
      githubApiExecuted: true,
      retryCount: refExec.retryCount
    };
  }
  const baseSha = refBody.object.sha;
  const commitExec = await executeGithubRequest(
    () => client.get(`/repos/${config.owner}/${config.repo}/git/commits/${baseSha}`),
    { operation: "createCommit_getCommit", projectId, userId }
  );
  if (!commitExec.ok) {
    return {
      available,
      integrated,
      data: null,
      error: commitExec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: commitExec.retryCount
    };
  }
  const commitRes = commitExec.data;
  if (!commitRes || !commitRes.tree || !commitRes.tree.sha) {
    return {
      available,
      integrated,
      data: null,
      error: { code: GITHUB_ERROR_CODES.UNKNOWN, message: "No se pudo leer el commit base" },
      fromCache,
      githubApiExecuted: true,
      retryCount: commitExec.retryCount
    };
  }
  const baseTreeSha = commitRes.tree.sha;
  const blobShas = [];
  for (const f of files || []) {
    const contentBase64 = f.contentBase64;
    const blobContentBase64 =
      contentBase64 != null && contentBase64 !== ""
        ? String(contentBase64)
        : Buffer.from(f.content || "", "utf8").toString("base64");
    const blobExec = await executeGithubRequest(
      () =>
        client.post(`/repos/${config.owner}/${config.repo}/git/blobs`, {
          content: blobContentBase64,
          encoding: "base64"
        }),
      { operation: "createCommit_blob", projectId, userId }
    );
    if (!blobExec.ok) {
      return {
        available,
        integrated,
        data: null,
        error: blobExec.error,
        fromCache,
        githubApiExecuted: true,
        retryCount: blobExec.retryCount
      };
    }
    blobShas.push({ path: f.path, sha: blobExec.data.sha });
  }
  const tree = blobShas.map(({ path, sha }) => ({ path, sha, mode: "100644", type: "blob" }));
  const treeExec = await executeGithubRequest(
    () =>
      client.post(`/repos/${config.owner}/${config.repo}/git/trees`, {
        base_tree: baseTreeSha,
        tree
      }),
    { operation: "createCommit_tree", projectId, userId }
  );
  if (!treeExec.ok) {
    return {
      available,
      integrated,
      data: null,
      error: treeExec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: treeExec.retryCount
    };
  }
  const commit2Exec = await executeGithubRequest(
    () =>
      client.post(`/repos/${config.owner}/${config.repo}/git/commits`, {
        message,
        tree: treeExec.data.sha,
        parents: [baseSha]
      }),
    { operation: "createCommit_commit", projectId, userId }
  );
  if (!commit2Exec.ok) {
    return {
      available,
      integrated,
      data: null,
      error: commit2Exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: commit2Exec.retryCount
    };
  }
  const patchExec = await executeGithubRequest(
    () =>
      client.patch(`/repos/${config.owner}/${config.repo}/git/refs/heads/${branch}`, {
        sha: commit2Exec.data.sha
      }),
    { operation: "createCommit_patchRef", projectId, userId }
  );
  if (!patchExec.ok) {
    return {
      available,
      integrated,
      data: null,
      error: patchExec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: patchExec.retryCount
    };
  }
  return {
    available,
    integrated,
    data: { sha: commit2Exec.data.sha },
    fromCache,
    githubApiExecuted: true,
    retryCount: patchExec.retryCount
  };
}

async function createCommit(branch, message, files, projectId, userId) {
  const o = await createCommitOutcome(branch, message, files, projectId, userId);
  if (o.error) {
    throw new AppError(o.error.message, { statusCode: o.error.statusCode || 400, code: o.error.code });
  }
  return o.data;
}

async function createPullRequestOutcome(title, headBranch, baseBranch, body, projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return {
      available,
      integrated,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.VALIDATION,
        message: "GitHub no configurado para este proyecto.",
        statusCode: 400
      },
      githubApiExecuted: false
    };
  }
  const client = createClient(config);
  const normalizedHead = normalizeBranchForGitHub(headBranch);
  const normalizedBase = normalizeBranchForGitHub(baseBranch || "main");
  const exec = await executeGithubRequest(
    () =>
      client.post(`/repos/${config.owner}/${config.repo}/pulls`, {
        title: title || "PR from Nexus DevSuite",
        head: normalizedHead,
        base: normalizedBase,
        body: body || ""
      }),
    { operation: "createPullRequest", projectId, userId }
  );
  if (!exec.ok) {
    return {
      available,
      integrated,
      data: null,
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  return {
    available,
    integrated,
    data: exec.data || null,
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

async function createPullRequest(title, headBranch, baseBranch, body, projectId, userId) {
  const o = await createPullRequestOutcome(title, headBranch, baseBranch, body, projectId, userId);
  if (o.error) {
    throw new AppError(o.error.message, { statusCode: o.error.statusCode || 400, code: o.error.code });
  }
  return o.data;
}

async function getBranchesResult(projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return { integrated, available, items: [], githubApiExecuted: false };
  }
  const client = createClient(config);
  const exec = await executeGithubRequest(
    () => client.get(`/repos/${config.owner}/${config.repo}/branches`, { params: { per_page: 100 } }),
    { operation: "getBranches", projectId, userId }
  );
  if (!exec.ok) {
    return {
      integrated,
      available,
      items: [],
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const data = exec.data;
  const items = Array.isArray(data) ? data : [];
  return {
    integrated,
    available,
    items,
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

async function getBranches(projectId, userId) {
  const r = await getBranchesResult(projectId, userId);
  return r.items;
}

async function getPullRequestsResult(state = "open", projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return { integrated, available, items: [], githubApiExecuted: false };
  }
  const client = createClient(config);
  const exec = await executeGithubRequest(
    () =>
      client.get(`/repos/${config.owner}/${config.repo}/pulls`, {
        params: { state, per_page: 100 }
      }),
    { operation: "getPullRequests", projectId, userId }
  );
  if (!exec.ok) {
    return {
      integrated,
      available,
      items: [],
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const data = exec.data;
  const items = Array.isArray(data) ? data : [];
  return {
    integrated,
    available,
    items,
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

async function getPullRequests(state = "open", projectId, userId) {
  const r = await getPullRequestsResult(state, projectId, userId);
  return r.items;
}

async function getPullRequestStatus(prNumber, projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return { available, integrated, pull_request: null, githubApiExecuted: false };
  }
  const client = createClient(config);
  const exec = await executeGithubRequest(
    () => client.get(`/repos/${config.owner}/${config.repo}/pulls/${prNumber}`),
    { operation: "getPullRequestStatus", projectId, userId }
  );
  if (!exec.ok) {
    return {
      available,
      integrated,
      pull_request: null,
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const data = exec.data;
  if (!data) {
    return {
      available,
      integrated,
      pull_request: null,
      error: {
        code: GITHUB_ERROR_CODES.NOT_FOUND,
        message: "No se pudo obtener el estado del Pull Request",
        statusCode: 404
      },
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  return {
    available,
    integrated,
    pull_request: {
      number: data.number,
      state: data.state,
      title: data.title,
      head: data.head?.ref,
      base: data.base?.ref,
      html_url: data.html_url,
      merged_at: data.merged_at,
      user: data.user?.login
    },
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

function mapCommitRow(c) {
  return {
    sha: c.sha,
    message: c.commit?.message ? c.commit.message.split("\n")[0] : "",
    author: c.commit?.author?.name || c.author?.login || "",
    date: c.commit?.author?.date || null,
    branch: null,
    url: c.html_url || null
  };
}

async function getCommitsResult(projectId, userId, limit = 20) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return { integrated, available, items: [], githubApiExecuted: false };
  }
  const client = createClient(config);
  const exec = await executeGithubRequest(
    () =>
      client.get(`/repos/${config.owner}/${config.repo}/commits`, {
        params: { per_page: Math.min(100, Math.max(1, limit)) }
      }),
    { operation: "getCommits", projectId, userId }
  );
  if (!exec.ok) {
    return {
      integrated,
      available,
      items: [],
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const data = exec.data;
  const list = Array.isArray(data) ? data : [];
  return {
    integrated,
    available,
    items: list.map(mapCommitRow),
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

async function getCommits(projectId, userId, limit = 20) {
  const r = await getCommitsResult(projectId, userId, limit);
  return r.items;
}

/**
 * Lista releases del repositorio (GitHub API).
 * GET /repos/{owner}/{repo}/releases
 */
async function getReleases(projectId, userId) {
  const config = await getConfigAsync(projectId, userId);
  if (!config || !config.owner || !config.repo) return [];
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
  if (!config || !config.owner || !config.repo) return [];
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
  if (!config || !config.owner || !config.repo) {
    throw new AppError("GitHub no configurado para este proyecto.", { statusCode: 400, code: GITHUB_ERROR_CODES.VALIDATION });
  }
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
  if (!config || !config.owner || !config.repo) {
    throw new AppError("GitHub no configurado para este proyecto.", { statusCode: 400, code: GITHUB_ERROR_CODES.VALIDATION });
  }
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
  if (!config || !config.owner || !config.repo) {
    throw new AppError("GitHub no configurado para este proyecto.", { statusCode: 400, code: GITHUB_ERROR_CODES.VALIDATION });
  }
  const client = createClient(config);
  const { data } = await client.post(`/repos/${config.owner}/${config.repo}/releases`, payload);
  return data;
}

function mapContributorRow(cc) {
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
}

async function getContributorsResult(projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return { integrated, available, items: [], githubApiExecuted: false };
  }
  const client = createClient(config);
  const exec = await executeGithubRequest(
    () =>
      client.get(`/repos/${config.owner}/${config.repo}/contributors`, {
        params: { per_page: 100 }
      }),
    { operation: "getContributors", projectId, userId }
  );
  if (!exec.ok) {
    return {
      integrated,
      available,
      items: [],
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const data = exec.data;
  const list = Array.isArray(data) ? data : [];
  return {
    integrated,
    available,
    items: list.map(mapContributorRow),
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

async function getContributors(projectId, userId) {
  const r = await getContributorsResult(projectId, userId);
  return r.items;
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
 * Contenido de archivo vía Contents API (base64).
 * Contrato estable: siempre objeto { available, found, content, sha }.
 */
async function getFileContentByPath(path, ref, projectId, userId) {
  const { config, fromCache, available, integrated, usable } = await getGithubConfigResolutionAsync(projectId, userId);
  if (!usable || !config || !config.owner || !config.repo) {
    return {
      available,
      integrated,
      found: false,
      content: "",
      sha: null,
      githubApiExecuted: false
    };
  }
  const client = createClient(config);
  const safePath = String(path || "").replace(/^\/+/, "");
  if (!safePath) {
    return { available, integrated, found: false, content: "", sha: null, githubApiExecuted: false };
  }
  const url = `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(safePath).replace(/%2F/g, "/")}`;
  const exec = await executeGithubRequest(
    () => client.get(url, { params: ref ? { ref } : undefined }),
    { operation: "getFileContentByPath", projectId, userId }
  );
  if (!exec.ok) {
    if (exec.error && exec.error.statusCode === 404) {
      return {
        available,
        integrated,
        found: false,
        content: "",
        sha: null,
        fromCache,
        githubApiExecuted: true,
        retryCount: exec.retryCount
      };
    }
    return {
      available,
      integrated,
      found: false,
      content: "",
      sha: null,
      error: exec.error,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const body = exec.data;
  if (!body) {
    return {
      available,
      integrated,
      found: false,
      content: "",
      sha: null,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  if (Array.isArray(body)) {
    return {
      available,
      integrated,
      found: false,
      content: "",
      sha: null,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  if (body.type && body.type !== "file") {
    return {
      available,
      integrated,
      found: false,
      content: "",
      sha: null,
      fromCache,
      githubApiExecuted: true,
      retryCount: exec.retryCount
    };
  }
  const b64 = body.content ? String(body.content).replace(/\n/g, "") : "";
  const content = b64 ? Buffer.from(b64, "base64").toString("utf8") : "";
  return {
    available,
    integrated,
    found: true,
    content,
    sha: body.sha || null,
    fromCache,
    githubApiExecuted: true,
    retryCount: exec.retryCount
  };
}

module.exports = {
  isGitHubEnabled,
  isGitHubEnvFlagEnabled,
  invalidateGithubConfigCache,
  getConfig,
  getConfigAsync,
  getGithubConfigResolutionAsync,
  getRepoFullName,
  createClient,
  getDefaultBranch,
  getDefaultBranchResult,
  createBranch,
  createBranchOutcome,
  createCommit,
  createCommitOutcome,
  createPullRequest,
  createPullRequestOutcome,
  getBranches,
  getBranchesResult,
  getPullRequests,
  getPullRequestsResult,
  getPullRequestStatus,
  getCommits,
  getCommitsResult,
  getFileContentByPath,
  getContributors,
  getContributorsResult,
  getRepositoryStats,
  getReleases,
  normalizeRelease,
  getRepositoryTags,
  createTag,
  getBranchSha,
  createGitHubRelease
};
