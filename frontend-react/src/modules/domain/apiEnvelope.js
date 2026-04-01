/**
 * Deserializa Response Layer v1 desde respuestas axios del HTTP core.
 * Decisiones de UI por error.code en capas superiores (no por message).
 */

export function unwrapSuccessData(response) {
  const body = response && response.data;
  if (!body || body.success !== true) {
    const code = body && body.error && body.error.code ? String(body.error.code) : "UNKNOWN_ERROR";
    const err = new Error((body && body.error && body.error.message) || "Error de API");
    err.code = code;
    err.details = body && body.error && body.error.details;
    err.isDomainError = true;
    throw err;
  }
  return body.data;
}

export function toDomainError(error) {
  if (error && error.isDomainError) return error;
  const res = error && error.response;
  const body = res && res.data;
  if (body && body.error && body.error.code) {
    const err = new Error(body.error.message || error.message || "Error");
    err.code = String(body.error.code);
    err.details = body.error.details;
    err.status = res.status;
    err.isDomainError = true;
    return err;
  }
  const err = new Error(error && error.message ? error.message : "Error de red");
  err.code = "NETWORK_OR_UNKNOWN";
  err.isDomainError = true;
  return err;
}
