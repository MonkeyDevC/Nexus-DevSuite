/**
 * Pruebas de mapeo de errores HTTP de GitHub.
 */

const { normalizeGithubHttpError } = require("../../../modules/github-integration/githubRequest.executor");
const { GITHUB_ERROR_CODES } = require("../../../modules/github-integration/github.errorCodes");

describe("GitHub - error mapping", () => {
  it("401 mapea a AUTH_ERROR", () => {
    const err = { response: { status: 401, data: { message: "Bad credentials" } } };
    const out = normalizeGithubHttpError(err, "testOp");
    expect(out.statusCode).toBe(401);
    expect(out.code).toBe(GITHUB_ERROR_CODES.AUTH_ERROR);
  });

  it("403 mapea a FORBIDDEN", () => {
    const err = { response: { status: 403, data: { message: "Forbidden" } } };
    const out = normalizeGithubHttpError(err, "testOp");
    expect(out.statusCode).toBe(403);
    expect(out.code).toBe(GITHUB_ERROR_CODES.FORBIDDEN);
  });

  it("sin response mapea a NETWORK", () => {
    const out = normalizeGithubHttpError(new Error("socket hang up"), "testOp");
    expect(out.statusCode).toBe(502);
    expect(out.code).toBe(GITHUB_ERROR_CODES.NETWORK);
  });
});
