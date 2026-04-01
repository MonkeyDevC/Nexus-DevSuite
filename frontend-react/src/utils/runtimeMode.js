/**
 * ----
 * Modulo: runtimeMode
 * Descripcion: Fuente de verdad para separar modo construccion vs modo ejecucion.
 * La fase se persiste en sessionStorage siempre; ademas en localStorage cuando la sesion es persistente (recordarme).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */

import { getAccessToken } from "../shared/http/tokenStorage.js";

const KEY_PHASE = "nexus_runtime_phase";

const PHASE_CONSTRUCTION = "construction";
const PHASE_EXECUTION = "execution";

function base64UrlSegmentToString(segment) {
  if (!segment || typeof segment !== "string") return null;
  let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  try {
    return atob(base64);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const json = base64UrlSegmentToString(parts[1]);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function hasValidAccessToken() {
  const token = getAccessToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return !!(payload && typeof payload.exp === "number");
}

function readPhase() {
  const fromSession = sessionStorage.getItem(KEY_PHASE);
  if (fromSession) return fromSession;
  return localStorage.getItem(KEY_PHASE) || PHASE_CONSTRUCTION;
}

export function isExecutionMode() {
  const phase = readPhase();
  return phase === PHASE_EXECUTION && hasValidAccessToken();
}

export function isConstructionMode() {
  return !isExecutionMode();
}

/**
 * Persiste fase de runtime alineada al almacenamiento de tokens.
 * @param {string} phase
 * @param {{ persistToLocal?: boolean }} [options] si true, duplica fase en localStorage (sesion recordada).
 */
export function persistRuntimePhase(phase, options = {}) {
  try {
    sessionStorage.setItem(KEY_PHASE, phase);
  } catch {
    /* ignore */
  }
  try {
    if (phase === PHASE_EXECUTION && options.persistToLocal === true) {
      localStorage.setItem(KEY_PHASE, phase);
    } else {
      localStorage.removeItem(KEY_PHASE);
    }
  } catch {
    /* ignore */
  }
}

export function clearRuntimePhaseEverywhere() {
  try {
    sessionStorage.removeItem(KEY_PHASE);
    localStorage.removeItem(KEY_PHASE);
  } catch {
    /* ignore */
  }
}

export { PHASE_CONSTRUCTION, PHASE_EXECUTION, KEY_PHASE };
