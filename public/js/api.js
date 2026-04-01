/**
 * Cliente API — Fetch con Authorization y Response Layer v1
 * FASE 6: modo bridge-only (sin fallback legacy).
 *
 * Regla:
 * window.fetchApi → window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi
 * Si bridge no existe → BRIDGE_MISSING (no silencioso).
 */
(function () {
  // Nota: los shims de tokens (getToken/getRefreshToken/setTokens/clearTokens)
  // se exponen desde el microapp React y delegan a tokenStorage.
  // Aquí NO se define ninguna escritura/lectura directa para evitar segunda autoridad.

  /**
   * Obtiene mensaje de error para mostrar al usuario (patrón único 4xx/5xx).
   * @param {{ success?: boolean, error?: { message?: string } }} body - Respuesta de fetchApi
   * @returns {string}
   */
  window.getApiErrorMessage = function (body) {
    if (!body) return "Error en la solicitud.";
    if (body.error && typeof body.error === "object" && body.error.message) return body.error.message;
    if (body.error && typeof body.error === "string") return body.error;
    return "Error en la solicitud.";
  };

  /**
   * Muestra al usuario el error de la API (modal). Usar cuando fetchApi devuelve success: false.
   * @param {{ success?: boolean, error?: { message?: string } }} body - Respuesta de fetchApi
   */
  window.showApiError = function (body) {
    var msg = window.getApiErrorMessage(body);
    if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: msg });
    else if (typeof window.alert === "function") window.alert(msg);
  };

  /**
   * Fetch a la API. Añade Authorization si hay token. Parsea Response Layer v1.
   * Ante error de red o respuesta no OK devuelve { success: false, error: { message } }; no rechaza.
   * @param {string} path - Path relativo a API_BASE (ej. '/auth/login')
   * @param {RequestInit} options - fetch options (method, body, headers...)
   * @returns {Promise<{ success: boolean, data?: any, error?: { code, message }, meta?: any }>}
   */
  window.fetchApi = async function (path, options = {}) {
    var bridge = window.NEXUS_HTTP_LEGACY_BRIDGE && window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi;
    if (typeof bridge !== "function") {
      console.error("[NEXUS][HTTP][LEGACY] BRIDGE_MISSING: bridge no disponible");
      return { success: false, error: { code: "BRIDGE_MISSING", message: "Infra HTTP no disponible" } };
    }
    return await bridge(path, options);
  };
})();
