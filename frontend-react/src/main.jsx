/**
 * ----
 * Modulo: microAppEntry
 * Descripcion: Entrada principal React SPA con montaje determinista e idempotente.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./design-system/tokens.css";
import App from "./app/App.jsx";
import { fetchApi as legacyFetchApi } from "./shared/http/legacyAdapter.js";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./shared/http/tokenStorage.js";

let reactRoot = null;
let mountNode = null;

function resolveContainer(containerId) {
  if (containerId) return document.getElementById(containerId);
  return document.getElementById("root");
}

function ensureMountNode(container) {
  // Un solo mount node fijo para evitar duplicados.
  const existing = container.querySelector("[data-nexus-react-microapp='true']");
  if (existing) return existing;

  const node = document.createElement("div");
  node.dataset.nexusReactMicroapp = "true";
  container.innerHTML = "";
  container.appendChild(node);
  return node;
}

export function mount(containerId) {
  const container = resolveContainer(containerId);
  if (!container) return;

  // Evitar mounts duplicados; si cambia contenedor, se remonta de forma limpia.
  if (reactRoot && mountNode && mountNode.isConnected) {
    if (mountNode.parentElement === container) return;
    unmount();
  }

  mountNode = ensureMountNode(container);
  reactRoot = createRoot(mountNode);
  reactRoot.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

export function unmount() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  if (mountNode) {
    mountNode.remove();
    mountNode = null;
  }

}

// Bridge legacy (FASE 6): bridge oficial (sin fallback).
// - No expone HttpResult ni __nexus.
try {
  window.NEXUS_HTTP_LEGACY_BRIDGE = {
    fetchApi: legacyFetchApi,
  };

  // Shims globales de tokens (compatibilidad, NO autoridad):
  // - Deben delegar exclusivamente a tokenStorage (única autoridad real).
  window.getToken = () => getAccessToken();
  window.getRefreshToken = () => getRefreshToken();
  window.setTokens = (access, refresh, opts) => setTokens(access, refresh, opts);
  window.clearTokens = () => clearTokens();
} catch {
  // No romper el arranque React si window no está disponible.
}

// Entrada principal: React arranca siempre sobre #root.
mount();
