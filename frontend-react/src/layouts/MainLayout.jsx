/**
 * ----
 * Modulo: MainLayout
 * Descripcion: Shell persistente (sidebar + topbar) para rutas protegidas del micro-frontend React.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useUI } from "../context/UIContext.jsx";
import { canAccessRoute, hasPermission } from "../auth/authorization.js";
import { BRAND_LOGO_FULL_PNG_SRC, BRAND_LOGO_PNG_SRC } from "../constants/brandAssets.js";
import { isValidNexusUuid } from "../services/domainWorkCache.js";
import styles from "./MainLayout.module.css";

const LAST_PROJECT_STORAGE_KEY = "nexus_sidebar_last_project_id";

function readStoredProjectId() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_PROJECT_STORAGE_KEY);
    const id = raw != null ? String(raw).trim() : "";
    return isValidNexusUuid(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Contexto de proyecto para el sidebar: UUID en la URL y/o último visitado (sessionStorage).
 * @returns {{ pathProjectId: string | null, effectiveProjectId: string | null }}
 */
function useSidebarProjectContext() {
  const pathProjectId = useScopedProjectIdFromPath();
  const [storedId, setStoredId] = useState(readStoredProjectId);

  useEffect(() => {
    if (pathProjectId) {
      try {
        sessionStorage.setItem(LAST_PROJECT_STORAGE_KEY, pathProjectId);
      } catch {
        /* noop */
      }
      // Sincronizar último proyecto visitado con la URL (patrón existente).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derivado de navegación + sessionStorage
      setStoredId(pathProjectId);
    }
  }, [pathProjectId]);

  const effectiveProjectId = pathProjectId || storedId;
  return { pathProjectId, effectiveProjectId };
}

function useScopedProjectIdFromPath() {
  const { pathname } = useLocation();
  const prefix = "/projects/";
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const seg = rest.split("/")[0] || "";
  return isValidNexusUuid(seg) ? seg : null;
}

/**
 * Estado activo del bloque contextual por proyecto (rutas React montadas bajo /projects/:id).
 */
function useProjectScopeNavState(projectId) {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (!projectId) {
      return {
        detail: false,
        backlog: false,
        features: false,
        sprints: false,
        incidents: false,
        releases: false,
      };
    }
    const base = `/projects/${projectId}`;
    return {
      detail: pathname === base,
      backlog: pathname.startsWith(`${base}/backlog`) || pathname.startsWith(`${base}/stories`),
      features: pathname.startsWith(`${base}/features`),
      sprints: pathname.startsWith(`${base}/sprints`),
      incidents: pathname.startsWith(`${base}/incidents`),
      releases: pathname.startsWith(`${base}/releases`),
    };
  }, [pathname, projectId]);
}

function navClass({ isActive }) {
  return `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;
}

function IconSearch() {
  return (
    <svg className={styles.searchGlyph} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        d="M4 7h16M4 12h16M4 17h16"
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className={styles.topbarAlertsIcon} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      />
    </svg>
  );
}

const MOBILE_MAX = 768;

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
}

function readInitialMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
}

function IconBook() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 3h7a4 4 0 014 4v14a3 3 0 00-3-3H2V3zm20 0h-7a4 4 0 00-4 4v14a3 3 0 013-3h8V3z"
      />
    </svg>
  );
}

function IconDocuments() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
      />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
      />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

/** Lista priorizada — backlog del proyecto. */
function IconBacklogNav() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      />
    </svg>
  );
}

/** Capacidades / features. */
function IconFeaturesNav() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
      />
    </svg>
  );
}

/** Iteración / sprint. */
function IconSprintsNav() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      />
    </svg>
  );
}

function IconIncidentsNav() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
      />
    </svg>
  );
}

function IconReleasesNav() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z"
      />
    </svg>
  );
}

/** Icono de sección: hub / inicio (cuadrícula, estilo outline como los demás ítems). */
function IconNavSectionInicio() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM13 5a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zM13 14a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5z"
      />
    </svg>
  );
}

/** Icono de sección: operación / actividad en tiempo de ejecución. */
function IconNavSectionOperacion() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12h2.5l2-6 3 12 2.5-6H20"
      />
    </svg>
  );
}

function IconChevronCollapse({ open }) {
  return (
    <svg
      className={`${styles.navSectionChevron} ${open ? styles.navSectionChevronOpen : ""}`}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Encabezado de sección colapsable + vínculos (menú principal).
 */
function NavCollapsibleSection({
  sectionId,
  groupAriaLabel,
  label,
  defaultOpen = true,
  children,
  sectionTestId,
  sectionIcon,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `main-nav-section-${sectionId}`;
  const btnId = `${panelId}-btn`;

  return (
    <div
      className={styles.navSection}
      role="group"
      aria-label={groupAriaLabel}
      data-testid={sectionTestId || undefined}
    >
      <button
        type="button"
        id={btnId}
        className={styles.navSectionToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.navSectionToggleLeading}>
          {sectionIcon ? <span className={styles.navSectionToggleIcon}>{sectionIcon}</span> : null}
          <span className={styles.navSectionLabel}>{label}</span>
        </span>
        <IconChevronCollapse open={open} />
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={btnId} className={styles.navSectionPanel}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function IconSettings() {
  return (
    <svg className={styles.navIcon} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      />
    </svg>
  );
}

function initialsFromUser(user) {
  const email = user?.email || "";
  const local = email.split("@")[0] || "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (user?.id) return String(user.id).slice(0, 2).toUpperCase();
  return "?";
}

/** Nombre visible en cabecera del menú usuario (API puede traer first_name / name / solo email). */
function displayNameFromUser(user) {
  if (!user) return "Usuario";
  const fn = user.first_name != null ? String(user.first_name).trim() : "";
  const ln = user.last_name != null ? String(user.last_name).trim() : "";
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (user.name != null && String(user.name).trim()) return String(user.name).trim();
  const email = user.email != null ? String(user.email) : "";
  const localPart = email.split("@")[0] || "";
  return localPart || "Usuario";
}

function primaryEmailLine(user) {
  if (!user) return "";
  if (user.email != null && String(user.email).trim()) return String(user.email).trim();
  return user.id != null ? String(user.id) : "";
}

/**
 * URL absoluta para <img src>: en Vite dev las rutas /uploads van por proxy al API;
 * si el backend guarda ruta relativa sin "/" o URL incompleta, se normaliza.
 */
function resolveProfilePhotoUrl(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) {
    if (typeof window === "undefined") return s;
    return `${window.location.protocol}${s}`;
  }
  const path = s.startsWith("/") ? s : `/${s}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

/** Etiqueta de rol en español según payload de /auth/me (role suele ser MASTER | EMPLOYEE). */
function userRoleLabelEs(user) {
  if (!user) return "";
  const r = user.role != null ? String(user.role).toUpperCase().trim() : "";
  if (r === "MASTER") return "Administrador de plataforma";
  if (r === "EMPLOYEE") return "Colaborador";
  if (r) return `Rol: ${user.role}`;
  return "Miembro de la organización";
}

function IconUserMenuMail() {
  return (
    <svg className={styles.userMenuMailIcon} width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function IconUserMenuProfile() {
  return (
    <svg className={styles.userMenuIconSvg} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
      />
    </svg>
  );
}

function IconUserMenuTheme() {
  return (
    <svg className={styles.userMenuIconSvg} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a6 6 0 109 9 9 9 0 11-9-9z"
      />
    </svg>
  );
}

function IconChevronDownMenu() {
  return (
    <svg className={styles.userMenuTriggerChevronSvg} width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ScopeNavLink({ to, active, children, testId, onNavigate, title, icon }) {
  return (
    <Link
      to={to}
      className={`${styles.scopeLink} ${active ? styles.scopeLinkActive : ""}`}
      data-testid={testId}
      title={title}
      onClick={() => {
        if (typeof onNavigate === "function") onNavigate();
      }}
    >
      {icon ? (
        <span className={styles.scopeLinkIconWrap} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </Link>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, theme, setTheme } = useUI();
  const [isMobile, setIsMobile] = useState(readInitialMobile);
  const location = useLocation();
  const { effectiveProjectId } = useSidebarProjectContext();
  const scopeNav = useProjectScopeNavState(effectiveProjectId);
  const showAdminNav = canAccessRoute(user, "admin");
  const showReleasesNav = hasPermission(user, "release:access");
  const userMenuRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profilePhotoLoadFailed, setProfilePhotoLoadFailed] = useState(false);

  const userDisplayName = useMemo(() => displayNameFromUser(user), [user]);
  const userEmailLine = useMemo(() => primaryEmailLine(user), [user]);
  const userRoleLabel = useMemo(() => userRoleLabelEs(user), [user]);
  const userProfilePhotoUrl = useMemo(() => resolveProfilePhotoUrl(user?.profile_photo_url), [user]);

  useEffect(() => {
    setProfilePhotoLoadFailed(false);
  }, [userProfilePhotoUrl]);

  const showProfilePhoto =
    Boolean(userProfilePhotoUrl) && !profilePhotoLoadFailed;

  const closeSidebarMobile = useCallback(() => {
    if (isMobileViewport()) setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    function syncMobile() {
      const m = mq.matches;
      setIsMobile(m);
      if (!m) setSidebarOpen(false);
    }
    syncMobile();
    mq.addEventListener("change", syncMobile);
    window.addEventListener("resize", syncMobile);
    return () => {
      mq.removeEventListener("change", syncMobile);
      window.removeEventListener("resize", syncMobile);
    };
  }, [setSidebarOpen]);

  const cycleTheme = useCallback(() => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }, [theme, setTheme]);

  const themeLabel =
    theme === "light" ? "Tema: claro" : theme === "dark" ? "Tema: oscuro" : "Tema: sistema";
  const themeShortLabel = theme === "light" ? "Claro" : theme === "dark" ? "Oscuro" : "Sistema";

  const sidebarClass = [styles.sidebar, sidebarOpen ? styles.sidebarOpen : ""].filter(Boolean).join(" ");
  const backdropClass = [styles.backdrop, !sidebarOpen ? styles.backdropHidden : ""].filter(Boolean).join(" ");

  return (
    <div className={styles.shell}>
      {isMobile ? (
        <div
          className={backdropClass}
          role="presentation"
          aria-hidden={!sidebarOpen}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside className={sidebarClass} data-testid="app-sidebar">
        <Link
          to="/dashboard"
          className={styles.brand}
          aria-label="Nexus DevSuite — inicio"
          onClick={closeSidebarMobile}
        >
          <img
            className={styles.brandFullImg}
            src={BRAND_LOGO_FULL_PNG_SRC}
            alt=""
            width={200}
            height={48}
            decoding="async"
          />
        </Link>

        <div className={styles.sidebarScroll}>
          <nav className={styles.nav} aria-label="Principal">
            <NavCollapsibleSection
              sectionId="inicio"
              groupAriaLabel="Inicio"
              label="Inicio"
              sectionIcon={<IconNavSectionInicio />}
            >
              <NavLink
                to="/dashboard"
                className={navClass}
                end
                title="Ir al panel principal (dashboard)"
                onClick={closeSidebarMobile}
              >
                <IconDashboard />
                Dashboard
              </NavLink>
            </NavCollapsibleSection>

            <NavCollapsibleSection
              sectionId="proyectos"
              groupAriaLabel="Gestión de proyectos"
              label="Gestión de proyectos"
              sectionTestId="app-sidebar-project-scope"
              sectionIcon={<IconFolder />}
            >
              <NavLink
                to="/projects"
                className={navClass}
                title="Listado y gestión de proyectos"
                onClick={closeSidebarMobile}
              >
                <IconFolder />
                Projects
              </NavLink>
              {effectiveProjectId ? (
                <div
                  className={styles.navSectionContextLinks}
                  role="group"
                  aria-label="Planificación del proyecto activo"
                >
                  <ScopeNavLink
                    to={`/projects/${effectiveProjectId}/backlog`}
                    active={scopeNav.backlog}
                    testId="nav-scope-backlog"
                    title="Backlog e historias del proyecto activo"
                    icon={<IconBacklogNav />}
                    onNavigate={closeSidebarMobile}
                  >
                    Backlog
                  </ScopeNavLink>
                  <ScopeNavLink
                    to={`/projects/${effectiveProjectId}/features`}
                    active={scopeNav.features}
                    testId="nav-scope-features"
                    title="Features del proyecto activo"
                    icon={<IconFeaturesNav />}
                    onNavigate={closeSidebarMobile}
                  >
                    Features
                  </ScopeNavLink>
                  <ScopeNavLink
                    to={`/projects/${effectiveProjectId}/sprints`}
                    active={scopeNav.sprints}
                    testId="nav-scope-sprints"
                    title="Sprints del proyecto activo"
                    icon={<IconSprintsNav />}
                    onNavigate={closeSidebarMobile}
                  >
                    Sprints
                  </ScopeNavLink>
                </div>
              ) : (
                <span className={styles.scopeSubLabel} data-testid="app-sidebar-project-scope-hint">
                  Abre un proyecto desde <strong>Projects</strong> para ver Backlog, Features y Sprints aquí.
                </span>
              )}
            </NavCollapsibleSection>

            <NavCollapsibleSection
              sectionId="operacion"
              groupAriaLabel="Operación"
              label="Operación"
              sectionIcon={<IconNavSectionOperacion />}
            >
              <NavLink
                to="/documentation"
                className={navClass}
                data-testid="nav-documentation-link"
                title="Guías y documentación funcional y técnica"
                onClick={closeSidebarMobile}
              >
                <IconBook />
                Documentación
              </NavLink>
              <NavLink
                to="/documents"
                className={navClass}
                data-testid="nav-documents-link"
                title="Documentos de plataforma y control documental ISO"
                onClick={closeSidebarMobile}
              >
                <IconDocuments />
                Documentos
              </NavLink>
              {effectiveProjectId ? (
                <>
                  <ScopeNavLink
                    to={`/projects/${effectiveProjectId}/incidents`}
                    active={scopeNav.incidents}
                    testId="nav-scope-incidents"
                    title="Incidencias del proyecto activo"
                    icon={<IconIncidentsNav />}
                    onNavigate={closeSidebarMobile}
                  >
                    Incidents
                  </ScopeNavLink>
                  {showReleasesNav ? (
                    <ScopeNavLink
                      to={`/projects/${effectiveProjectId}/releases`}
                      active={scopeNav.releases}
                      testId="nav-scope-releases"
                      title="Releases del proyecto activo"
                      icon={<IconReleasesNav />}
                      onNavigate={closeSidebarMobile}
                    >
                      Releases
                    </ScopeNavLink>
                  ) : null}
                </>
              ) : (
                <span className={styles.scopeSubLabel} data-testid="app-sidebar-operacion-scope-hint">
                  Abre un proyecto desde <strong>Projects</strong> para ver Incidents y Releases aquí.
                </span>
              )}
            </NavCollapsibleSection>

            {showAdminNav ? (
              <NavCollapsibleSection
                sectionId="admin"
                groupAriaLabel="Administración"
                label="Administración"
                sectionIcon={<IconShield />}
              >
                <NavLink
                  to="/admin"
                  className={navClass}
                  data-testid="nav-admin-link"
                  title="Administración de usuarios, organización y auditoría"
                  onClick={closeSidebarMobile}
                >
                  <IconShield />
                  Admin
                </NavLink>
                <NavLink
                  to="/settings"
                  className={navClass}
                  data-testid="nav-settings-link"
                  title="Ajustes de cuenta y preferencias"
                  onClick={closeSidebarMobile}
                >
                  <IconSettings />
                  Ajustes
                </NavLink>
              </NavCollapsibleSection>
            ) : null}
          </nav>
        </div>
      </aside>

      <div className={styles.mainCol}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuToggle}
              aria-label="Abrir menú lateral"
              aria-expanded={sidebarOpen}
              hidden={!isMobile}
              onClick={() => toggleSidebar()}
            >
              <IconMenu />
              <span className={styles.srOnly}>Menú</span>
            </button>
            <Link to="/dashboard" className={styles.headerBrand} aria-label="Nexus DevSuite — inicio">
              <span className={styles.headerBrandLogoWrap} aria-hidden>
                <img
                  className={styles.headerBrandLogo}
                  src={BRAND_LOGO_PNG_SRC}
                  alt=""
                  width={40}
                  height={40}
                  decoding="async"
                />
              </span>
              <span className={styles.headerBrandText}>
                <span className={styles.headerBrandLine1}>NEXUS</span>
                <span className={styles.headerBrandLine2}>DevSuite</span>
              </span>
            </Link>
            <div className={styles.searchWrap}>
              <IconSearch />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Buscar"
                aria-label="Buscar en la aplicación"
              />
            </div>
          </div>
          <div className={styles.topbarRight}>
            <button
              type="button"
              className={styles.topbarAlertsBtn}
              data-testid="app-topbar-alerts-btn"
              title="Alertas y notificaciones (próximamente)"
              aria-label="Alertas y notificaciones"
              onClick={() => setUserMenuOpen(false)}
            >
              <IconBell />
              <span className={styles.topbarAlertsDot} aria-hidden />
            </button>
            <div className={styles.userMenuAnchor} ref={userMenuRef}>
              <button
                type="button"
                className={styles.userMenuTrigger}
                id="app-user-menu-trigger"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-controls="app-user-menu"
                data-testid="app-user-menu-trigger"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <span className={styles.avatar} aria-hidden>
                  {showProfilePhoto ? (
                    <img
                      className={styles.avatarImg}
                      src={userProfilePhotoUrl}
                      alt=""
                      width={36}
                      height={36}
                      decoding="async"
                      onError={() => setProfilePhotoLoadFailed(true)}
                    />
                  ) : (
                    initialsFromUser(user)
                  )}
                </span>
                <span className={styles.userMenuTriggerName}>{userDisplayName}</span>
                <span className={styles.userMenuTriggerChevron} aria-hidden>
                  <IconChevronDownMenu />
                </span>
                <span className={styles.srOnly}>Menú de cuenta de {userDisplayName}</span>
              </button>
              {userMenuOpen ? (
              <div
                id="app-user-menu"
                className={styles.userMenuDropdown}
                role="region"
                aria-label="Perfil de usuario y cuenta"
              >
                <div className={styles.userMenuHeroBlock}>
                  <p className={styles.userMenuSectionLabel}>Perfil de usuario</p>
                  <div className={styles.userMenuHero}>
                    <div className={styles.userMenuHeroAvatar} aria-hidden>
                      {showProfilePhoto ? (
                        <img
                          className={styles.userMenuHeroAvatarImg}
                          src={userProfilePhotoUrl}
                          alt=""
                          width={52}
                          height={52}
                          decoding="async"
                          onError={() => setProfilePhotoLoadFailed(true)}
                        />
                      ) : (
                        <span className={styles.userMenuHeroInitials}>{initialsFromUser(user)}</span>
                      )}
                    </div>
                    <div className={styles.userMenuHeroBody}>
                      <div className={styles.userMenuHeroName}>{userDisplayName}</div>
                      <div className={styles.userMenuHeroRole}>{userRoleLabel}</div>
                      <div className={styles.userMenuEmailRow} title={userEmailLine}>
                        <IconUserMenuMail />
                        <span className={styles.userMenuEmailText}>{userEmailLine || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.userMenuActions} role="group" aria-label="Acciones de cuenta">
                  <Link
                    to="/settings"
                    className={styles.userMenuRow}
                    data-testid="app-user-menu-settings"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className={`${styles.userMenuIconBox} ${styles.userMenuIconBoxProfile}`}>
                      <IconUserMenuProfile />
                    </span>
                    <span className={styles.userMenuRowText}>
                      <span className={styles.userMenuRowTitle}>Editar usuario</span>
                      <span className={styles.userMenuRowDesc}>Ajustes de cuenta y preferencias</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className={styles.userMenuRow}
                    title={themeLabel}
                    onClick={() => cycleTheme()}
                  >
                    <span className={`${styles.userMenuIconBox} ${styles.userMenuIconBoxTheme}`}>
                      <IconUserMenuTheme />
                    </span>
                    <span className={styles.userMenuRowText}>
                      <span className={styles.userMenuRowTitle}>Apariencia</span>
                      <span className={styles.userMenuRowDesc}>
                        Modo {themeShortLabel.toLowerCase()} — pulsa para alternar claro, oscuro o sistema
                      </span>
                    </span>
                  </button>
                </div>

                <div className={styles.userMenuFooter}>
                  <button
                    type="button"
                    className={styles.userMenuLogoutBtn}
                    data-testid="app-user-menu-logout"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
