/** Paridad con userMessageForDocumentationResponse (public/js/views/documents.js). */
const CONTENT_MAX = 500000;

export { CONTENT_MAX };

/**
 * @param {{ code?: string, message?: string } | null | undefined} err
 */
export function messageForPlatformDocumentationError(err) {
  if (!err) return "";
  const c = err.code ? String(err.code) : "";
  const m = err.message ? String(err.message) : "";
  if (c === "DEDUP_KEY_REQUIRED") return "Falta cabecera de idempotencia. Recargue la página e intente de nuevo.";
  if (c === "DOCUMENTATION_NOT_FOUND") return "El documento no existe o ya no está disponible.";
  if (c === "DOCUMENTATION_CONFLICT")
    return "Ya hay contenido activo para ese tipo y alcance. Archive el existente o cambie tipo/alcance.";
  if (c === "DOCUMENTATION_PATCH_EMPTY") return "Indique al menos un campo a modificar.";
  if (c === "DOCUMENTATION_CONTENT_TOO_LARGE")
    return `El texto supera el máximo permitido (${CONTENT_MAX} caracteres).`;
  if (c === "VALIDATION_ERROR") return m || "Revise los datos introducidos.";
  if (c === "IDEMPOTENCY_IN_PROGRESS")
    return "La misma operación se está procesando. Espere unos segundos y reintente.";
  if (c === "IDEMPOTENCY_KEY_REUSED")
    return "La clave de deduplicación no coincide con el cuerpo enviado anteriormente.";
  if (c === "SCOPE_LOCK_CONFLICT") return "Otro proceso está bloqueando este recurso. Reintente en breve.";
  if (c === "AUTH_UNAUTHORIZED") return "Sesión expirada o no válida. Vuelva a iniciar sesión.";
  if (c === "AUTH_FORBIDDEN") return "No tiene permisos para esta acción.";
  if (c === "TENANT_REQUIRED") return "No se pudo determinar la organización. Verifique la configuración.";
  if (c === "NOT_FOUND" || c === "DOCUMENT_NOT_FOUND") return "Recurso no encontrado.";
  if (c.includes("CONFLICT") && c !== "DOCUMENTATION_CONFLICT")
    return m || "Conflicto: el recurso no está en el estado esperado. Reintente.";
  return m || "No se pudo completar la operación.";
}
