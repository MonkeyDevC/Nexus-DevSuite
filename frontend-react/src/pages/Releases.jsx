/**
 * ----
 * Módulo: Releases
 * Descripción: Listado por proyecto (Admin UI System); HTTP legacy; sin lógica de negocio en UI.
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import * as releasesService from "../modules/releases/releasesService.js";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import { getProject } from "../modules/sprints/sprintsService.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { StatCard, StatCardGrid } from "../design-system/patterns/StatCard/StatCard.jsx";
import { mapReleaseStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

function normalizeRowFromDetail(detail) {
  const id = detail?.id;
  const name = detail?.name ?? "";
  const status = detail?.status ?? "";
  const version = detail?.version ?? "";
  const createdAt = detail?.created_at ?? detail?.createdAt ?? "";
  return { id, name, status, version, created_at: createdAt };
}

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pid = raw.id != null ? String(raw.id).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return null;
  const pname = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!pname) return null;
  return { id: pid, name: pname };
}

export default function Releases() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const urlProjectId = projectId != null ? String(projectId).trim() : "";

  const [projectName, setProjectName] = useState("Project");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);

  const load = useCallback(async () => {
    if (!isValidNexusUuid(urlProjectId)) return;
    setLoading(true);
    setErrorPresentation(null);
    try {
      const linked = await releasesService.listReleasesLinkedToProject(urlProjectId);
      setRows(linked.map(normalizeRowFromDetail));

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProjectName(cached.name);
      } else {
        try {
          const pdata = await getProject(urlProjectId);
          const np = normalizeProject(pdata);
          if (np && String(np.id) === String(urlProjectId)) {
            setCachedProjectMeta(np.id, np.name);
            setProjectName(np.name);
          }
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setRows([]);
      setErrorPresentation({
        tone: "danger",
        title: "No se pudieron cargar las releases",
        message: e?.message || e?.code || "Error de red",
      });
    } finally {
      setLoading(false);
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Releases] projectId inválido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    void load();
    return undefined;
  }, [load, navigate, urlProjectId]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Nombre" },
      { key: "status", label: "Estado", align: "center" },
      { key: "version", label: "Versión" },
      { key: "created_at", label: "Creado" },
    ],
    []
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      { label: "Releases" },
    ],
    [projectName, urlProjectId]
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const released = rows.filter((r) => String(r.status || "").trim() === "RELEASED").length;
    const inFlight = rows.filter((r) => {
      const s = String(r.status || "").trim();
      return s === "IN_PROGRESS" || s === "QA";
    }).length;
    return { total, released, inFlight };
  }, [rows]);

  function bannerClass(tone) {
    if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
    return `${wave1.banner} ${wave1.bannerWarning}`;
  }

  return (
    <div className={wave1.stack} data-testid="releases-root">
      <PageHeader
        title="Releases"
        description={
          !loading && !errorPresentation
            ? `${projectName} · ${rows.length} release(s)`
            : "Releases del proyecto (contexto legacy)."
        }
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          !loading && !errorPresentation ? (
            <div className={wave1.navRow}>
              <Button
                variant="primary"
                type="button"
                data-testid="releases-new"
                onClick={() => navigate(`/projects/${urlProjectId}/releases/new`)}
              >
                Nueva release
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}`)}>
                Proyecto
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="releases-loading">
          Cargando releases…
        </div>
      ) : (
        <span data-testid="releases-loaded-marker" hidden />
      )}

      {!loading && (
        <Card padding="default">
          {errorPresentation ? (
            <div className={bannerClass(errorPresentation.tone)} role="alert" data-testid="releases-error">
              <div className={wave1.meta} style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                {errorPresentation.title}
              </div>
              {errorPresentation.message}
            </div>
          ) : (
            <StatCardGrid>
              <StatCard label="Total" value={String(stats.total)} variant="primary" />
              <StatCard label="En curso / QA" value={String(stats.inFlight)} variant="warning" />
              <StatCard label="Publicadas" value={String(stats.released)} variant="success" />
            </StatCardGrid>
          )}

          {/* testid estable: E2E y accesibilidad; también en error de carga (antes no existía el nodo). */}
          <div data-testid="releases-table" className={wave1.tableSection}>
            {errorPresentation ? (
              <EmptyState
                title="No se pudieron cargar las releases"
                description={errorPresentation.message}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                title="Sin releases vinculadas"
                description="Aún no hay releases asociadas a este proyecto en el contexto actual."
                actions={
                  <Button
                    variant="primary"
                    type="button"
                    onClick={() => navigate(`/projects/${urlProjectId}/releases/new`)}
                  >
                    Crear release
                  </Button>
                }
              />
            ) : (
              <DataTable
                caption={`Releases · ${rows.length} fila(s)`}
                columns={columns}
                rows={rows}
                getRowKey={(row) => String(row.id)}
                renderCell={({ column, row, value }) => {
                  if (column.key === "name") {
                    return (
                      <button
                        type="button"
                        className={wave1.tableLink}
                        onClick={() => navigate(`/projects/${urlProjectId}/releases/${row.id}`)}
                      >
                        {value || "—"}
                      </button>
                    );
                  }
                  if (column.key === "status") {
                    return <Badge variant={mapReleaseStatusToDsBadgeVariant(row.status)}>{row.status || "—"}</Badge>;
                  }
                  if (column.key === "created_at") {
                    return value ? String(value).slice(0, 19).replace("T", " ") : "—";
                  }
                  return value ?? "—";
                }}
              />
            )}
          </div>

          {!errorPresentation ? (
            <p className={wave1.meta}>
              Usuario: {user?.email || "—"}
            </p>
          ) : null}
        </Card>
      )}
    </div>
  );
}
