/**
 * Contrato de file content en capability GitHub.
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

describe("GitHub - file content contract", () => {
  const projectId = "p-file-test";
  const userId = "u-file-test";

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

  it("404 devuelve data.found=false y error undefined", async () => {
    executeGithubRequest.mockResolvedValue({
      ok: false,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.NOT_FOUND,
        statusCode: 404,
        message: "Not Found"
      },
      retryCount: 0
    });

    const out = await githubCapability.getFileContentByPath("missing.txt", "main", projectId, userId);

    expect(out.data).toBeTruthy();
    expect(out.data.found).toBe(false);
    expect(out.error).toBeUndefined();
    expect(out.meta).toBeTruthy();
    expect(typeof out.meta.systemReady).toBe("boolean");
  });

  it("error no-404 devuelve data=null y error presente", async () => {
    executeGithubRequest.mockResolvedValue({
      ok: false,
      data: null,
      error: {
        code: GITHUB_ERROR_CODES.FORBIDDEN,
        statusCode: 403,
        message: "Forbidden"
      },
      retryCount: 0
    });

    const out = await githubCapability.getFileContentByPath("secret.txt", "main", projectId, userId);

    expect(out.data).toBeNull();
    expect(out.error).toBeTruthy();
    expect(out.error.code).toBe(GITHUB_ERROR_CODES.FORBIDDEN);
  });

  it("shape completo: available, data, error y meta estricta", async () => {
    executeGithubRequest.mockResolvedValue({
      ok: true,
      data: {
        type: "file",
        content: Buffer.from("hello", "utf8").toString("base64"),
        sha: "sha-1"
      },
      retryCount: 0
    });

    const out = await githubCapability.getFileContentByPath("README.md", "main", projectId, userId);

    expect(out).toHaveProperty("available");
    expect(out).toHaveProperty("data");
    expect(out).toHaveProperty("meta");
    expect(out.error).toBeUndefined();

    expect(out.meta).toHaveProperty("usable");
    expect(out.meta).toHaveProperty("systemReady");
    expect(out.meta).toHaveProperty("source");
    expect(["disabled", "internal", "cache", "live"]).toContain(out.meta.source);
  });
});
