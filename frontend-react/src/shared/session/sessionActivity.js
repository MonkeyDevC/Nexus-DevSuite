/**

 * Actividad de sesión: última interacción e inactividad (frontend).

 * Persiste en localStorage para sobrevivir a recargas y validarse al bootstrap.

 */



export const STORAGE_KEY_LAST_ACTIVITY_AT = "nexus_last_activity_at";

const KEY_LOGIN_AT = "nexus_session_login_at";



/** 30 minutos (requisito producto). */

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;



/** Ventana de aviso previo: 1 minuto antes del cierre por inactividad. */

export const INACTIVITY_WARNING_BEFORE_MS = 60 * 1000;



const FLASH_EXPIRY_MESSAGE = "nexus_auth_expiry_flash";



export function readLastActivityAt() {

  try {

    const raw = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY_AT);

    if (!raw) return null;

    const n = Number(raw);

    return Number.isFinite(n) ? n : null;

  } catch {

    return null;

  }

}



export function readLoginAt() {

  try {

    const raw = localStorage.getItem(KEY_LOGIN_AT);

    if (!raw) return null;

    const n = Number(raw);

    return Number.isFinite(n) ? n : null;

  } catch {

    return null;

  }

}



export function touchActivity(now = Date.now()) {

  try {

    const s = String(now);

    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY_AT, s);

    if (!localStorage.getItem(KEY_LOGIN_AT)) {

      localStorage.setItem(KEY_LOGIN_AT, s);

    }

  } catch {

    /* quota / privado */

  }

}



export function markSessionStarted(now = Date.now()) {

  try {

    const s = String(now);

    localStorage.setItem(KEY_LOGIN_AT, s);

    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY_AT, s);

  } catch {

    /* ignore */

  }

}



export function clearActivityKeys() {

  try {

    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY_AT);

    localStorage.removeItem(KEY_LOGIN_AT);

  } catch {

    /* ignore */

  }

}



/**

 * Sesión considerada expirada por inactividad si hay marca y supera el timeout.

 * Sin marca: no expira por esta vía (compat primera carga tras actualizar código).

 */

export function isExpiredByInactivity(now = Date.now()) {

  const last = readLastActivityAt();

  if (last == null) return false;

  return now - last > INACTIVITY_TIMEOUT_MS;

}



/**

 * Tiempo restante hasta expiración por inactividad.

 * @returns {number | null} ms restantes; null si no hay marca de actividad.

 */

export function getMsUntilInactivityExpiry(now = Date.now()) {

  const last = readLastActivityAt();

  if (last == null) return null;

  return INACTIVITY_TIMEOUT_MS - (now - last);

}



/**

 * Retardo hasta la próxima comprobación: un solo temporizador, más frecuente cerca del corte.

 * @param {number | null} remainingMs resultado de getMsUntilInactivityExpiry

 */

export function getNextInactivityPollDelayMs(remainingMs) {

  if (remainingMs == null) return 30_000;

  if (remainingMs <= INACTIVITY_WARNING_BEFORE_MS) {

    return Math.min(1_000, Math.max(200, remainingMs));

  }

  const untilWarning = remainingMs - INACTIVITY_WARNING_BEFORE_MS;

  return Math.min(30_000, Math.max(1_000, untilWarning));

}



export function setExpiryFlashMessage(text) {

  try {

    sessionStorage.setItem(FLASH_EXPIRY_MESSAGE, text);

  } catch {

    /* ignore */

  }

}



export function consumeExpiryFlashMessage() {

  try {

    const v = sessionStorage.getItem(FLASH_EXPIRY_MESSAGE);

    sessionStorage.removeItem(FLASH_EXPIRY_MESSAGE);

    return v || null;

  } catch {

    return null;

  }

}



export const DEFAULT_INACTIVITY_USER_MESSAGE =

  "Tu sesión expiró por inactividad. Inicia sesión nuevamente.";



export const INACTIVITY_WARNING_USER_MESSAGE =

  "Tu sesión está por expirar por inactividad.";

