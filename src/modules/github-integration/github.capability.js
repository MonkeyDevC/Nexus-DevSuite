/**
 * Capa de capability HTTP para GitHub — contrato estable `{ available, integrated, data, error? }`.
 * `available` = feature flag (GITHUB_ENABLED). `integrated` = OAuth configurado.
 * Los controladores y delivery-workspace deben usar este módulo, no `github.service` directamente.
 */

const githubService = require("./github.service");
const VALID_SOURCES = ["disabled", "internal", "cache", "live"];

function computeMetaSource(resolution, result) {
  const available = !!(resolution && resolution.available);
  const integrated = !!(resolution && resolution.integrated);
  const systemReady = !!(resolution && resolution.systemReady);

  if (!available || !integrated || !systemReady) return "disabled";
  if (!result || result.githubApiExecuted !== true) return "internal";
  return result.fromCache ? "cache" : "live";
}

function withMeta(base, resolution, result) {
  const available = !!(resolution && resolution.available);
  const integrated = !!(resolution && resolution.integrated);
  const systemReady = !!(resolution && resolution.systemReady);
  const usable = available && integrated && systemReady;
  const sourceRaw = computeMetaSource(resolution, result);
  const source = VALID_SOURCES.includes(sourceRaw) ? sourceRaw : "disabled";
  const meta = { usable, systemReady, source };
  return { ...base, meta };
}

async function getDefaultBranch(projectId, userId) {
  const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
  const r = await githubService.getDefaultBranchResult(projectId, userId);
  return withMeta({
    available: r.available,
    integrated: r.integrated,
    data: r.data != null ? r.data : null,
    error: r.error || null
  }, resolution, r);
}

async function getFileContentByPath(path, ref, projectId, userId) {
  const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
  const r = await githubService.getFileContentByPath(path, ref, projectId, userId);
  if (r.error) {
    return withMeta({
      available: r.available,
      integrated: r.integrated,
      data: null,
      error: r.error
    }, resolution, r);
  }
  return withMeta({
    available: r.available,
    integrated: r.integrated,
    data: {
      found: !!r.found,
      content: r.content || "",
      sha: r.sha != null ? r.sha : null
    }
  }, resolution, r);
}

async function createPullRequest(title, headBranch, baseBranch, body, projectId, userId) {
  const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
  const r = await githubService.createPullRequestOutcome(title, headBranch, baseBranch, body, projectId, userId);
  return withMeta(r, resolution, r);
}

async function getBranches(projectId, userId) {
  const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
  const r = await githubService.getBranchesResult(projectId, userId);
  return withMeta({
    available: r.available,
    integrated: r.integrated,
    data: Array.isArray(r.items) ? r.items : [],
    error: r.error
  }, resolution, r);
}

async function getPullRequests(state, projectId, userId) {
  const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
  const r = await githubService.getPullRequestsResult(state, projectId, userId);
  return withMeta({
    available: r.available,
    integrated: r.integrated,
    data: Array.isArray(r.items) ? r.items : [],
    error: r.error
  }, resolution, r);
}

async function getRepositoryStats(projectId, userId) {
  const meta = await githubService.getGithubConfigResolutionAsync(projectId, userId);
  const stats = await githubService.getRepositoryStats(projectId, userId);
  return withMeta({
    available: meta.available,
    integrated: meta.integrated,
    data: stats,
    error: null
  }, meta, { githubApiExecuted: false, fromCache: meta.fromCache });
}

module.exports = {
  getDefaultBranch,
  getFileContentByPath,
  createPullRequest,
  getBranches,
  getPullRequests,
  getRepositoryStats
};
