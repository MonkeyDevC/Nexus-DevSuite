/**
 * ----
 * Modulo: Backlog
 * Descripcion: Backlog por proyecto con normalizacion de filas, mensajes unificados y anti-race.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { isValidNexusUuid, logDev, setCachedProjectMeta } from "../services/domainWorkCache.js";
import {
  getBacklogProject,
  getBacklogFeaturesForProject,
  getBacklogStoriesForFeature,
} from "../modules/backlog/backlogService.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { StatCard, StatCardGrid } from "../design-system/patterns/StatCard/StatCard.jsx";
import { mapStoryStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const name = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!name) return null;
  return { id, name, status: raw.status != null ? String(raw.status) : "UNKNOWN" };
}

function normalizeFeature(raw, urlProjectId) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) {
    logDev("[Backlog] feature sin title valido", raw);
    return null;
  }
  if (raw.project_id != null) {
    const pid = String(raw.project_id).trim();
    if (!isValidNexusUuid(pid) || String(pid) !== String(urlProjectId)) {
      logDev("[Backlog] feature project_id inconsistente", { pid, urlProjectId });
      return null;
    }
  }
  return {
    id,
    title,
    project_id: raw.project_id != null ? String(raw.project_id).trim() : String(urlProjectId),
  };
}

function normalizeStory(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) {
    logDev("[Backlog] story sin title valido", raw);
    return null;
  }
  const assigneeEmail =
    raw.assignee && typeof raw.assignee === "object" && typeof raw.assignee.email === "string"
      ? raw.assignee.email.trim()
      : "";
  return {
    id,
    title,
    status: raw.status != null ? String(raw.status) : "UNKNOWN",
    priority: raw.priority != null ? String(raw.priority) : "—",
    assigneeDisplay: assigneeEmail || "No asignado",
  };
}

export default function Backlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const urlProjectId = id != null ? String(id).trim() : "";

  useEffect(() => {
    let cancelled = false;

    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Backlog] fallback: projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }

    async function loadBacklog() {
      setLoading(true);
      setErrorMessage("");
      setProject(null);
      setFeatures([]);
      setStories([]);
      try {
        let projectData;
        try {
          projectData = await getBacklogProject(urlProjectId);
        } catch {
          logDev("[Backlog] proyecto no encontrado o error API");
          setErrorMessage(MSG_ERROR);
          return;
        }

        if (cancelled) return;

        const normalizedProject = normalizeProject(projectData);
        if (!normalizedProject || String(normalizedProject.id) !== String(urlProjectId)) {
          logDev("[Backlog] mismatch proyecto");
          setErrorMessage(MSG_ERROR);
          return;
        }
        setCachedProjectMeta(normalizedProject.id, normalizedProject.name);
        setProject(normalizedProject);

        let featuresData;
        try {
          featuresData = await getBacklogFeaturesForProject(urlProjectId);
        } catch {
          logDev("[Backlog] error listado features");
          setErrorMessage(MSG_ERROR);
          return;
        }

        if (cancelled) return;

        const featureItems =
          featuresData && Array.isArray(featuresData.items) ? featuresData.items : [];

        const normalizedFeatures = featureItems.map((f) => normalizeFeature(f, urlProjectId)).filter(Boolean);
        setFeatures(normalizedFeatures);

        const storyRows = [];
        for (const feature of normalizedFeatures) {
          let storiesData;
          try {
            storiesData = await getBacklogStoriesForFeature(feature.id);
          } catch {
            logDev("[Backlog] error listado stories feature", feature.id);
            continue;
          }

          if (cancelled) return;

          const storyItems = storiesData && Array.isArray(storiesData.items) ? storiesData.items : [];
          for (const story of storyItems) {
            const ns = normalizeStory(story);
            if (!ns) continue;
            storyRows.push({
              ...ns,
              featureTitle: feature.title,
            });
          }
        }

        if (!cancelled) setStories(storyRows);
      } catch {
        if (cancelled) return;
        setErrorMessage(MSG_ERROR);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBacklog();
    return () => {
      cancelled = true;
    };
  }, [navigate, urlProjectId]);

  const columns = useMemo(
    () => [
      { key: "title", label: "Historia" },
      { key: "featureTitle", label: "Feature" },
      { key: "status", label: "Estado", align: "center" },
      { key: "priority", label: "Prioridad" },
      { key: "assigneeDisplay", label: "Asignado" },
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
      { label: "Backlog" },
    ],
    [project]
  );

  return (
    <div className={wave1.stack} data-testid="backlog-root">
      <PageHeader
        title="Backlog"
        description={
          project ? `${project.name} · ${features.length} feature(s) · ${stories.length} historia(s)` : "Historias del proyecto agrupadas por feature."
        }
        breadcrumb={
          <div data-testid="breadcrumb-backlog">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        }
        actions={
          !loading && project ? (
            <div className={wave1.navRow}>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}`)}>
                Proyecto
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${project.id}/features`)}>
                Features
              </Button>
              <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
                Lista proyectos
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="backlog-loading">
          {MSG_LOADING}
        </div>
      ) : (
        <span data-testid="backlog-loaded-marker" hidden />
      )}

      {!loading && errorMessage ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert">
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && project ? (
        <Card padding="default">
          <StatCardGrid>
            <StatCard label="Features" value={String(features.length)} variant="neutral" />
            <StatCard label="Historias" value={String(stories.length)} variant="primary" />
          </StatCardGrid>

          <div data-testid="backlog-table" className={wave1.tableSection}>
            {stories.length === 0 ? (
              <EmptyState
                title="Sin historias en backlog"
                description="No hay historias visibles para este proyecto. Crea historias en tus features o revisa permisos."
                actions={
                  <Button variant="primary" type="button" onClick={() => navigate(`/projects/${project.id}/features`)}>
                    Ir a Features
                  </Button>
                }
              />
            ) : (
              <DataTable
                caption={`Backlog · ${stories.length} fila(s)`}
                columns={columns}
                rows={stories}
                getRowKey={(row) => row.id}
                renderCell={({ column, row, value }) => {
                  if (column.key === "title") {
                    return (
                      <button
                        type="button"
                        className={wave1.tableLink}
                        onClick={() => {
                          if (!row || !row.id || !project) return;
                          navigate(`/projects/${project.id}/stories/${row.id}`);
                        }}
                      >
                        {value || "—"}
                      </button>
                    );
                  }
                  if (column.key === "status") {
                    return (
                      <Badge variant={mapStoryStatusToDsBadgeVariant(value)}>{String(value || "UNKNOWN")}</Badge>
                    );
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
