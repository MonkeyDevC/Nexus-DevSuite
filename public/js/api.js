/**
 * Cliente API — Fetch con Authorization y Response Layer v1
 * Token en sessionStorage; nunca en URL.
 */
(function () {
  const KEY_ACCESS = "nexus_access_token";
  const KEY_REFRESH = "nexus_refresh_token";

  window.getToken = function () {
    return sessionStorage.getItem(KEY_ACCESS);
  };

  window.getRefreshToken = function () {
    return sessionStorage.getItem(KEY_REFRESH);
  };

  window.setTokens = function (access, refresh) {
    if (access) sessionStorage.setItem(KEY_ACCESS, access);
    if (refresh) sessionStorage.setItem(KEY_REFRESH, refresh);
  };

  window.clearTokens = function () {
    sessionStorage.removeItem(KEY_ACCESS);
    sessionStorage.removeItem(KEY_REFRESH);
  };

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
    const base = window.APP_CONFIG && window.APP_CONFIG.API_BASE ? window.APP_CONFIG.API_BASE : "/api/v1";
    const url = path.startsWith("http") ? path : base + path;
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const token = window.getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (err) {
      return { success: false, error: { message: "Error de conexión. Compruebe la red." } };
    }

    if (res.status === 204) {
      return { success: true };
    }
    let body;
    const ct = res.headers.get("content-type");
    if (ct && ct.indexOf("application/json") !== -1) {
      try {
        body = await res.json();
      } catch (_) {
        body = { success: false, error: { message: "Respuesta no JSON" } };
      }
    } else {
      try {
        body = { success: false, error: { message: (await res.text()) || "Error " + res.status } };
      } catch (_) {
        body = { success: false, error: { message: "Error " + res.status } };
      }
    }

    if (res.status === 401 && path.indexOf("/auth/login") === -1) {
      const refreshToken = window.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(base + "/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          const refreshBody = refreshRes.ok ? await refreshRes.json() : null;
          if (refreshBody && refreshBody.success && refreshBody.data && refreshBody.data.access_token) {
            window.setTokens(refreshBody.data.access_token, refreshBody.data.refresh_token || refreshToken);
            return window.fetchApi(path, options);
          }
        } catch (_) {}
      }
      window.clearTokens();
      if (typeof window.clearUser === "function") window.clearUser();
      if (window.redirectToLogin) window.redirectToLogin();
    }

    return body;
  };
})();
