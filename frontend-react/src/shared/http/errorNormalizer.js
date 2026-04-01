/**
 * FASE 4: Normalizacion tecnica de errores (sin dominio).
 *
 * Regla: preserva status HTTP original cuando exista.
 * Regla: no adapta payload de dominio.
 */

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeMessage(value, fallback) {
  const s = value != null ? String(value) : "";
  return s.trim() ? s : fallback;
}

export function normalizeAxiosError(error) {
  // AxiosError: { code, message, response?, config? }
  const code = error && error.code ? String(error.code) : "";
  const hasResponse = !!(error && error.response);

  if (code === "ERR_CANCELED") {
    return {
      ok: false,
      status: null,
      error: {
        code: "HTTP_ABORTED",
        message: "Solicitud cancelada.",
        details: {},
      },
      meta: {},
    };
  }

  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return {
      ok: false,
      status: null,
      error: {
        code: "HTTP_TIMEOUT",
        message: "Tiempo de espera agotado.",
        details: {},
      },
      meta: {},
    };
  }

  if (!hasResponse) {
    return {
      ok: false,
      status: null,
      error: {
        code: "HTTP_NETWORK",
        message: "Error de red. Compruebe la conexión.",
        details: {},
      },
      meta: {},
    };
  }

  const status = typeof error.response.status === "number" ? error.response.status : 0;
  const body = error.response.data;

  // Si backend envio error normalizado (Response Layer v1), preservarlo.
  if (isObject(body) && body.success === false) {
    const err = isObject(body.error) ? body.error : {};
    return {
      ok: false,
      status,
      error: {
        code: err.code ? String(err.code) : `HTTP_${status}`,
        message: safeMessage(err.message, "Error en la solicitud."),
        details: isObject(err.details) ? err.details : {},
      },
      meta: isObject(body.meta) ? body.meta : {},
    };
  }

  return {
    ok: false,
    status,
    error: {
      code: `HTTP_${status || "ERROR"}`,
      message: safeMessage(error.message, "Error en la solicitud."),
      details: {},
    },
    meta: {},
  };
}

