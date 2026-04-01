/**
 * FASE 2 (Nucleo HTTP): autoridad unica de persistencia de tokens.
 * Soporta sesion persistente (localStorage) vs sesion de navegador (sessionStorage).
 */

export const STORAGE_KEY_ACCESS = "nexus_access_token";
export const STORAGE_KEY_REFRESH = "nexus_refresh_token";

/** @typedef {'local' | 'session'} TokenRealm */

function readFrom(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeTo(storage, key, value) {
  try {
    if (value) storage.setItem(key, value);
    else storage.removeItem(key);
  } catch {
    // Quota o modo privado: fallo silencioso acorde al resto del nucleo.
  }
}

function removeKeysFrom(storage) {
  try {
    storage.removeItem(STORAGE_KEY_ACCESS);
    storage.removeItem(STORAGE_KEY_REFRESH);
  } catch {
    /* ignore */
  }
}

/**
 * Par de tokens completo: prioridad localStorage, luego sessionStorage.
 * @returns {{ access: string, refresh: string, realm: TokenRealm } | null}
 */
export function getTokenPair() {
  const la = readFrom(localStorage, STORAGE_KEY_ACCESS);
  const lr = readFrom(localStorage, STORAGE_KEY_REFRESH);
  if (la && lr) return { access: la, refresh: lr, realm: "local" };

  const sa = readFrom(sessionStorage, STORAGE_KEY_ACCESS);
  const sr = readFrom(sessionStorage, STORAGE_KEY_REFRESH);
  if (sa && sr) return { access: sa, refresh: sr, realm: "session" };

  return null;
}

/** @returns {TokenRealm | null} */
export function getTokenRealm() {
  const p = getTokenPair();
  return p ? p.realm : null;
}

export function getAccessToken() {
  const p = getTokenPair();
  return p ? p.access : null;
}

export function getRefreshToken() {
  const p = getTokenPair();
  return p ? p.refresh : null;
}

/**
 * @param {TokenRealm} realm
 * @param {string | null} access
 * @param {string | null} refresh
 */
function writePairToRealm(realm, access, refresh) {
  const storage = realm === "local" ? localStorage : sessionStorage;
  writeTo(storage, STORAGE_KEY_ACCESS, access);
  writeTo(storage, STORAGE_KEY_REFRESH, refresh);
}

/**
 * @param {object} [options]
 * @param {boolean} [options.persist] true = localStorage; false = sessionStorage
 * @param {TokenRealm} [options.realm] escritura explicita (refresh / helpers internos)
 */
export function setTokens(accessToken, refreshToken, options) {
  if (options && typeof options.persist === "boolean") {
    const realm = options.persist ? "local" : "session";
    const other = options.persist ? "session" : "local";
    writePairToRealm(realm, accessToken, refreshToken);
    if (other === "local") removeKeysFrom(localStorage);
    else removeKeysFrom(sessionStorage);
    return;
  }

  const realm = options?.realm || getTokenRealm() || "session";
  const other = realm === "local" ? "session" : "local";
  writePairToRealm(realm, accessToken, refreshToken);
  removeKeysFrom(other === "local" ? localStorage : sessionStorage);
}

export function setAccessToken(token) {
  const pair = getTokenPair();
  const realm = pair?.realm || "session";
  writePairToRealm(realm, token, pair?.refresh ?? null);
  removeKeysFrom(realm === "local" ? sessionStorage : localStorage);
}

export function setRefreshToken(token) {
  const pair = getTokenPair();
  const realm = pair?.realm || "session";
  writePairToRealm(realm, pair?.access ?? null, token);
  removeKeysFrom(realm === "local" ? sessionStorage : localStorage);
}

export function clearTokens() {
  removeKeysFrom(localStorage);
  removeKeysFrom(sessionStorage);
}
