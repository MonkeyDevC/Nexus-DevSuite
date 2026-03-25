/**
 * Cliente API — Fetch con Authorization y Response Layer v1
 * Token en sessionStorage; nunca en URL.
 */
(function () {
  const KEY_ACCESS = "nexus_access_token";
  const KEY_REFRESH = "nexus_refresh_token";
  let refreshInFlight = null;
  let bootRefreshChecked = false;

  function decodeJwtPayload(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(payload);
    } catch (_) {
      return null;
    }
  }

  function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== "number") return false;
    // Margen corto para evitar request con token a punto de vencer.
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec + 5;
  }

  async function tryRefreshAccessToken(base) {
    const refreshToken = window.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const refreshRes = await fetch(base + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const refreshBody = refreshRes.ok ? await refreshRes.json() : null;
      if (refreshBody && refreshBody.success && refreshBody.data && refreshBody.data.access_token) {
        window.setTokens(refreshBody.data.access_token, refreshBody.data.refresh_token || refreshToken);
        return true;
      }
    } catch (_) {}
    return false;
  }

  async function tryRefreshWithLock(base) {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = tryRefreshAccessToken(base).finally(function () {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

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
    const isAuthEndpoint = path.indexOf("/auth/login") !== -1 || path.indexOf("/auth/refresh") !== -1;

    // Al recargar la app, fuerza un refresh único antes de llamar endpoints protegidos
    // para evitar enviar un access token inválido y generar 401 en cascada.
    if (!isAuthEndpoint && !bootRefreshChecked) {
      bootRefreshChecked = true;
      if (window.getRefreshToken()) {
        const refreshedAtBoot = await tryRefreshWithLock(base);
        if (!refreshedAtBoot && !window.getToken()) {
          window.clearTokens();
          if (typeof window.clearUser === "function") window.clearUser();
          if (window.redirectToLogin) window.redirectToLogin();
          return { success: false, error: { code: "AUTH_UNAUTHORIZED", message: "Sesión expirada" } };
        }
      }
    }

    let token = window.getToken();
    const refreshToken = window.getRefreshToken ? window.getRefreshToken() : null;
    if (!isAuthEndpoint && !token && !refreshToken) {
      if (typeof window.clearUser === "function") window.clearUser();
      if (window.redirectToLogin) window.redirectToLogin();
      return { success: false, error: { code: "AUTH_UNAUTHORIZED", message: "Token de acceso requerido" } };
    }
    if (!isAuthEndpoint && token && isTokenExpired(token)) {
      const refreshed = await tryRefreshWithLock(base);
      if (refreshed) token = window.getToken();
      else {
        window.clearTokens();
        if (typeof window.clearUser === "function") window.clearUser();
        if (window.redirectToLogin) window.redirectToLogin();
        return { success: false, error: { code: "AUTH_UNAUTHORIZED", message: "Sesión expirada" } };
      }
    }
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
      const refreshed = await tryRefreshWithLock(base);
      if (refreshed) return window.fetchApi(path, options);
      window.clearTokens();
      if (typeof window.clearUser === "function") window.clearUser();
      if (window.redirectToLogin) window.redirectToLogin();
    }

    return body;
  };
})();
