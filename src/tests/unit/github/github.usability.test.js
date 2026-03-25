/**
 * Pruebas de usabilidad y semántica de estado de integración GitHub.
 */

jest.mock("../../../modules/github-integration/githubConnection.repository", () => ({
  findByProjectId: jest.fn()
}));

jest.mock("../../../modules/github-integration/githubRequest.executor", () => {
  const actual = jest.requireActual("../../../modules/github-integration/githubRequest.executor");
  return {
    executeGithubRequest: jest.fn(),
    getGithubApiTimeoutMs: actual.getGithubApiTimeoutMs,
    normalizeGithubHttpError: actual.normalizeGithubHttpError
  };
});

const githubConnectionRepository = require("../../../modules/github-integration/githubConnection.repository");
const { executeGithubRequest } = require("../../../modules/github-integration/githubRequest.executor");
const { GITHUB_ERROR_CODES } = require("../../../modules/github-integration/github.errorCodes");
const githubService = require("../../../modules/github-integration/github.service");
const githubCapability = require("../../../modules/github-integration/github.capability");

describe("GitHub - usability and state semantics", () => {
  const projectId = "p-write-test";
  const userId = "u-write-test";

  beforeEach(() => {
    process.env.GITHUB_ENABLED = "true";
    process.env.GITHUB_TOKEN = "env-token";
    process.env.GITHUB_OWNER = "env-owner";
    process.env.GITHUB_REPO = "env-repo";

    githubService.invalidateGithubConfigCache(projectId, userId);
    jest.clearAllMocks();

    githubConnectionRepository.findByProjectId.mockResolvedValue({
      toJSON: () => ({
        access_token: "test-token",
        repo_owner: "acme",
        repo_name: "repo",
        updated_at: "2026-01-01T00:00:00.000Z"
      })
    });
  });

  it("createPullRequestOutcome: 401 mantiene available/integrated y código AUTH_ERROR", async () => {
    executeGithubRequest.mockResolvedValue({
      ok: false,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.AUTH_ERROR,
        statusCode: 401,
        message: "Bad credentials"
      },
      retryCount: 0
    });

    const r = await githubService.createPullRequestOutcome("PR", "feat/x", "main", "", projectId, userId);

    expect(r.available).toBe(true);
    expect(r.integrated).toBe(true);
    expect(r.githubApiExecuted).toBe(true);
    expect(r.error).toBeDefined();
    expect(r.error.code).toBe(GITHUB_ERROR_CODES.AUTH_ERROR);
    expect(executeGithubRequest).toHaveBeenCalled();
  });

  it("createPullRequestOutcome: 403 mantiene available/integrated y código FORBIDDEN", async () => {
    executeGithubRequest.mockResolvedValue({
      ok: false,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.FORBIDDEN,
        statusCode: 403,
        message: "Resource not accessible by integration"
      },
      retryCount: 0
    });

    const r = await githubService.createPullRequestOutcome("PR", "feat/x", "main", "", projectId, userId);

    expect(r.available).toBe(true);
    expect(r.integrated).toBe(true);
    expect(r.error.code).toBe(GITHUB_ERROR_CODES.FORBIDDEN);
  });

  it("available=false + integrated=true + config existente: no ejecuta API y refleja metadata", async () => {
    process.env.GITHUB_ENABLED = "false";
    githubService.invalidateGithubConfigCache(projectId, userId);

    const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
    expect(resolution.available).toBe(false);
    expect(resolution.integrated).toBe(true);
    expect(resolution.usable).toBe(false);
    expect(resolution.config).toBeTruthy();

    const out = await githubService.createPullRequestOutcome("PR", "feat/z", "main", "", projectId, userId);
    expect(out.available).toBe(false);
    expect(out.integrated).toBe(true);
    expect(out.githubApiExecuted).toBe(false);
    expect(executeGithubRequest).not.toHaveBeenCalled();
  });

  it("available=true + integrated=true + systemReady=false: usable=false y sin llamada API", async () => {
    process.env.GITHUB_ENABLED = "true";
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
    githubService.invalidateGithubConfigCache(projectId, userId);

    const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
    expect(resolution.available).toBe(true);
    expect(resolution.integrated).toBe(true);
    expect(resolution.systemReady).toBe(false);
    expect(resolution.usable).toBe(false);

    const out = await githubService.createPullRequestOutcome("PR", "feat/system", "main", "", projectId, userId);
    expect(out.available).toBe(true);
    expect(out.integrated).toBe(true);
    expect(out.githubApiExecuted).toBe(false);
    expect(executeGithubRequest).not.toHaveBeenCalled();
  });

  it("available=false + integrated=false + systemReady=true: usable=false y meta.source=disabled", async () => {
    process.env.GITHUB_ENABLED = "false";
    process.env.GITHUB_TOKEN = "env-token";
    process.env.GITHUB_OWNER = "env-owner";
    process.env.GITHUB_REPO = "env-repo";
    githubConnectionRepository.findByProjectId.mockResolvedValue(null);
    githubService.invalidateGithubConfigCache(projectId, userId);

    const resolution = await githubService.getGithubConfigResolutionAsync(projectId, userId);
    expect(resolution.available).toBe(false);
    expect(resolution.integrated).toBe(false);
    expect(resolution.systemReady).toBe(true);
    expect(resolution.usable).toBe(false);

    const out = await githubCapability.getDefaultBranch(projectId, userId);
    expect(out.meta).toBeTruthy();
    expect(out.meta.usable).toBe(false);
    expect(out.meta.source).toBe("disabled");
  });
});
