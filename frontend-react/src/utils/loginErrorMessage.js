/**
 * Presentacion de errores de login: alineado al contrato API actual (sin inventar enumeracion).
 *
 * Backend hoy: AUTH_INVALID_CREDENTIALS para usuario inexistente y contrasena incorrecta (mismo codigo).
 * VALIDATION_ERROR: mensaje generico + details[] de express-validator con msg concreto.
 */

const GENERIC_AUTH_FAILURE = "Correo o contraseña incorrectos";

const EMAIL_NOT_FOUND_CODES = new Set([
  "EMAIL_NOT_FOUND",
  "USER_NOT_FOUND",
  "AUTH_USER_NOT_FOUND",
]);

const INVALID_PASSWORD_CODES = new Set([
  "INVALID_PASSWORD",
  "AUTH_INVALID_PASSWORD",
  "WRONG_PASSWORD",
]);

function firstValidationDetailMessage(details) {
  if (!Array.isArray(details) || details.length === 0) return null;
  const row = details[0];
  if (row && typeof row.msg === "string") {
    const m = row.msg.trim();
    return m || null;
  }
  return null;
}

/**
 * @param {{ success?: boolean, error?: { code?: string, message?: string, details?: unknown } } | null | undefined} body
 * @returns {string}
 */
export function mapLoginFailureToUserMessage(body) {
  if (!body || typeof body !== "object") return GENERIC_AUTH_FAILURE;

  const err = body.error;
  if (!err || typeof err !== "object") return GENERIC_AUTH_FAILURE;

  const code = err.code != null ? String(err.code).trim() : "";
  const rawMsg = err.message != null ? String(err.message).trim() : "";

  if (EMAIL_NOT_FOUND_CODES.has(code)) {
    return "El correo no está registrado.";
  }
  if (INVALID_PASSWORD_CODES.has(code)) {
    return "La contraseña es incorrecta.";
  }

  if (code === "AUTH_INVALID_CREDENTIALS") {
    return GENERIC_AUTH_FAILURE;
  }

  if (code === "AUTH_FORBIDDEN") {
    return rawMsg || "Tu cuenta no está disponible en este momento.";
  }

  if (code === "AUTH_RATE_LIMIT_EXCEEDED") {
    return rawMsg || "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }

  if (code === "VALIDATION_ERROR") {
    const fromDetails = firstValidationDetailMessage(err.details);
    if (fromDetails) return fromDetails;
    if (rawMsg && !/^datos de entrada inv[aá]lidos/i.test(rawMsg)) return rawMsg;
    return "Revisa el correo y la contraseña.";
  }

  if (rawMsg && !/^datos de entrada inv[aá]lidos/i.test(rawMsg)) {
    return rawMsg;
  }

  return GENERIC_AUTH_FAILURE;
}
