/**
 * FASE 3: Refresh manager centralizado (mutex + cola + retry unico + cleanup).
 *
 * Regla: NO depende de apiClient.js. El refresh se ejecuta con llamada directa del nucleo a /auth/refresh
 * con __skipAuthRefresh: true.
 */
import { clearTokens, getRefreshToken, setTokens } from "./tokenStorage.js";
import {
  isRefreshEligibleRuntime,
  notifyTokensUpdated,
  notifyUnauthenticatedOnce,
} from "./authSession.js";

let refreshPromise = null;
let queue = [];
let refreshEventSeq = 0;

function isAuthEndpoint(url) {
  const u = String(url || "");
  return u.includes("/auth/login") || u.includes("/auth/refresh");
}

function shouldAttemptRefresh(response) {
  if (!response || response.status !== 401) return false;
  const config = response.config || {};
  if (config.__skipAuthRefresh === true) return false;
  if (config._retry === true) return false;
  if (isAuthEndpoint(config.url)) return false;
  return isRefreshEligibleRuntime();
}

function resolveQueuedWithRetry(httpClient, nextAccessToken) {
  const items = queue;
  queue = [];
  items.forEach(({ resolve, config }) => {
    const cfg = { ...config, headers: { ...(config.headers || {}) } };
    cfg._retry = true;
    cfg.headers.Authorization = "Bearer " + nextAccessToken;
    resolve(httpClient.request(cfg));
  });
}

function resolveQueuedWithFailure(failureResponse) {
  const items = queue;
  queue = [];
  items.forEach(({ resolve, config }) => {
    resolve({
      data: failureResponse ? failureResponse.data : undefined,
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config,
    });
  });
}

async function performRefresh(httpClient) {
  const refreshTokenRaw = getRefreshToken();
  if (!refreshTokenRaw) return { ok: false, code: "AUTH_REFRESH_MISSING_TOKEN" };

  // Llamada directa del nucleo a /auth/refresh. Debe quedar excluida de elegibilidad.
  const res = await httpClient.post(
    "/auth/refresh",
    { refresh_token: refreshTokenRaw },
    { __skipAuthRefresh: true }
  );
  const body = res && res.data;
  const nextAccess =
    body && body.success && body.data && body.data.access_token
      ? body.data.access_token
      : null;
  if (!nextAccess) return { ok: false, code: "AUTH_REFRESH_FAILED", body };
  const nextRefresh =
    (body && body.data && body.data.refresh_token) || refreshTokenRaw;
  return { ok: true, access: nextAccess, refresh: nextRefresh, body };
}

export async function handle401AndMaybeRetry(response, httpClient) {
  if (!shouldAttemptRefresh(response)) return response;

  const config = response.config || {};

  // Si ya hay refresh en vuelo, encolar y esperar.
  if (refreshPromise) {
    return new Promise((resolve) => {
      queue.push({ resolve, config });
    });
  }

  const eventId = ++refreshEventSeq;
  refreshPromise = (async () => {
    try {
      const refreshed = await performRefresh(httpClient);
      if (!refreshed.ok) return { ok: false, eventId, refreshed };

      // Persistir tokens y notificar una vez.
      setTokens(refreshed.access, refreshed.refresh);
      notifyTokensUpdated(refreshed.access, refreshed.refresh);
      return { ok: true, eventId, access: refreshed.access };
    } catch (err) {
      return { ok: false, eventId, error: err };
    }
  })();

  const result = await refreshPromise.finally(() => {
    refreshPromise = null;
  });

  if (result && result.ok && result.access) {
    // Resolver cola + reintentar original (1 vez).
    resolveQueuedWithRetry(httpClient, result.access);
    const retryCfg = { ...config, headers: { ...(config.headers || {}) } };
    retryCfg._retry = true;
    retryCfg.headers.Authorization = "Bearer " + result.access;
    return httpClient.request(retryCfg);
  }

  // Refresh fallido: cleanup centralizado + notificacion controlada + resolver cola sin colgar.
  clearTokens();
  notifyUnauthenticatedOnce(result && result.eventId, "refresh_failed");
  resolveQueuedWithFailure(response);
  return response;
}

