/**
 * FASE 5: Legacy adapter (único traductor).
 *
 * Traduce:
 * - Input legacy: window.fetchApi(path, options)
 * - Output legacy: envelope { success, data?, error?, meta? }
 *
 * Prohibido:
 * - Exponer HttpResult o __nexus al legacy
 * - Implementar refresh propio
 * - Implementar storage propio
 * - Adaptar dominio (items/data.data/rows/etc)
 */
import httpClient from "./httpClient.js";
import { HTTP_BASE_URL } from "./requestConfig.js";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function legacyError(code, message) {
  return { success: false, error: { code, message } };
}

function resolveApiBase() {
  // Legacy SSOT de base: window.APP_CONFIG.API_BASE (si existe).
  if (typeof window !== "undefined") {
    const base =
      window.APP_CONFIG && window.APP_CONFIG.API_BASE
        ? String(window.APP_CONFIG.API_BASE)
        : "";
    if (base) return base;
  }
  return HTTP_BASE_URL || "/api/v1";
}

function hasHeader(headers, name) {
  if (!headers) return false;
  const target = String(name).toLowerCase();
  return Object.keys(headers).some((k) => String(k).toLowerCase() === target);
}

function toAxiosConfig(path, options) {
  const method = options && options.method ? String(options.method).toUpperCase() : "GET";
  const headers = (options && options.headers && typeof options.headers === "object")
    ? { ...options.headers }
    : {};

  // URL: usar path relativo con baseURL override para respetar APP_CONFIG.
  const url = String(path || "");
  const cfg = {
    method,
    url: url,
    baseURL: resolveApiBase(),
    headers,
  };

  // Preservar flag de elegibilidad (núcleo lo usa).
  if (options && options.__skipAuthRefresh === true) cfg.__skipAuthRefresh = true;

  // Body policy (ABSOLUTA): transporte puro, sin heurísticas, sin JSON.parse.
  // - FormData: enviar exacto, sin tocar.
  // - string: enviar exacto, sin parsear.
  // - objeto plano: permitir JSON (sin mutar) y solo asegurar Content-Type si falta.
  // - null/undefined: no enviar body.
  if (options && "body" in options) {
    const body = options.body;
    if (body === null || body === undefined) {
      // no-op
    } else if (typeof FormData !== "undefined" && body instanceof FormData) {
      cfg.data = body;
      // Respetar headers existentes; si viene Content-Type, no lo sobreescribimos ni lo normalizamos aquí.
      // (Axios/Browser gestionan boundary cuando no se fuerza Content-Type.)
    } else if (typeof body === "string") {
      cfg.data = body;
      // Respetar Content-Type existente; no forzar.
    } else if (isObject(body)) {
      cfg.data = body;
      // Solo agregar lo mínimo si falta: application/json para objetos planos.
      if (!hasHeader(cfg.headers, "content-type")) {
        cfg.headers["Content-Type"] = "application/json";
      }
    } else {
      // Otros tipos (number/boolean/etc): transportar sin transformar.
      cfg.data = body;
    }
  }

  return cfg;
}

export async function fetchApi(path, options = {}) {
  const cfg = toAxiosConfig(path, options);
  try {
    const res = await httpClient.request(cfg);

    // 204: legacy espera { success:true }
    if (res && res.status === 204) return { success: true };

    const body = res ? res.data : undefined;

    // Response Layer v1 esperado: devolver tal cual (envelope legacy).
    if (isObject(body) && typeof body.success === "boolean") {
      // Blindaje: nunca propagar metadata interna del núcleo.
      if ("__nexus" in body) {
        const safe = { ...body };
        delete safe.__nexus;
        return safe;
      }
      return body;
    }

    // Body no normalizado/no JSON: error controlado legacy
    return legacyError("HTTP_CONTRACT_VIOLATION", "Respuesta no válida");
  } catch (err) {
    // Errores de red/timeout/cancel: nunca throw al legacy.
    const code = err && err.code ? String(err.code) : "";
    if (code === "ERR_CANCELED") return legacyError("HTTP_ABORTED", "Solicitud cancelada.");
    if (code === "ECONNABORTED" || code === "ETIMEDOUT") return legacyError("HTTP_TIMEOUT", "Tiempo de espera agotado.");
    return legacyError("HTTP_NETWORK", "Error de conexión. Compruebe la red.");
  }
}

