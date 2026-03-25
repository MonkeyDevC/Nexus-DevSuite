const logger = require("../../config/logger");
const { GITHUB_ERROR_CODES } = require("./github.errorCodes");

function getGithubApiTimeoutMs() {
  const n = parseInt(process.env.GITHUB_API_TIMEOUT_MS, 10);
  return Number.isFinite(n) && n > 0 ? n : 30000;
}

function getGithubMaxRetries() {
  const n = parseInt(process.env.GITHUB_API_MAX_RETRIES, 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 5) : 2;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Normaliza errores axios/GitHub para mensaje, status y código estable.
 * @param {unknown} err
 * @param {string} [operation]
 * @returns {{ message: string, statusCode: number, code: string, retryable: boolean }}
 */
function normalizeGithubHttpError(err, operation) {
  const op = operation || "github_request";
  if (!err || !err.response) {
    const msg = (err && err.message) || "Error de red al contactar GitHub";
    logger.warn({ event: "GITHUB_REQUEST_NETWORK", operation: op, err: String(err && err.message) }, msg);
    return {
      message: msg,
      statusCode: 502,
      code: GITHUB_ERROR_CODES.NETWORK,
      retryable: true
    };
  }
  const status = err.response.status;
  const data = err.response.data;
  const ghMsg =
    (data && (data.message || data.error)) ? String(data.message || data.error) : `GitHub HTTP ${status}`;

  if (status === 401) {
    return {
      message: ghMsg || "No autorizado en GitHub (token o credenciales)",
      statusCode: 401,
      code: GITHUB_ERROR_CODES.AUTH_ERROR,
      retryable: false
    };
  }
  if (status === 403) {
    return {
      message: ghMsg || "Prohibido por GitHub (permisos insuficientes)",
      statusCode: 403,
      code: GITHUB_ERROR_CODES.FORBIDDEN,
      retryable: false
    };
  }
  if (status === 404) {
    return {
      message: ghMsg || "Recurso no encontrado en GitHub",
      statusCode: 404,
      code: GITHUB_ERROR_CODES.NOT_FOUND,
      retryable: false
    };
  }
  if (status === 429) {
    return {
      message: ghMsg || "Límite de tasa de GitHub",
      statusCode: 429,
      code: GITHUB_ERROR_CODES.RATE_LIMIT,
      retryable: true
    };
  }
  if (status >= 500) {
    return {
      message: ghMsg || "Error del servidor GitHub",
      statusCode: status,
      code: GITHUB_ERROR_CODES.SERVER_ERROR,
      retryable: true
    };
  }
  return {
    message: ghMsg || `Error GitHub (${status})`,
    statusCode: status,
    code: GITHUB_ERROR_CODES.UNKNOWN,
    retryable: false
  };
}

/**
 * Ejecuta una petición GitHub con reintentos acotados en errores recuperables.
 * @param {() => Promise<import("axios").AxiosResponse>} fn
 * @param {{ operation: string, projectId?: string, userId?: string }} opts
 */
async function executeGithubRequest(fn, opts) {
  const operation = (opts && opts.operation) || "github_request";
  const maxRetries = getGithubMaxRetries();
  let attempt = 0;
  let lastErr = null;

  while (attempt <= maxRetries) {
    try {
      const res = await fn();
      return {
        ok: true,
        data: res && res.data !== undefined ? res.data : null,
        retryCount: attempt
      };
    } catch (err) {
      lastErr = err;
      const n = normalizeGithubHttpError(err, operation);
      if (n.retryable && attempt < maxRetries) {
        const backoff = Math.min(2000, 250 * Math.pow(2, attempt));
        await sleep(backoff);
        attempt += 1;
        continue;
      }
      return {
        ok: false,
        data: null,
        error: {
          code: n.code,
          message: n.message,
          statusCode: n.statusCode
        },
        retryCount: attempt
      };
    }
  }

  const n = lastErr ? normalizeGithubHttpError(lastErr, operation) : { message: "Error desconocido", statusCode: 500, code: GITHUB_ERROR_CODES.UNKNOWN, retryable: false };
  return {
    ok: false,
    data: null,
    error: { code: n.code, message: n.message, statusCode: n.statusCode },
    retryCount: attempt
  };
}

module.exports = {
  executeGithubRequest,
  getGithubApiTimeoutMs,
  normalizeGithubHttpError
};
