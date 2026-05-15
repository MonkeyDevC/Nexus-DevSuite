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
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileStack,
  FolderKanban,
  FolderOpen,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  ListTree,
  Rocket,
  ScrollText,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "../app/context/AuthContext.jsx";
import { useUI } from "../app/context/UIContext.jsx";
import { canAccessRoute, hasPermission } from "../auth/authorization.js";
import { BRAND_LOGO_FULL_PNG_SRC, BRAND_LOGO_PNG_SRC } from "../constants/brandAssets.js";
import { isValidNexusUuid } from "../shared/cache/domainWorkCache.js";
import {
  isProjectScopedStoryDetailPath,
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_BACKLOG,
  STORY_DETAIL_FROM_FEATURE,
  STORY_DETAIL_FROM_PROJECT,
  STORY_DETAIL_FROM_USER_STORIES,
} from "../shared/routing/storyDetailRouteContext.js";
import { sprintsListUrl } from "../shared/routing/workspaceNavUrls.js";
import TopbarGlobalSearch from "./TopbarGlobalSearch.jsx";
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
  const { pathname, search } = useLocation();
  const qs = new URLSearchParams(search);
  const qProject = qs.get("project");
  const qid = qProject != null ? String(qProject).trim() : "";

  if (pathname === "/backlog" || pathname === "/sprints" || pathname === "/sprints/new") {
    return isValidNexusUuid(qid) ? qid : null;
  }

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
  const { pathname, search } = useLocation();
  return useMemo(() => {
    if (!projectId) {
      return {
        detail: false,
        backlog: false,
        features: false,
        userStories: false,
        sprints: false,
        incidents: false,
        releases: false,
      };
    }
    const base = `/projects/${projectId}`;
    const storyDetailHere = isProjectScopedStoryDetailPath(pathname, projectId);
    const fromParam = storyDetailHere ? new URLSearchParams(search).get(STORY_DETAIL_FROM_QUERY) || "" : "";

    return {
      detail: pathname === base || (storyDetailHere && fromParam === STORY_DETAIL_FROM_PROJECT),
      backlog:
        pathname === "/backlog" ||
        pathname.startsWith("/backlog/") ||
        (storyDetailHere && fromParam === STORY_DETAIL_FROM_BACKLOG),
      features: pathname.startsWith(`${base}/features`) || (storyDetailHere && fromParam === STORY_DETAIL_FROM_FEATURE),
      userStories:
        pathname.startsWith(`${base}/user-stories`) ||
        (storyDetailHere && fromParam === STORY_DETAIL_FROM_USER_STORIES),
      sprints:
        pathname === "/sprints" ||
        pathname.startsWith("/sprints/") ||
        pathname.startsWith(`${base}/sprints`),
      incidents: pathname.startsWith(`${base}/incidents`),
      releases: pathname.startsWith(`${base}/releases`),
    };
  }, [pathname, search, projectId]);
}

function navClass({ isActive }) {
  return `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;
}

const NAV_ICON_PX = 18;
const NAV_SUB_ICON_PX = 16;
const NAV_ICON_STROKE = 2;

/** Icono lineal alineado en rejilla del sidebar (Lucide, stroke uniforme). */
function NavGlyph({ Icon, size = NAV_ICON_PX }) {
  return (
    <span className={styles.navGlyph} aria-hidden>
      <Icon size={size} strokeWidth={NAV_ICON_STROKE} />
    </span>
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

function IconChevronCollapse({ open }) {
  return (
    <ChevronDown
      className={`${styles.navSectionChevron} ${open ? styles.navSectionChevronOpen : ""}`}
      size={16}
      strokeWidth={2}
      aria-hidden
    />
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
      <div
        className={`${styles.navSectionReveal} ${open ? styles.navSectionRevealOpen : ""}`}
        aria-hidden={!open}
      >
        <div className={styles.navSectionRevealInner} inert={!open}>
          <div id={panelId} role="region" aria-labelledby={btnId} className={styles.navSectionPanel}>
            {children}
          </div>
        </div>
      </div>
    </div>
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

const PROJECTS_FEATURES_PANEL_ID = "main-nav-projects-features-panel";
const PROJECTS_FEATURES_TOGGLE_ID = "main-nav-projects-features-toggle";

const DOCUMENTATION_DOCUMENTS_PANEL_ID = "main-nav-documentation-documents-panel";
const DOCUMENTATION_DOCUMENTS_TOGGLE_ID = "main-nav-documentation-documents-toggle";

/**
 * Projects con submenú colapsable para Features y User Stories (Backlog y Sprints en Planificación).
 */
function NavProjectsCollapsibleBranch({ effectiveProjectId, scopeNav, closeSidebarMobile, navClass }) {
  const { pathname } = useLocation();
  const [featuresOpen, setFeaturesOpen] = useState(true);

  const isProjectsListActive = pathname === "/projects" || pathname === "/projects/";

  useEffect(() => {
    if (scopeNav.features || scopeNav.userStories) setFeaturesOpen(true);
  }, [scopeNav.features, scopeNav.userStories]);

  if (!effectiveProjectId) {
    return (
      <NavLink
        to="/projects"
        end
        className={navClass}
        title="Listado y gestión de proyectos"
        onClick={closeSidebarMobile}
      >
        <NavGlyph Icon={FolderOpen} />
        <span className={styles.navLinkText}>Projects</span>
      </NavLink>
    );
  }

  return (
    <div className={styles.navProjectBranch} role="group" aria-label="Projects y submenú Features">
      <div
        className={[
          styles.navProjectBranchHeader,
          isProjectsListActive ? styles.navProjectBranchHeaderActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <NavLink
          to="/projects"
          end
          className={styles.navProjectBranchLinkInner}
          title="Listado y gestión de proyectos"
          onClick={closeSidebarMobile}
        >
          <NavGlyph Icon={FolderOpen} />
          <span className={styles.navLinkText}>Projects</span>
        </NavLink>
        <button
          type="button"
          id={PROJECTS_FEATURES_TOGGLE_ID}
          className={styles.navProjectBranchToggle}
          aria-expanded={featuresOpen}
          aria-controls={PROJECTS_FEATURES_PANEL_ID}
          title={featuresOpen ? "Ocultar submenú Features y User Stories" : "Mostrar submenú Features y User Stories"}
          aria-label={featuresOpen ? "Colapsar submenú Features y User Stories" : "Expandir submenú Features y User Stories"}
          data-testid="nav-projects-features-collapse"
          onClick={() => setFeaturesOpen((prev) => !prev)}
        >
          <IconChevronCollapse open={featuresOpen} />
        </button>
      </div>
      <div
        className={`${styles.navSubmenuReveal} ${featuresOpen ? styles.navSubmenuRevealOpen : ""}`}
        aria-hidden={!featuresOpen}
      >
        <div className={styles.navSubmenuRevealInner} inert={!featuresOpen}>
          <div
            id={PROJECTS_FEATURES_PANEL_ID}
            role="region"
            aria-label="Features y User Stories del proyecto (submenú de Projects)"
            className={styles.navProjectsChildSlot}
          >
            <ScopeNavLink
              to={`/projects/${effectiveProjectId}/features`}
              active={scopeNav.features}
              testId="nav-scope-features"
              title="Features del proyecto activo (bajo Projects)"
              icon={<NavGlyph Icon={Layers} size={NAV_SUB_ICON_PX} />}
              onNavigate={closeSidebarMobile}
            >
              Features
            </ScopeNavLink>
            <ScopeNavLink
              to={`/projects/${effectiveProjectId}/user-stories`}
              active={scopeNav.userStories}
              testId="nav-scope-user-stories"
              title="User stories por feature del proyecto activo"
              icon={<NavGlyph Icon={ScrollText} size={NAV_SUB_ICON_PX} />}
              onNavigate={closeSidebarMobile}
            >
              User Stories
            </ScopeNavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Documentación (padre) con submenú colapsable para Documentos — mismo patrón visual que Projects / Features.
 */
function NavDocumentationCollapsibleBranch({ closeSidebarMobile }) {
  const { pathname } = useLocation();
  const [documentsMenuOpen, setDocumentsMenuOpen] = useState(true);

  const isDocumentationRouteActive =
    pathname === "/documentation" || pathname === "/documentation/";
  const isDocumentsRouteActive = pathname === "/documents" || pathname.startsWith("/documents/");

  useEffect(() => {
    if (isDocumentsRouteActive) setDocumentsMenuOpen(true);
  }, [isDocumentsRouteActive]);

  return (
    <div className={styles.navProjectBranch} role="group" aria-label="Documentación y Documentos">
      <div
        className={[
          styles.navProjectBranchHeader,
          isDocumentationRouteActive ? styles.navProjectBranchHeaderActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <NavLink
          to="/documentation"
          end
          className={styles.navProjectBranchLinkInner}
          data-testid="nav-documentation-link"
          title="Guías y documentación funcional y técnica"
          onClick={closeSidebarMobile}
        >
          <NavGlyph Icon={BookOpen} />
          <span className={styles.navLinkText}>Documentación</span>
        </NavLink>
        <button
          type="button"
          id={DOCUMENTATION_DOCUMENTS_TOGGLE_ID}
          className={styles.navProjectBranchToggle}
          aria-expanded={documentsMenuOpen}
          aria-controls={DOCUMENTATION_DOCUMENTS_PANEL_ID}
          title={documentsMenuOpen ? "Ocultar submenú Documentos" : "Mostrar submenú Documentos"}
          aria-label={documentsMenuOpen ? "Colapsar submenú Documentos" : "Expandir submenú Documentos"}
          data-testid="nav-documentation-documents-collapse"
          onClick={() => setDocumentsMenuOpen((prev) => !prev)}
        >
          <IconChevronCollapse open={documentsMenuOpen} />
        </button>
      </div>
      <div
        className={`${styles.navSubmenuReveal} ${documentsMenuOpen ? styles.navSubmenuRevealOpen : ""}`}
        aria-hidden={!documentsMenuOpen}
      >
        <div className={styles.navSubmenuRevealInner} inert={!documentsMenuOpen}>
          <div
            id={DOCUMENTATION_DOCUMENTS_PANEL_ID}
            role="region"
            aria-label="Documentos (submenú de Documentación)"
            className={styles.navProjectsChildSlot}
          >
            <ScopeNavLink
              to="/documents"
              active={isDocumentsRouteActive}
              testId="nav-documents-link"
              title="Documentos de plataforma y control documental ISO"
              icon={<NavGlyph Icon={FileStack} size={NAV_SUB_ICON_PX} />}
              onNavigate={closeSidebarMobile}
            >
              Documentos
            </ScopeNavLink>
          </div>
        </div>
      </div>
    </div>
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
              sectionIcon={<NavGlyph Icon={LayoutGrid} />}
            >
              <NavLink
                to="/dashboard"
                className={navClass}
                end
                title="Ir al panel principal (dashboard)"
                onClick={closeSidebarMobile}
              >
                <NavGlyph Icon={LayoutDashboard} />
                <span className={styles.navLinkText}>Dashboard</span>
              </NavLink>
            </NavCollapsibleSection>

            <NavCollapsibleSection
              sectionId="planificacion"
              groupAriaLabel="Planificación"
              label="Planificación"
              sectionTestId="app-sidebar-planificacion"
              sectionIcon={<NavGlyph Icon={ClipboardList} />}
            >
              {effectiveProjectId ? (
                <>
                  <ScopeNavLink
                    to="/backlog"
                    active={scopeNav.backlog}
                    testId="nav-scope-backlog"
                    title="Backlog de producto: elegir proyecto o continuar sin filtro"
                    icon={<NavGlyph Icon={ListTree} size={NAV_SUB_ICON_PX} />}
                    onNavigate={closeSidebarMobile}
                  >
                    Backlog
                  </ScopeNavLink>
                  <ScopeNavLink
                    to={sprintsListUrl(effectiveProjectId)}
                    active={scopeNav.sprints}
                    testId="nav-scope-sprints"
                    title="Sprint Backlog del proyecto activo"
                    icon={<NavGlyph Icon={Kanban} size={NAV_SUB_ICON_PX} />}
                    onNavigate={closeSidebarMobile}
                  >
                    Sprint Backlog
                  </ScopeNavLink>
                </>
              ) : (
                <span className={styles.scopeSubLabel} data-testid="app-sidebar-planificacion-hint">
                  Abre un proyecto desde <strong>Proyectos</strong> para usar Backlog de producto y Sprint Backlog.
                </span>
              )}
            </NavCollapsibleSection>

            <NavCollapsibleSection
              sectionId="proyectos"
              groupAriaLabel="Gestión de proyectos"
              label="Gestión de proyectos"
              sectionTestId="app-sidebar-project-scope"
              sectionIcon={<NavGlyph Icon={FolderKanban} />}
            >
              <NavProjectsCollapsibleBranch
                effectiveProjectId={effectiveProjectId}
                scopeNav={scopeNav}
                closeSidebarMobile={closeSidebarMobile}
                navClass={navClass}
              />
              {!effectiveProjectId ? (
                <span className={styles.scopeSubLabel} data-testid="app-sidebar-project-scope-hint">
                  Abre un proyecto desde <strong>Projects</strong> para ver Features y el detalle aquí.
                </span>
              ) : null}
            </NavCollapsibleSection>

            <NavCollapsibleSection
              sectionId="operacion"
              groupAriaLabel="Operación"
              label="Operación"
              sectionIcon={<NavGlyph Icon={Activity} />}
            >
              <NavDocumentationCollapsibleBranch closeSidebarMobile={closeSidebarMobile} />
              {effectiveProjectId ? (
                <>
                  <ScopeNavLink
                    to={`/projects/${effectiveProjectId}/incidents`}
                    active={scopeNav.incidents}
                    testId="nav-scope-incidents"
                    title="Incidencias del proyecto activo"
                    icon={<NavGlyph Icon={AlertTriangle} size={NAV_SUB_ICON_PX} />}
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
                      icon={<NavGlyph Icon={Rocket} size={NAV_SUB_ICON_PX} />}
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
                sectionIcon={<NavGlyph Icon={Shield} />}
              >
                <NavLink
                  to="/admin"
                  className={navClass}
                  data-testid="nav-admin-link"
                  title="Administración de usuarios, organización y auditoría"
                  onClick={closeSidebarMobile}
                >
                  <NavGlyph Icon={Shield} />
                  <span className={styles.navLinkText}>Admin</span>
                </NavLink>
                <NavLink
                  to="/settings"
                  className={navClass}
                  data-testid="nav-settings-link"
                  title="Ajustes de cuenta y preferencias"
                  onClick={closeSidebarMobile}
                >
                  <NavGlyph Icon={Settings} />
                  <span className={styles.navLinkText}>Ajustes</span>
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
            <TopbarGlobalSearch disabled={!user} />
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
                    to="/account"
                    className={styles.userMenuRow}
                    data-testid="app-user-menu-account"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className={`${styles.userMenuIconBox} ${styles.userMenuIconBoxProfile}`}>
                      <IconUserMenuProfile />
                    </span>
                    <span className={styles.userMenuRowText}>
                      <span className={styles.userMenuRowTitle}>Mi cuenta</span>
                      <span className={styles.userMenuRowDesc}>Nombre y foto de perfil</span>
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
