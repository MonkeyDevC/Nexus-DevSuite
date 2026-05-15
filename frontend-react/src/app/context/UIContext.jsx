/* eslint-disable react-refresh/only-export-components -- provider + hook en un solo módulo */
/**
 * Estado global de UI del shell: sidebar móvil y tema (light / dark / system).
 * Persistencia en localStorage; tema system sigue prefers-color-scheme vía clases en documentElement.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_THEME = "nexus_ui_theme";

/** @typedef {"light"|"dark"|"system"} UiTheme */

const UiContext = createContext(null);

function readStoredTheme() {
  if (typeof localStorage === "undefined") return "system";
  try {
    const v = localStorage.getItem(STORAGE_THEME);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* noop */
  }
  return "system";
}

/**
 * @param {MediaQueryList|MediaQueryListEvent} mq
 * @returns {boolean}
 */
function mqDark(mq) {
  return typeof mq.matches === "boolean" ? mq.matches : false;
}

/**
 * @param {UiTheme} theme
 * @param {boolean} systemIsDark
 * @returns {"light"|"dark"}
 */
function resolveTheme(theme, systemIsDark) {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return systemIsDark ? "dark" : "light";
}

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 */
export function UIProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return mqDark(window.matchMedia("(prefers-color-scheme: dark)"));
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(mqDark(e));
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const resolvedTheme = useMemo(() => resolveTheme(theme, systemDark), [theme, systemDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "light") root.classList.add("light");
    else if (theme === "dark") root.classList.add("dark");
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_THEME, next);
    } catch {
      /* noop */
    }
  }, []);

  const setSidebarOpen = useCallback((next) => {
    setSidebarOpenState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => !o);
  }, [setSidebarOpen]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
    }),
    [theme, setTheme, resolvedTheme, sidebarOpen, setSidebarOpen, toggleSidebar],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUI debe usarse dentro de UIProvider");
  }
  return ctx;
}
