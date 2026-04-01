/**
 * Validador SemVer estricto para Releases.
 * Formato permitido: X.Y.Z (enteros >= 0, sin ceros a la izquierda).
 * Rechaza: v1.0.0, 1.0, 1.0.0-beta, 01.02.03.
 */

const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const SEMVER_STRICT_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Valida que version cumpla formato SemVer estricto X.Y.Z.
 * @param {string} version
 * @throws {AppError} RELEASE_INVALID_VERSION si inválido
 */
function validateSemVer(version) {
  if (typeof version !== "string" || !SEMVER_STRICT_REGEX.test(version.trim())) {
    throw new AppError("Versión inválida. Formato requerido: X.Y.Z (ej: 1.0.0)", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_INVALID_VERSION
    });
  }
}

/**
 * Parsea "X.Y.Z" a { major, minor, patch } numéricos.
 * @param {string} version - debe ser válido SemVer (usar validateSemVer antes si viene de input)
 * @returns {{ major: number, minor: number, patch: number }}
 */
function parseSemVer(version) {
  const match = String(version).trim().match(SEMVER_STRICT_REGEX);
  if (!match) {
    return null;
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Compara dos versiones SemVer.
 * @param {string} a - versión (ej: "1.2.3")
 * @param {string} b - versión (ej: "1.3.0")
 * @returns {number} <0 si a < b, 0 si a === b, >0 si a > b
 */
function compareSemVer(a, b) {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);
  if (!pa || !pb) {
    return NaN;
  }
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

/**
 * WAVE 4: versión no vacía, trim, longitud máxima; sin SemVer estricto.
 */
function validateReleaseVersionString(version) {
  if (typeof version !== "string" || !version.trim()) {
    throw new AppError("Versión inválida o vacía", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_INVALID_VERSION
    });
  }
  const t = version.trim();
  if (t.length > 50) {
    throw new AppError("Versión demasiado larga (máx. 50 caracteres)", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_INVALID_VERSION
    });
  }
}

module.exports = {
  validateSemVer,
  validateReleaseVersionString,
  parseSemVer,
  compareSemVer,
  SEMVER_STRICT_REGEX
};

