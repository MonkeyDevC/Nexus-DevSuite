/**
 * ----
 * Modulo: apiClient
 * Descripcion: Wrapper de compatibilidad sobre shared/http para conservar contrato observable actual.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
import api from "../shared/http/index.js";
import { getRefreshToken } from "../shared/http/tokenStorage.js";
import {
  registerAuthCallbacks as registerCoreAuthCallbacks,
  notifyTokensUpdated,
} from "../shared/http/authSession.js";

export function registerAuthCallbacks(callbacks = {}) {
  registerCoreAuthCallbacks(callbacks);
}

export async function login(credentials) {
  const res = await api.post("/auth/login", credentials, {
    // Compatibilidad de contrato: mantener metadata usada por version previa.
    __skipAuthRefresh: true,
  });
  const body = res && res.data;
  if (body && body.success && body.data) {
    notifyTokensUpdated(
      body.data.access_token || null,
      body.data.refresh_token || null
    );
  }
  return res.data;
}

export async function refreshToken() {
  const refreshTokenRaw = getRefreshToken();
  if (!refreshTokenRaw) return null;

  const res = await api.post(
    "/auth/refresh",
    { refresh_token: refreshTokenRaw },
    { __skipAuthRefresh: true }
  );
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export default api;

