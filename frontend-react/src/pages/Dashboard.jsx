/**
 * Panel de Control — layout alineado a wireframe (KPIs, proyectos, actividad, reglas, CR).
 * Datos: GET /dashboard/summary (?days= ventana de actividad / altas).
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Select } from "../design-system/components/Select/Select.jsx";
import { PageContainer } from "../design-system/layout/PageContainer/PageContainer.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { StatCard } from "../design-system/patterns/StatCard/StatCard.jsx";
import DashboardRecentProjectsTable from "../components/dashboard/DashboardRecentProjectsTable.jsx";
import { getDashboardSummary } from "../modules/dashboard/dashboardService.js";
import { mapStoryStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";
import styles from "./Dashboard.module.css";

const MSG_LOADING = "Cargando…";
const MSG_ERROR = "No se pudo cargar el resumen del dashboard.";
const MSG_NO_ASSIGNMENTS = "No tienes historias asignadas en esta organización.";

function IconKpiProjects() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
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

function IconKpiCalendar() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

function IconKpiPackage() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M12 3l8 4v6c0 5-3.5 9-8 9s-8-4-8-9V7l8-4z"
      />
    </svg>
  );
}

function IconKpiIncident() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  );
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

function ActivityIcon({ kind }) {
  const k = String(kind || "").toLowerCase();
  if (k === "release") {
    return (
      <span className={`${styles.activityIcon} ${styles.activityIconRelease}`} aria-hidden>
        📦
      </span>
    );
  }
  if (k === "incident") {
    return (
      <span className={`${styles.activityIcon} ${styles.activityIconIncident}`} aria-hidden>
        ⚠
      </span>
    );
  }
  if (k === "sprint") {
    return (
      <span className={`${styles.activityIcon} ${styles.activityIconSprint}`} aria-hidden>
        📅
      </span>
    );
  }
  return (
    <span className={`${styles.activityIcon} ${styles.activityIconDefault}`} aria-hidden>
      ◆
    </span>
  );
}

function crImpactClass(level) {
  const u = String(level || "").toUpperCase();
  if (u === "CRITICAL" || u === "HIGH") return styles.crDotHigh;
  if (u === "MEDIUM") return styles.crDotMed;
  return styles.crDotLow;
}

export default function Dashboard() {
  const navigate = useNavigate();
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

  const breadcrumbItems = useMemo(
    () => [{ label: "Home", path: "/dashboard" }, { label: "Panel de Control" }],
    [],
  );

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

  const rulesCard = (
    <div className={styles.surfaceCard}>
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
    <div className={styles.surfaceCard}>
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
    <div className={`${styles.surfaceCard} ${styles.assignmentsBlock}`}>
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
        <div className={styles.topBar}>
          <div className={styles.topBarTitles}>
            <Breadcrumb items={breadcrumbItems} />
            <h1>Panel de Control</h1>
            <p className={styles.topBarMeta}>
              Resumen operativo de Nexus DevSuite: proyectos, sprints, releases, incidentes y solicitudes de cambio.
            </p>
          </div>
          <div className={styles.periodSelect}>
            <Select
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
            <div data-testid="dashboard-kpi-card" className={styles.kpiGrid}>
              <StatCard
                label="Proyectos activos"
                value={String(projectsActive ?? "—")}
                hint={projectsActiveHint}
                variant="primary"
                icon={<IconKpiProjects />}
              />
              <StatCard
                label="Sprints en curso"
                value={String(sprintsInProgress ?? "—")}
                hint={sprintHint}
                variant="success"
                icon={<IconKpiCalendar />}
              />
              <StatCard
                label="Releases pendientes"
                value={String(releasesPending ?? "—")}
                hint={releasesHint}
                variant="warning"
                icon={<IconKpiPackage />}
              />
              <StatCard
                label="Incidentes abiertos"
                value={String(openIncidents ?? "—")}
                hint={incidentsHint}
                variant={openIncidents != null && openIncidents > 0 ? "danger" : "neutral"}
                icon={<IconKpiIncident />}
              />
            </div>

            <div className={styles.midGrid}>
              <div className={styles.midCol}>
                <div className={`${styles.surfaceCard} ${styles.midPanel}`}>
                  <h2 className={styles.cardTitle}>Proyectos recientes</h2>
                  <p className={styles.cardSubtitle}>
                    Últimos 5 proyectos de la organización con sprint en curso y avance de historias.
                  </p>
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
                <div className={`${styles.surfaceCard} ${styles.midPanel}`}>
                  <h2 className={styles.cardTitle}>Actividad reciente</h2>
                  <p className={styles.cardSubtitle}>
                    Hasta 5 actualizaciones en releases, incidentes y sprints del período seleccionado.
                  </p>
                  <div className={styles.midPanelBody}>
                    {activityItems.length === 0 ? (
                      <EmptyState title="Sin actividad" description="No hay eventos recientes en este período." />
                    ) : (
                      <ul className={styles.activityList}>
                        {activityItems.map((ev) => (
                          <li key={ev.id} className={styles.activityRow}>
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
