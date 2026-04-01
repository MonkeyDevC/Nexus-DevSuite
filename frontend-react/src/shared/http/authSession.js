/**
 * FASE 3: Coordinacion de sesion (callbacks + gating runtime).
 * Prohibido: persistencia de tokens, refresh, cola, retry.
 */
import { isExecutionMode } from "../../utils/runtimeMode.js";

let callbacks = {
  onUnauthenticated: () => {},
  onTokensUpdated: () => {},
};

let lastUnauthEventId = null;

export function registerAuthCallbacks(next = {}) {
  callbacks = {
    onUnauthenticated: next.onUnauthenticated || callbacks.onUnauthenticated,
    onTokensUpdated: next.onTokensUpdated || callbacks.onTokensUpdated,
  };
}

export function notifyTokensUpdated(accessToken, refreshToken) {
  // Nuevo evento de sesion valida: resetea el bloqueo de notificacion.
  lastUnauthEventId = null;
  callbacks.onTokensUpdated(accessToken || null, refreshToken || null);
}

export function notifyUnauthenticatedOnce(eventId, reason) {
  if (eventId != null && lastUnauthEventId === eventId) return;
  lastUnauthEventId = eventId != null ? eventId : "default";
  callbacks.onUnauthenticated({ reason: reason || "unauthenticated" });
}

export function isRefreshEligibleRuntime() {
  return isExecutionMode();
}

