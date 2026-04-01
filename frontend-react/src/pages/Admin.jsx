/**
 * ----
 * Módulo: Admin
 * Descripción: Panel MASTER — usuarios, auditoría y snapshot técnico (Admin UI System).
 * ----
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMe } from "../services/apiClient.js";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import {
  listUsersNormalized,
  listAuditLogsNormalized,
  getSystemMetricsSnapshot,
} from "../modules/admin/adminService.js";
import wave1 from "./wave1Surfaces.module.css";
import styles from "./Admin.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";
const MSG_EMPTY = "Sin registros.";

function emptySectionState() {
  return { loading: true, error: null, empty: false };
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [phase, setPhase] = useState("idle");
  const [gateError, setGateError] = useState("");

  const [usersSection, setUsersSection] = useState(emptySectionState);
  const [usersData, setUsersData] = useState({ items: [], pagination: null });

  const [auditSection, setAuditSection] = useState(emptySectionState);
  const [auditData, setAuditData] = useState({ logs: [], pagination: null });

  const [metricsSection, setMetricsSection] = useState(emptySectionState);
  const [metricsData, setMetricsData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;

    async function verify() {
      setPhase("loading");
      setGateError("");

      const res = await getMe();
      if (cancelled) return;

      if (!res || !res.success || !res.data || typeof res.data !== "object") {
        setGateError(MSG_ERROR);
        setPhase("error");
        return;
      }

      setPhase("ready");
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (phase !== "ready") return undefined;
    let cancelled = false;

    (async () => {
      setUsersSection({ loading: true, error: null, empty: false });
      try {
        const result = await listUsersNormalized({ page: 1, limit: 20 });
        if (cancelled) return;
        setUsersData(result);
        setUsersSection({
          loading: false,
          error: null,
          empty: result.items.length === 0,
        });
      } catch (e) {
        if (cancelled) return;
        setUsersData({ items: [], pagination: null });
        setUsersSection({
          loading: false,
          error: e && e.message ? String(e.message) : MSG_ERROR,
          empty: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "ready") return undefined;
    let cancelled = false;

    (async () => {
      setAuditSection({ loading: true, error: null, empty: false });
      try {
        const result = await listAuditLogsNormalized({ page: 1, limit: 20 });
        if (cancelled) return;
        setAuditData(result);
        setAuditSection({
          loading: false,
          error: null,
          empty: result.logs.length === 0,
        });
      } catch (e) {
        if (cancelled) return;
        setAuditData({ logs: [], pagination: null });
        setAuditSection({
          loading: false,
          error: e && e.message ? String(e.message) : MSG_ERROR,
          empty: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "ready") return undefined;
    let cancelled = false;

    (async () => {
      setMetricsSection({ loading: true, error: null, empty: false });
      try {
        const snap = await getSystemMetricsSnapshot();
        if (cancelled) return;
        setMetricsData(snap);
        const keys = snap && typeof snap === "object" ? Object.keys(snap) : [];
        setMetricsSection({
          loading: false,
          error: null,
          empty: keys.length === 0,
        });
      } catch (e) {
        if (cancelled) return;
        setMetricsData(null);
        setMetricsSection({
          loading: false,
          error: e && e.message ? String(e.message) : MSG_ERROR,
          empty: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  const userColumns = useMemo(
    () => [
      { key: "email", label: "Email" },
      { key: "name", label: "Nombre" },
      { key: "roleLabel", label: "Rol" },
      { key: "is_active", label: "Activo", align: "center" },
    ],
    []
  );

  const userRows = useMemo(() => {
    return (usersData.items || []).map((u) => ({
      ...u,
      roleLabel: u.role && u.role.name ? String(u.role.name) : u.role_id || "—",
      is_active: u.is_active ? "Sí" : "No",
    }));
  }, [usersData.items]);

  const auditColumns = useMemo(
    () => [
      { key: "created_at", label: "Fecha" },
      { key: "action", label: "Acción" },
      { key: "entity", label: "Entidad" },
      { key: "entity_id", label: "Entity ID" },
      { key: "user_id", label: "Usuario" },
    ],
    []
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Administracion" },
    ],
    []
  );

  if (phase === "loading" || phase === "idle") {
    return (
      <div className={wave1.stack} data-testid="admin-root">
        <p className={wave1.loading} data-testid="admin-loading">
          {MSG_LOADING}
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={wave1.stack} data-testid="admin-root">
        <div className={`${wave1.banner} ${wave1.bannerDanger}`} data-testid="admin-error" role="alert">
          {gateError || MSG_ERROR}
        </div>
        <Button variant="secondary" type="button" onClick={() => navigate("/dashboard")}>
          Volver al dashboard
        </Button>
      </div>
    );
  }

  if (phase !== "ready") {
    return null;
  }

  return (
    <div className={wave1.stack} data-testid="admin-root">
      <PageHeader
        title="Administration - Nexus DevSuite"
        description="Acceso restringido a rol MASTER. Los datos se cargan desde la API con secciones independientes."
        breadcrumb={
          <div data-testid="breadcrumb-admin">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        }
        actions={
          <Button variant="secondary" type="button" onClick={() => navigate("/dashboard")}>
            Volver al dashboard
          </Button>
        }
      />

      <Card padding="default" data-testid="admin-section-users">
        <h2 className={styles.sectionTitle}>Usuarios</h2>
        {usersSection.loading ? <p className={wave1.loading}>{MSG_LOADING}</p> : null}
        {!usersSection.loading && usersSection.error ? (
          <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
            {usersSection.error}
          </div>
        ) : null}
        {!usersSection.loading && !usersSection.error && usersSection.empty ? (
          <EmptyState title={MSG_EMPTY} description="No hay usuarios en esta página." />
        ) : null}
        {!usersSection.loading && !usersSection.error && !usersSection.empty ? (
          <>
            <DataTable
              caption="Usuarios"
              columns={userColumns}
              rows={userRows}
              getRowKey={(row, i) => String(row.id ?? row.email ?? `u-${i}`)}
              renderCell={({ column, value }) => {
                if (column.key === "is_active") {
                  return <Badge variant={value === "Sí" ? "success" : "neutral"}>{String(value)}</Badge>;
                }
                return value ?? "—";
              }}
            />
            {usersData.pagination ? (
              <p className={wave1.meta} style={{ marginTop: "var(--ds-space-3)" }}>
                Pagina {usersData.pagination.page} de {usersData.pagination.totalPages || 1} — Total{" "}
                {usersData.pagination.total} usuarios
              </p>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card padding="default" data-testid="admin-section-audit">
        <h2 className={styles.sectionTitle}>Auditoria</h2>
        {auditSection.loading ? <p className={wave1.loading}>{MSG_LOADING}</p> : null}
        {!auditSection.loading && auditSection.error ? (
          <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
            {auditSection.error}
          </div>
        ) : null}
        {!auditSection.loading && !auditSection.error && auditSection.empty ? (
          <EmptyState title={MSG_EMPTY} description="No hay registros de auditoría en esta página." />
        ) : null}
        {!auditSection.loading && !auditSection.error && !auditSection.empty ? (
          <>
            <DataTable
              caption="Auditoría"
              columns={auditColumns}
              rows={auditData.logs}
              getRowKey={(row, i) => String(row.id ?? `${row.created_at}-${i}`)}
            />
            {auditData.pagination ? (
              <p className={wave1.meta} style={{ marginTop: "var(--ds-space-3)" }}>
                Pagina {auditData.pagination.page} de {auditData.pagination.totalPages || 1} — Total{" "}
                {auditData.pagination.total} registros
              </p>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card padding="default" data-testid="admin-section-metrics">
        <h2 className={styles.sectionTitle}>Snapshot tecnico del sistema</h2>
        <p className={styles.sectionLead}>
          Contadores de proceso en esta instancia (no son KPIs de negocio del dashboard).
        </p>
        {metricsSection.loading ? <p className={wave1.loading}>{MSG_LOADING}</p> : null}
        {!metricsSection.loading && metricsSection.error ? (
          <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
            {metricsSection.error}
          </div>
        ) : null}
        {!metricsSection.loading && !metricsSection.error && metricsData && !metricsSection.empty ? (
          <pre className={styles.metricsPre}>{JSON.stringify(metricsData, null, 2)}</pre>
        ) : null}
        {!metricsSection.loading && !metricsSection.error && metricsSection.empty ? (
          <EmptyState title={MSG_EMPTY} description="No hay métricas disponibles." />
        ) : null}
      </Card>
    </div>
  );
}
