/**
 * FASE 4: Normalizacion tecnica de respuestas HTTP (sin dominio).
 *
 * Contrato interno (no expuesto a consumidores actuales):
 * - ok: true  => respuesta exitosa normalizada
 * - ok: false => error normalizado
 *
 * Regla: preserva status HTTP original.
 * Regla: no adapta estructuras de dominio (items/data.data/rows/etc).
 *
 * Politica de transicion (compatibilidad):
 * - Si un 2xx trae body JSON que no cumple Response Layer v1, se marca `HTTP_CONTRACT_VIOLATION`
 *   en el contrato interno, sin modificar el contrato observable actual (axiosResponse/res.data).
 */

const DEFAULT_META = undefined;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeSuccess(status, body) {
  // 204: sin body
  if (status === 204) {
    return { ok: true, status, data: undefined, meta: DEFAULT_META };
  }

  // Body vacio (axios puede devolver "" para 204/empty)
  if (body === "" || body === undefined) {
    return { ok: true, status, data: undefined, meta: DEFAULT_META };
  }

  // Response Layer v1 esperado
  if (isObject(body) && body.success === true) {
    return {
      ok: true,
      status,
      data: body.data,
      meta: isObject(body.meta) ? body.meta : DEFAULT_META,
    };
  }

  // 2xx con JSON valido pero contrato no normalizado
  return {
    ok: false,
    status,
    error: {
      code: "HTTP_CONTRACT_VIOLATION",
      message: "Respuesta exitosa no cumple el contrato esperado.",
      details: { expected: "Response Layer v1", receivedType: typeof body },
    },
    meta: DEFAULT_META,
  };
}

function normalizeFailure(status, body) {
  // Error normalizado del backend (Response Layer v1)
  if (isObject(body) && body.success === false) {
    const err = isObject(body.error) ? body.error : {};
    return {
      ok: false,
      status,
      error: {
        code: err.code ? String(err.code) : `HTTP_${status}`,
        message: err.message ? String(err.message) : "Error en la solicitud.",
        details: isObject(err.details) ? err.details : DEFAULT_META,
      },
      meta: isObject(body.meta) ? body.meta : DEFAULT_META,
    };
  }

  // Error no normalizado (o body no json)
  return {
    ok: false,
    status,
    error: {
      code:
        status === 401
          ? "AUTH_UNAUTHORIZED"
          : status === 403
            ? "HTTP_FORBIDDEN"
            : status === 404
              ? "HTTP_NOT_FOUND"
              : status === 409
                ? "HTTP_CONFLICT"
                : status === 422
                  ? "HTTP_VALIDATION"
                  : status >= 500
                    ? "HTTP_SERVER_ERROR"
                    : `HTTP_${status}`,
      message: "Error en la solicitud.",
      details: DEFAULT_META,
    },
    meta: DEFAULT_META,
  };
}

export function normalizeAxiosResponse(response) {
  const status = response && typeof response.status === "number" ? response.status : 0;
  const body = response ? response.data : undefined;

  if (status >= 200 && status < 300) {
    return normalizeSuccess(status, body);
  }

  return normalizeFailure(status || 0, body);
}

