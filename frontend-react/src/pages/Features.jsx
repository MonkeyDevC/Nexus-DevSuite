/**
 * Listado de features por proyecto — HTTP core + refetch tras mutación.
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
import { getProjectById } from "../services/projectApiClient.js";
import * as featuresService from "../modules/features/featuresService.js";
import { presentationForFeatureError } from "../modules/features/errorPresentation.js";
import FeatureCreateForm from "../modules/features/components/FeatureCreateForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { StatCard, StatCardGrid } from "../design-system/patterns/StatCard/StatCard.jsx";
import { mapFeatureStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";

function normalizeFeatureRow(raw, urlProjectId) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const titleFromTitle = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  const titleFromName = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  const displayTitle = titleFromTitle || titleFromName;
  if (!displayTitle) {
    logDev("[Features] feature sin title/name valido", raw);
    return null;
  }
  if (raw.project_id != null) {
    const pid = String(raw.project_id).trim();
    if (!isValidNexusUuid(pid) || String(pid) !== String(urlProjectId)) {
      logDev("[Features] feature project_id inconsistente con URL", { pid, urlProjectId });
      return null;
    }
  }
  return {
    id,
    displayTitle,
    status: raw.status != null ? String(raw.status) : "UNKNOWN",
    created_at: raw.created_at != null ? raw.created_at : null,
  };
}

export default function Features() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWriteFeature = hasPermission(user, "feature:write");
  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorPresentation(null);
    try {
      const data = await featuresService.listFeatures(urlProjectId, { limit: 100 });
      const items = data && Array.isArray(data.items) ? data.items : [];
      const normalized = items.map((row) => normalizeFeatureRow(row, urlProjectId)).filter(Boolean);
      setFeatures(normalized);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const p = await getProjectById(urlProjectId);
        setProject({ id: p.id, name: p.name, status: p.status });
        setCachedProjectMeta(p.id, p.name);
      }
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForFeatureError(code));
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Features] fallback navegacion: projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadAll();
    return undefined;
  }, [navigate, urlProjectId, loadAll]);

  async function handleCreate({ title, description }) {
    await featuresService.createFeature({ projectId: urlProjectId, title, description });
    await loadAll();
  }

  const columns = useMemo(
    () => [
      { key: "displayTitle", label: "Título" },
      { key: "status", label: "Estado", align: "center" },
      { key: "created_at", label: "Creada" },
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
      { label: "Features" },
    ],
    [project]
  );

  function errorBannerClass() {
    if (!errorPresentation) return wave1.banner;
    if (errorPresentation.tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
    if (errorPresentation.tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
    return `${wave1.banner} ${wave1.bannerWarning}`;
  }

  return (
    <div className={wave1.stack} data-testid="features-root">
      <PageHeader
        title="Features"
        description={project ? `${project.name} · ${features.length} feature(s)` : "Features del proyecto."}
        breadcrumb={
          <div data-testid="breadcrumb-features">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        }
        actions={
          !loading && project ? (
            <div className={wave1.navRow}>
              <Button variant="primary" type="button" onClick={() => navigate(`/projects/${project.id}/backlog`)}>
                Ver Backlog
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}`)}>
                Proyecto
              </Button>
              <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
                Lista proyectos
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="features-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorPresentation ? (
        <div className={errorBannerClass()} role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {!loading && !errorPresentation && project ? (
        <Card padding="default">
          {canWriteFeature ? <FeatureCreateForm onCreated={handleCreate} disabled={loading} /> : null}

          <StatCardGrid>
            <StatCard label="Total features" value={String(features.length)} variant="primary" />
          </StatCardGrid>

          <div data-testid="features-table" className={wave1.tableSection}>
            {features.length === 0 ? (
              <EmptyState
                title="Sin features"
                description="Aún no hay features en este proyecto. Crea una con el formulario superior o revisa permisos."
                actions={
                  canWriteFeature ? null : (
                    <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}`)}>
                      Volver al proyecto
                    </Button>
                  )
                }
              />
            ) : (
              <DataTable
                caption={`Features · ${features.length} fila(s)`}
                columns={columns}
                rows={features}
                getRowKey={(row) => row.id}
                renderCell={({ column, row, value }) => {
                  if (column.key === "displayTitle") {
                    return (
                      <button
                        type="button"
                        className={wave1.tableLink}
                        onClick={() => {
                          if (!row || !row.id || !project) return;
                          navigate(`/projects/${project.id}/features/${row.id}`);
                        }}
                      >
                        {value || "—"}
                      </button>
                    );
                  }
                  if (column.key === "status") {
                    return (
                      <Badge variant={mapFeatureStatusToDsBadgeVariant(value)}>{String(value || "UNKNOWN")}</Badge>
                    );
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
