/**
 * Códigos estables para errores de integración GitHub (API / validación).
 */
const GITHUB_ERROR_CODES = {
  VALIDATION: "GITHUB_VALIDATION",
  UNKNOWN: "GITHUB_UNKNOWN",
  NOT_FOUND: "GITHUB_NOT_FOUND",
  /** HTTP 401 — credenciales / token inválido o revocado */
  AUTH_ERROR: "GITHUB_AUTH_ERROR",
  /** HTTP 403 — sin permisos suficientes en el recurso */
  FORBIDDEN: "GITHUB_FORBIDDEN",
  RATE_LIMIT: "GITHUB_RATE_LIMIT",
  SERVER_ERROR: "GITHUB_SERVER_ERROR",
  NETWORK: "GITHUB_NETWORK"
};

module.exports = { GITHUB_ERROR_CODES };
