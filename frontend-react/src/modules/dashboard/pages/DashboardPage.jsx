/**
 * Panel de Control — layout alineado a wireframe (KPIs, proyectos, actividad, reglas, CR).
 * Datos: GET /dashboard/summary (?days= ventana de actividad / altas).
 * Estética inspirada en plantillas tipo Tailwind Admin: KPIs con movimiento, franja de métricas y paneles con hover.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleDot,
  FolderKanban,
  Package,
  Rocket,
} from "lucide-react";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { Select } from "../../../design-system/components/Select/Select.jsx";
import { PageContainer } from "../../../design-system/layout/PageContainer/PageContainer.jsx";
import { DataTable } from "../../../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../../../design-system/patterns/EmptyState/EmptyState.jsx";
import { StatCard } from "../../../design-system/patterns/StatCard/StatCard.jsx";
import DashboardRecentProjectsTable from "../components/DashboardRecentProjectsTable.jsx";
import { getDashboardSummary } from "../dashboardService.js";
import { mapStoryStatusToDsBadgeVariant } from "../../../shared/wave1/wave1DsMappers.js";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";
import styles from "./DashboardPage.module.css";

const MSG_LOADING = "Cargando…";
const MSG_ERROR = "No se pudo cargar el resumen del dashboard.";
const MSG_NO_ASSIGNMENTS = "No tienes historias asignadas en esta organización.";

const KPI_ICON_SIZE = 22;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/**
 * Contador suave al cargar el resumen (dashboard “premium”); respeta prefers-reduced-motion.
 * Actualizaciones vía requestAnimationFrame (sin setState síncrono en el cuerpo del efecto).
 */
function AnimatedInteger({ value, durationMs = 720 }) {
  const reduced = usePrefersReducedMotion();
  const target = Math.max(0, Math.floor(Number(value) || 0));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, durationMs]);

  if (reduced) {
    return <span className={styles.animatedInt}>{target}</span>;
  }
  return <span className={styles.animatedInt}>{display}</span>;
}

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Hace un momento";
  if (sec < 3600) return `Hace ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `Hace ${Math.floor(sec / 3600)} h`;
  if (sec < 604800) return `Hace ${Math.floor(sec / 86400)} d`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

/** Nombre corto para saludo (misma heurística que el shell). */
function dashboardUserFirstName(user) {
  if (!user) return "";
  const fn = user.first_name != null ? String(user.first_name).trim() : "";
  if (fn) return fn;
  if (user.name != null && String(user.name).trim()) {
    const parts = String(user.name).trim().split(/\s+/);
    return parts[0] || "";
  }
  const email = user.email != null ? String(user.email) : "";
  const local = email.split("@")[0] || "";
  return local || "Usuario";
}

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function formatDashboardLongDate() {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

const ACTIVITY_ICON_SIZE = 18;

function ActivityIcon({ kind }) {
  const k = String(kind || "").toLowerCase();
  let className = `${styles.activityIcon} ${styles.activityIconDefault}`;
  let IconComponent = CircleDot;
  if (k === "release") {
    className = `${styles.activityIcon} ${styles.activityIconRelease}`;
    IconComponent = Package;
  } else if (k === "incident") {
    className = `${styles.activityIcon} ${styles.activityIconIncident}`;
    IconComponent = AlertTriangle;
  } else if (k === "sprint") {
    className = `${styles.activityIcon} ${styles.activityIconSprint}`;
    IconComponent = CalendarDays;
  }
  return (
    <span className={className} aria-hidden>
      <IconComponent size={ACTIVITY_ICON_SIZE} strokeWidth={2} />
    </span>
  );
}

function crImpactClass(level) {
  const u = String(level || "").toUpperCase();
  if (u === "CRITICAL" || u === "HIGH") return styles.crDotHigh;
  if (u === "MEDIUM") return styles.crDotMed;
  return styles.crDotLow;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState(null);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage("");
      setSummary(null);
      try {
        const data = await getDashboardSummary({ days: periodDays });
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setErrorMessage(MSG_ERROR);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [periodDays]);

  const assignmentColumns = useMemo(
    () => [
      { key: "title", label: "Historia" },
      { key: "feature_title", label: "Feature" },
      { key: "status", label: "Estado", align: "center" },
      { key: "priority", label: "Prioridad" },
    ],
    [],
  );

  const projectRows = useMemo(() => {
    const health = summary && Array.isArray(summary.projectHealth) ? summary.projectHealth : [];
    return health.slice(0, 5).map((p) => {
      const pct = Math.min(100, Math.max(0, Number(p.progressPercent) || 0));
      return {
        ...p,
        id: p.id,
        number: p.number,
        sprintLabel: p.currentSprintName && String(p.currentSprintName).trim() !== "" ? p.currentSprintName : "—",
        storiesLabel: `${p.storiesDone ?? 0} / ${p.storiesTotal ?? 0}`,
        progressPercent: `${pct}%`,
        progressNumeric: pct,
      };
    });
  }, [summary]);

  const assignmentRows = useMemo(() => {
    const rows = summary && Array.isArray(summary.myAssignments) ? summary.myAssignments : [];
    return rows.map((a, idx) => ({
      ...a,
      _rowKey: a.id != null ? String(a.id) : `assign-${idx}`,
      feature_title: a.feature_title || "—",
    }));
  }, [summary]);

  const projectsActive = summary != null ? Number(summary.projectsActive) || 0 : null;
  const projectsCreatedMonth = summary != null ? Number(summary.projectsCreatedThisMonth) || 0 : 0;
  const sprintsInProgress = summary != null ? Number(summary.sprintsInProgressCount) || 0 : null;
  const sprintsAvg = summary != null && summary.sprintsAvgCompletionPct != null ? Number(summary.sprintsAvgCompletionPct) : null;
  const releasesPending = summary != null ? Number(summary.releasesPendingCount) || 0 : null;
  const releasesWeek = summary != null ? Number(summary.releasesPendingCreatedThisWeek) || 0 : 0;
  const openIncidents = summary != null ? Number(summary.openIncidentsCount) || 0 : null;
  const criticalIncidents = summary != null ? Number(summary.criticalIncidentsCount) || 0 : 0;

  const activityItems = useMemo(() => {
    const raw = summary && Array.isArray(summary.recentActivity) ? summary.recentActivity : [];
    return raw.slice(0, 5);
  }, [summary]);
  const rulesCatalog = summary && Array.isArray(summary.rulesCatalog) ? summary.rulesCatalog : [];
  const pendingCr = summary && Array.isArray(summary.pendingChangeRequests) ? summary.pendingChangeRequests : [];
  const activeSprint = summary && summary.activeSprint ? summary.activeSprint : null;
  const activeSprintPct =
    activeSprint != null && activeSprint.progressPercent != null
      ? Math.min(100, Math.max(0, Number(activeSprint.progressPercent) || 0))
      : null;

  const breadcrumbItems = useMemo(
    () => [{ label: "Home", path: "/dashboard" }, { label: "Panel de Control" }],
    [],
  );

  const userFirstName = useMemo(() => dashboardUserFirstName(user), [user]);
  const orgLine = useMemo(() => {
    const raw =
      user?.organization_name != null
        ? String(user.organization_name).trim()
        : user?.organization?.name != null
          ? String(user.organization.name).trim()
          : "";
    return raw || null;
  }, [user]);

  const projectsActiveHint =
    projectsCreatedMonth > 0 ? `+${projectsCreatedMonth} este mes` : "Sin altas este mes";

  const sprintHint =
    sprintsAvg != null && Number.isFinite(sprintsAvg)
      ? `${sprintsAvg}% completados (promedio)`
      : "Sin datos de avance";

  const releasesHint =
    releasesWeek > 0 ? `${releasesWeek} nueva(s) esta semana` : "Sin releases pendientes nuevas esta semana";

  const incidentsHint =
    criticalIncidents > 0
      ? `${criticalIncidents} crítico(s)`
      : openIncidents != null && openIncidents > 0
        ? "Ninguno crítico"
        : "Sin abiertos";

  const periodShortLabel =
    periodDays === 7 ? "7 días" : periodDays === 90 ? "90 días" : "30 días";

  const rulesCard = (
    <div className={`${styles.surfaceCard} ${styles.surfaceInteractive}`}>
      <h2 className={styles.cardTitle}>Motor de reglas — estado global</h2>
      <p className={styles.cardSubtitle}>Reglas de dominio activas en la orquestación Nexus.</p>
      {rulesCatalog.length === 0 ? (
        <EmptyState title="Sin reglas expuestas" description="El catálogo de reglas está vacío." />
      ) : (
        <div className={styles.rulesList}>
          {rulesCatalog.map((rule) => (
            <div key={rule.id} className={styles.ruleRow}>
              <div>
                <p className={styles.ruleName}>{rule.label}</p>
                <p className={styles.ruleScope}>
                  {rule.description || "—"}
                  {projectsActive != null ? ` · Ámbito: ${projectsActive} proyecto(s) activo(s)` : ""}
                </p>
              </div>
              <Badge variant="success">{rule.active ? "ACTIVA" : "—"}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const crCard = (
    <div className={`${styles.surfaceCard} ${styles.surfaceInteractive}`}>
      <h2 className={styles.cardTitle}>Change requests pendientes</h2>
      <p className={styles.cardSubtitle}>Enviados a aprobación (estado SUBMITTED) en tu organización.</p>
      {pendingCr.length === 0 ? (
        <EmptyState
          title="Nada pendiente"
          description="No hay change requests esperando aprobación."
        />
      ) : (
        <div className={styles.crList}>
          {pendingCr.map((cr) => (
            <article key={cr.id} className={styles.crCard}>
              <div className={styles.crHead}>
                <span className={`${styles.crDot} ${crImpactClass(cr.impact_level)}`} aria-hidden />
                <span className={styles.crCode}>{cr.code || "CR"}</span>
              </div>
              <p className={wave1.fieldLabel} style={{ margin: "0 0 var(--ds-space-1)" }}>
                {cr.title}
              </p>
              {cr.description ? <p className={styles.crDesc}>{cr.description}</p> : null}
              <Badge variant="danger">PENDIENTE APROBACIÓN</Badge>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const assignmentsBlock = (
    <div className={`${styles.surfaceCard} ${styles.surfaceInteractive} ${styles.assignmentsBlock}`}>
      <h2 className={styles.cardTitle}>Mis asignaciones</h2>
      <p className={styles.cardSubtitle}>Historias asignadas a ti.</p>
      {assignmentRows.length === 0 ? (
        <EmptyState title="Sin asignaciones" description={MSG_NO_ASSIGNMENTS} />
      ) : (
        <DataTable
          caption={`Asignaciones · ${assignmentRows.length} fila(s)`}
          columns={assignmentColumns}
          rows={assignmentRows}
          getRowKey={(row) => row._rowKey}
          renderCell={({ column, value }) => {
            if (column.key === "status") {
              return <Badge variant={mapStoryStatusToDsBadgeVariant(value)}>{String(value || "—")}</Badge>;
            }
            if (column.key === "title") {
              return <span className={wave1.fieldLabel}>{value || "—"}</span>;
            }
            if (column.key === "feature_title") {
              return <span className={wave1.meta}>{value || "—"}</span>;
            }
            if (column.key === "priority") {
              return <span className={wave1.fieldLabel}>{value ?? "—"}</span>;
            }
            return value ?? "—";
          }}
        />
      )}
    </div>
  );

  return (
    <PageContainer compact className={styles.dsPageShell} data-testid="dashboard-root">
      <div className={styles.dashboardInner}>
        <header className={styles.pageHeader}>
          <Breadcrumb items={breadcrumbItems} />
          <div className={styles.heroRow}>
            <div className={styles.heroText}>
              <p className={styles.heroEyebrow}>
                <span>{greetingByHour()}</span>
                {userFirstName ? <span>, {userFirstName}</span> : null}
                <span className={styles.heroEyebrowDot} aria-hidden>
                  ·
                </span>
                <time dateTime={new Date().toISOString()} className={styles.heroDate}>
                  {formatDashboardLongDate()}
                </time>
              </p>
              <h1 className={styles.heroTitle}>Panel de Control</h1>
              <p className={styles.heroLead}>
                {orgLine
                  ? `Vista operativa de ${orgLine}: backlog, ejecución y calidad en un solo lugar.`
                  : "Vista operativa de tu organización: backlog, ejecución y calidad en un solo lugar."}
              </p>
            </div>
            <div className={styles.heroToolbar}>
              <label className={styles.periodLabel} htmlFor="dashboard-period-select">
                Período del resumen
              </label>
              <div className={styles.periodSelect}>
                <Select
                  id="dashboard-period-select"
                  value={String(periodDays)}
                  onChange={(e) => setPeriodDays(Number(e.target.value))}
                  disabled={loading}
                  aria-label="Rango de tiempo: actividad reciente y altas de proyecto"
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                </Select>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className={wave1.loading} data-testid="dashboard-loading">
            {MSG_LOADING}
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className={`${wave1.banner} ${wave1.bannerDanger}`} data-testid="dashboard-error" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && summary ? (
          <>
            <section className={styles.kpiSection} aria-label="Indicadores principales">
              <div data-testid="dashboard-kpi-card" className={styles.kpiGrid}>
                <StatCard
                  label="Proyectos activos"
                  value={<AnimatedInteger value={projectsActive ?? 0} />}
                  hint={projectsActiveHint}
                  variant="primary"
                  motion
                  revealIndex={0}
                  icon={<FolderKanban size={KPI_ICON_SIZE} strokeWidth={2} aria-hidden />}
                />
                <StatCard
                  label="Sprints en curso"
                  value={<AnimatedInteger value={sprintsInProgress ?? 0} />}
                  hint={sprintHint}
                  variant="success"
                  motion
                  revealIndex={1}
                  icon={<CalendarDays size={KPI_ICON_SIZE} strokeWidth={2} aria-hidden />}
                />
                <StatCard
                  label="Releases pendientes"
                  value={<AnimatedInteger value={releasesPending ?? 0} />}
                  hint={releasesHint}
                  variant="warning"
                  motion
                  revealIndex={2}
                  icon={<Rocket size={KPI_ICON_SIZE} strokeWidth={2} aria-hidden />}
                />
                <StatCard
                  label="Incidentes abiertos"
                  value={<AnimatedInteger value={openIncidents ?? 0} />}
                  hint={incidentsHint}
                  variant={openIncidents != null && openIncidents > 0 ? "danger" : "neutral"}
                  motion
                  revealIndex={3}
                  icon={<AlertTriangle size={KPI_ICON_SIZE} strokeWidth={2} aria-hidden />}
                />
              </div>

              <div className={styles.sprintSpotlight}>
                <div className={styles.sprintSpotlightHead}>
                  <span className={styles.sprintSpotlightTitle}>Sprint en foco</span>
                  <span className={styles.sprintSpotlightName}>
                    {activeSprint?.name?.trim() ? activeSprint.name : "Ninguno detectado"}
                  </span>
                </div>
                {activeSprintPct != null ? (
                  <>
                    <div
                      className={styles.sprintBar}
                      role="progressbar"
                      aria-valuenow={activeSprintPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Avance del sprint en foco: ${activeSprintPct} por ciento`}
                    >
                      <div
                        className={styles.sprintBarFill}
                        style={{ width: `${activeSprintPct}%` }}
                      />
                    </div>
                    <p className={styles.sprintSpotlightMeta}>
                      {activeSprintPct}% historias DONE en este sprint (primer IN_PROGRESS encontrado)
                    </p>
                  </>
                ) : (
                  <p className={styles.sprintSpotlightMeta}>
                    No hay sprint en progreso en tus proyectos, o aún sin historias asignadas.
                  </p>
                )}
              </div>
            </section>

            <div className={styles.midGrid}>
              <div className={styles.midCol}>
                <div className={`${styles.surfaceCard} ${styles.surfaceInteractive} ${styles.midPanel}`}>
                  <div className={styles.panelHead}>
                    <div className={styles.panelHeadText}>
                      <h2 className={styles.cardTitle}>Proyectos recientes</h2>
                      <p className={styles.cardSubtitle}>
                        Últimos 5 proyectos con sprint en curso y avance de historias.
                      </p>
                    </div>
                    <Link to="/projects" className={styles.panelActionLink} data-testid="dashboard-link-all-projects">
                      Ver todos
                      <ArrowRight size={16} strokeWidth={2} aria-hidden className={styles.panelActionIcon} />
                    </Link>
                  </div>
                  <div className={styles.midPanelBody}>
                    {projectRows.length === 0 ? (
                      <EmptyState
                        title="Sin proyectos"
                        description="Aún no hay filas de salud de proyecto para mostrar."
                      />
                    ) : (
                      <DashboardRecentProjectsTable
                        rows={projectRows}
                        onOpen={(id) => id && navigate(`/projects/${id}`)}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.midCol}>
                <div className={`${styles.surfaceCard} ${styles.surfaceInteractive} ${styles.midPanel}`}>
                  <div className={styles.panelHead}>
                    <div className={styles.panelHeadText}>
                      <h2 className={styles.cardTitle}>Actividad reciente</h2>
                      <p className={styles.cardSubtitle}>
                        Hasta 5 eventos en releases, incidentes y sprints ({periodShortLabel}).
                      </p>
                    </div>
                    <Link
                      to="/documentation"
                      className={styles.panelActionLink}
                      data-testid="dashboard-link-activity-docs"
                    >
                      Ayuda
                      <ArrowRight size={16} strokeWidth={2} aria-hidden className={styles.panelActionIcon} />
                    </Link>
                  </div>
                  <div className={styles.midPanelBody}>
                    {activityItems.length === 0 ? (
                      <EmptyState title="Sin actividad" description="No hay eventos recientes en este período." />
                    ) : (
                      <ul className={styles.activityList}>
                        {activityItems.map((ev, idx) => (
                          <li
                            key={ev.id}
                            className={styles.activityRow}
                            style={{ "--activity-stagger": idx }}
                          >
                            <ActivityIcon kind={ev.kind} />
                            <div className={styles.activityBody}>
                              <p className={styles.activityTitle}>{ev.title || "Evento"}</p>
                              <p className={styles.activityWhen}>
                                {ev.subtitle ? `${ev.subtitle} · ` : ""}
                                {formatRelativeTime(ev.at)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.bottomGrid}>
              {rulesCard}
              {crCard}
            </div>

            {assignmentsBlock}
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}
