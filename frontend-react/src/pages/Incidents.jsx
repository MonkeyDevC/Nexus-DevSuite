/**
 * ----
 * Modulo: Incidents
 * Descripcion: Listado por proyecto (Admin UI System); filtros por estado existentes.
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import * as incidentService from "../modules/incidents/incidentsService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { StatCard, StatCardGrid } from "../design-system/patterns/StatCard/StatCard.jsx";
import {
  mapIncidentPriorityToDsBadgeVariant,
  mapIncidentSeverityToDsBadgeVariant,
  mapIncidentStatusToDsBadgeVariant,
} from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";

const STATUS_FILTER_OPTS = [
  { value: "", label: "Todos los estados" },
  { value: "OPEN", label: "OPEN" },
  { value: "IN_PROGRESS", label: "IN_PROGRESS" },
  { value: "RESOLVED", label: "RESOLVED" },
  { value: "CLOSED", label: "CLOSED" },
];

function normalizeIncidentRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) {
    logDev("[Incidents] incidente sin title valido", raw);
    return null;
  }
  return {
    id,
    title,
    status: raw.status != null ? String(raw.status).trim() : "UNKNOWN",
    severity: raw.severity != null ? String(raw.severity).trim() : "UNKNOWN",
    priority: raw.priority != null ? String(raw.priority).trim() : "MEDIUM",
    created_at: raw.created_at != null && raw.created_at !== "" ? String(raw.created_at) : null,
  };
}

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pid = raw.id != null ? String(raw.id).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return null;
  const pname = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!pname) return null;
  return { id: pid, name: pname, status: raw.status != null ? String(raw.status) : "UNKNOWN" };
}

export default function Incidents() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateIncident = hasPermission(user, "incident:create");
  const [project, setProject] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const urlProjectId = projectId != null ? String(projectId).trim() : "";

  const load = useCallback(async () => {
    if (!isValidNexusUuid(urlProjectId)) return;
    setLoading(true);
    setErrorMessage("");
    setProject(null);
    setIncidents([]);
    try {
      const { items: rawItems } = await incidentService.listIncidentsRoot(urlProjectId, {
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
      });
      const normalized = rawItems.map((row) => normalizeIncidentRow(row)).filter(Boolean);
      if (normalized.length === 0 && rawItems.length > 0) {
        logDev("[Incidents] incidentes descartados por normalizacion");
      }
      setIncidents(normalized);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const pdata = await incidentService.getProject(urlProjectId);
        const np = normalizeProject(pdata);
        if (!np || String(np.id) !== String(urlProjectId)) {
          setErrorMessage(MSG_ERROR);
          setIncidents([]);
          return;
        }
        setCachedProjectMeta(np.id, np.name);
        setProject(np);
      }
    } catch {
      setErrorMessage(MSG_ERROR);
    } finally {
      setLoading(false);
    }
  }, [urlProjectId, statusFilter]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Incidents] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    load();
    return undefined;
  }, [navigate, urlProjectId, load]);

  const columns = useMemo(
    () => [
      { key: "title", label: "Título" },
      { key: "status", label: "Estado", align: "center" },
      { key: "severity", label: "Severidad", align: "center" },
      { key: "priority", label: "Prioridad", align: "center" },
      { key: "created_at", label: "Creado" },
    ],
    []
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      {
        label: project ? project.name : "Project",
        path: project ? `/projects/${project.id}` : undefined,
      },
      { label: "Incidents" },
    ],
    [project]
  );

  return (
    <div className={wave1.stack} data-testid="incidents-root">
      <PageHeader
        title="Incidents"
        description={project ? `${project.name} · ${incidents.length} incidente(s)` : "Incidentes del proyecto."}
        breadcrumb={
          <div data-testid="breadcrumb-incidents">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        }
        actions={
          !loading && project ? (
            <div className={wave1.navRow}>
              <label className={wave1.fieldLabel} htmlFor="incidents-status-filter" style={{ alignSelf: "center" }}>
                Estado
              </label>
              <select
                id="incidents-status-filter"
                className={wave1.selectInput}
                style={{ maxWidth: "14rem", width: "auto" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                data-testid="incidents-status-filter"
                aria-label="Filtrar por estado"
              >
                {STATUS_FILTER_OPTS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {canCreateIncident ? (
                <Button
                  variant="primary"
                  type="button"
                  data-testid="incidents-new"
                  onClick={() => navigate(`/projects/${project.id}/incidents/new`)}
                >
                  Nuevo incidente
                </Button>
              ) : null}
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}`)}>
                Proyecto
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}/backlog`)}>
                Backlog
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}/features`)}>
                Features
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}/sprints`)}>
                Sprints
              </Button>
              <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
                Lista proyectos
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="incidents-loading">
          {MSG_LOADING}
        </div>
      ) : (
        <span data-testid="incidents-loaded-marker" hidden />
      )}

      {!loading && errorMessage ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} data-testid="incidents-error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && project ? (
        <Card padding="default">
          <StatCardGrid>
            <StatCard label="Incidentes (vista)" value={String(incidents.length)} variant="primary" />
          </StatCardGrid>

          <div data-testid="incidents-table" className={wave1.tableSection}>
            {incidents.length === 0 ? (
              <EmptyState
                title="Sin incidentes"
                description="No hay incidentes con el filtro actual o el proyecto aún no registra casos."
                actions={
                  canCreateIncident ? (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}/incidents/new`)}
                    >
                      Nuevo incidente
                    </Button>
                  ) : null
                }
              />
            ) : (
              <DataTable
                caption={`Incidents · ${incidents.length} fila(s)`}
                columns={columns}
                rows={incidents}
                getRowKey={(row) => row.id}
                renderCell={({ column, row, value }) => {
                  if (column.key === "title") {
                    return (
                      <button
                        type="button"
                        className={wave1.tableLink}
                        onClick={() => {
                          if (!row || !row.id || !project) return;
                          navigate(`/projects/${project.id}/incidents/${row.id}`);
                        }}
                      >
                        {value || "—"}
                      </button>
                    );
                  }
                  if (column.key === "status") {
                    return <Badge variant={mapIncidentStatusToDsBadgeVariant(value)}>{String(value || "—")}</Badge>;
                  }
                  if (column.key === "severity") {
                    return <Badge variant={mapIncidentSeverityToDsBadgeVariant(value)}>{String(value || "—")}</Badge>;
                  }
                  if (column.key === "priority") {
                    return <Badge variant={mapIncidentPriorityToDsBadgeVariant(value)}>{String(value || "—")}</Badge>;
                  }
                  if (column.key === "created_at") {
                    return value ? String(value).slice(0, 19).replace("T", " ") : "—";
                  }
                  return value ?? "—";
                }}
              />
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
