/**
 * ----
 * Modulo: AuthContext
 * Descripcion: Contexto de autenticacion con login, persistencia local/session segun recordarme, refresh via apiClient y getMe para hidratar sesion.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getMe, login, registerAuthCallbacks } from "../../shared/http/apiClient.js";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getTokenRealm,
  setTokens,
} from "../../shared/http/tokenStorage.js";
import {
  clearActivityKeys,
  DEFAULT_INACTIVITY_USER_MESSAGE,
  isExpiredByInactivity,
  markSessionStarted,
  setExpiryFlashMessage,
  touchActivity,
} from "../../shared/session/sessionActivity.js";
import {
  clearRuntimePhaseEverywhere,
  isExecutionMode,
  persistRuntimePhase,
  PHASE_CONSTRUCTION,
  PHASE_EXECUTION,
} from "../../utils/runtimeMode.js";
import { attachCrossTabSessionSync, pingCrossTabLogoutSignal } from "../../shared/auth/crossTabAuthSync.js";

const AuthContext = createContext({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  /** @deprecated Prefer authStatus / isAuthResolved; equivale a authStatus === "loading". */
  isSessionLoading: true,
  authStatus: "loading",
  isAuthResolved: false,
  login: async () => {},
  logout: async () => {},
  loadSession: async () => {},
  refreshUser: async () => {},
});

function clearStoredTokens() {
  clearTokens();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const authSnapshotRef = useRef({
    user: null,
    accessToken: null,
    refreshToken: null,
  });
  authSnapshotRef.current = { user, accessToken, refreshToken };

  const logout = useCallback(async () => {
    clearActivityKeys();
    clearRuntimePhaseEverywhere();
    clearStoredTokens();
    pingCrossTabLogoutSignal();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  function setStoredTokens(accessTokenValue, refreshTokenValue, storageOptions) {
    setTokens(accessTokenValue, refreshTokenValue, storageOptions);
  }

  const loadSession = useCallback(async () => {
    try {
      const storedAccess = getAccessToken();
      const storedRefresh = getRefreshToken();

      if (!storedAccess || !storedRefresh) {
        persistRuntimePhase(PHASE_CONSTRUCTION);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        return;
      }

      if (isExpiredByInactivity()) {
        setExpiryFlashMessage(DEFAULT_INACTIVITY_USER_MESSAGE);
        clearActivityKeys();
        clearStoredTokens();
        clearRuntimePhaseEverywhere();
        persistRuntimePhase(PHASE_CONSTRUCTION);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        return;
      }

      const realm = getTokenRealm();
      /* Necesario para que refreshManager permita /auth/refresh si el access JWT ya expiró. */
      persistRuntimePhase(PHASE_EXECUTION, { persistToLocal: realm === "local" });

      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);

      const meRes = await getMe();
      if (meRes && meRes.success && meRes.data) {
        setUser(meRes.data);
        touchActivity();
        return;
      }

      await logout();
    } catch {
      await logout();
    }
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const storedAccess = getAccessToken();
      const storedRefresh = getRefreshToken();
      if (!storedAccess || !storedRefresh) return;
      const meRes = await getMe();
      if (meRes && meRes.success && meRes.data) {
        setUser(meRes.data);
        touchActivity();
      }
    } catch {
      /* mantener usuario actual si /auth/me falla */
    }
  }, []);

  const handleLogin = useCallback(
    async (email, password, options = {}) => {
      const persistSession = options.persistSession === true;

      if (!email || !password) {
        return {
          success: false,
          error: { code: "AUTH_INVALID_CREDENTIALS", message: "Credenciales invalidas." },
          data: null,
          meta: null,
        };
      }

      const loginRes = await login({ email, password });
      if (loginRes && loginRes.success && loginRes.data) {
        const nextAccess = loginRes.data.access_token;
        const nextRefresh = loginRes.data.refresh_token;

        setStoredTokens(nextAccess, nextRefresh, { persist: persistSession });
        setAccessToken(nextAccess);
        setRefreshToken(nextRefresh);

        markSessionStarted();
        persistRuntimePhase(PHASE_EXECUTION, { persistToLocal: persistSession });
        const meRes = await getMe();
        if (meRes && meRes.success && meRes.data) {
          setUser(meRes.data);
          return loginRes;
        }
        await logout();
        return {
          success: false,
          error: {
            code: "AUTH_SESSION_HYDRATION_FAILED",
            message: "No se pudo verificar la sesion. Intenta de nuevo.",
          },
          data: null,
          meta: null,
        };
      }

      return loginRes;
    },
    [logout]
  );

  useEffect(() => {
    registerAuthCallbacks({
      onUnauthenticated: () => {
        logout();
      },
      onTokensUpdated: (nextAccess, nextRefresh) => {
        setAccessToken(nextAccess || null);
        setRefreshToken(nextRefresh || null);
      },
    });
  }, [logout]);

  useEffect(() => {
    return attachCrossTabSessionSync({
      getAuthSnapshot: () => {
        const s = authSnapshotRef.current;
        const u = s.user;
        const a = s.accessToken;
        const r = s.refreshToken;
        return {
          user: u,
          accessToken: a,
          refreshToken: r,
          isSessionActive: Boolean(u || (a && r)),
        };
      },
      onRemoteLogout: () => logout(),
      onRemoteTokenPair: (nextAccess, nextRefresh) => {
        setAccessToken(nextAccess);
        setRefreshToken(nextRefresh);
        void loadSession();
      },
    });
  }, [logout, loadSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadSession();
      if (!cancelled) setIsSessionLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  /* eslint-disable-next-line react-hooks/exhaustive-deps -- forzar reevaluacion tras login/refresh/logout */
  const sessionRuntimeExecution = useMemo(() => isExecutionMode(), [accessToken, refreshToken]);

  const isAuthenticated = useMemo(
    () => Boolean(user) && sessionRuntimeExecution,
    [user, sessionRuntimeExecution]
  );

  const authStatus = useMemo(() => {
    if (isSessionLoading) return "loading";
    if (isAuthenticated) return "authenticated";
    return "anonymous";
  }, [isSessionLoading, isAuthenticated]);

  const isAuthResolved = !isSessionLoading;

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isSessionLoading,
      authStatus,
      isAuthResolved,
      login: handleLogin,
      logout,
      loadSession,
      refreshUser,
    }),
    [
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isSessionLoading,
      authStatus,
      isAuthResolved,
      handleLogin,
      logout,
      loadSession,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
