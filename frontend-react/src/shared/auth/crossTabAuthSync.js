/**

 * Sincronización de sesión entre pestañas vía StorageEvent (solo dispara en *otras* ventanas).

 * Los tokens en sessionStorage no generan eventos cruzados; `pingCrossTabLogoutSignal` escribe en localStorage al cerrar sesión.

 */

import {

  getAccessToken,

  getRefreshToken,

  STORAGE_KEY_ACCESS,

  STORAGE_KEY_REFRESH,

} from "../http/tokenStorage.js";

import { STORAGE_KEY_LAST_ACTIVITY_AT } from "../session/sessionActivity.js";



export const CROSS_TAB_LOGOUT_KEY = "nexus_cross_tab_logout_at";



export function pingCrossTabLogoutSignal() {

  try {

    localStorage.setItem(CROSS_TAB_LOGOUT_KEY, String(Date.now()));

  } catch {

    /* ignore */

  }

}



/**

 * @param {object} opts

 * @param {() => { user: unknown, accessToken: string | null, refreshToken: string | null, isSessionActive: boolean }} opts.getAuthSnapshot

 * @param {() => void | Promise<void>} opts.onRemoteLogout

 * @param {(access: string, refresh: string) => void} opts.onRemoteTokenPair

 * @returns {() => void} cleanup

 */

export function attachCrossTabSessionSync({ getAuthSnapshot, onRemoteLogout, onRemoteTokenPair }) {

  let remoteLogoutInFlight = false;



  const runRemoteLogout = () => {

    const snap = getAuthSnapshot();

    if (!snap?.isSessionActive) return;

    if (remoteLogoutInFlight) return;

    remoteLogoutInFlight = true;

    Promise.resolve(onRemoteLogout()).finally(() => {

      remoteLogoutInFlight = false;

    });

  };



  /** @param {StorageEvent} e */

  const onStorage = (e) => {

    if (!e || e.storageArea !== localStorage) return;



    if (e.key === CROSS_TAB_LOGOUT_KEY && e.newValue != null) {

      runRemoteLogout();

      return;

    }



    if (e.key === null) {

      const access = getAccessToken();

      const refresh = getRefreshToken();

      const snap = getAuthSnapshot();

      if ((!access || !refresh) && snap?.isSessionActive) {

        runRemoteLogout();

      }

      return;

    }



    if (

      e.key !== STORAGE_KEY_ACCESS &&

      e.key !== STORAGE_KEY_REFRESH &&

      e.key !== STORAGE_KEY_LAST_ACTIVITY_AT

    ) {

      return;

    }



    if (e.key === STORAGE_KEY_LAST_ACTIVITY_AT) {

      return;

    }



    const access = getAccessToken();

    const refresh = getRefreshToken();

    const snap = getAuthSnapshot();

    if (!snap) return;



    if (!access || !refresh) {

      if (snap.isSessionActive) runRemoteLogout();

      return;

    }



    if (access !== snap.accessToken || refresh !== snap.refreshToken) {

      onRemoteTokenPair(access, refresh);

    }

  };



  window.addEventListener("storage", onStorage);

  return () => window.removeEventListener("storage", onStorage);

}

