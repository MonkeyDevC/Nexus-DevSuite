/**
 * ----
 * Modulo: Sprints
 * Descripcion: Listado de sprints por proyecto (Admin UI System); HTTP core; acciones start/close/delete/edit.
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import ConfirmModal from "../components/ui/ConfirmModal/ConfirmModal.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import * as sprintService from "../modules/sprints/sprintsService.js";
import { presentationForSprintError } from "../modules/sprints/errorPresentation.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { DataTable } from "../design-system/patterns/DataTable/DataTable.jsx";
import { EmptyState } from "../design-system/patterns/EmptyState/EmptyState.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { StatCard, StatCardGrid } from "../design-system/patterns/StatCard/StatCard.jsx";
import { mapSprintUiStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";

function mapSprintStatusForUi(apiStatus) {
  const s = apiStatus != null ? String(apiStatus).trim() : "";
  if (s === "IN_PROGRESS") return "ACTIVE";
  if (s === "CLOSED") return "COMPLETED";
  if (s === "PLANNED") return "INACTIVE";
  return "INACTIVE";
}

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pid = raw.id != null ? String(raw.id).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return null;
  const pname = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!pname) return null;
  return { id: pid, name: pname, status: raw.status != null ? String(raw.status) : "UNKNOWN" };
}

function mutationBannerClass(tone) {
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

export default function Sprints() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateSprint = hasPermission(user, "sprint:create");
  const canManageSprint = hasPermission(user, "sprint:manage");
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mutationError, setMutationError] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [confirm, setConfirm] = useState(null);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";

  const load = useCallback(async () => {
    if (!isValidNexusUuid(urlProjectId)) return;
    setLoading(true);
    setErrorMessage("");
    setMutationError(null);
    setProject(null);
    setSprints([]);
    try {
      const { items } = await sprintService.listSprints(urlProjectId, { page: 1, limit: 50 });
      setSprints(Array.isArray(items) ? items : []);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const pdata = await sprintService.getProject(urlProjectId);
        const np = normalizeProject(pdata);
        if (!np || String(np.id) !== String(urlProjectId)) {
          setErrorMessage(MSG_ERROR);
          setSprints([]);
          return;
        }
        setCachedProjectMeta(np.id, np.name);
        setProject(np);
      }
    } catch (e) {
      logDev("[Sprints] load error", e && e.code);
      setErrorMessage(MSG_ERROR);
    } finally {
      setLoading(false);
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Sprints] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    load();
    return undefined;
  }, [load, navigate, urlProjectId]);

  const columns = useMemo(
    () => [
      { key: "name", label: "Nombre" },
      { key: "status", label: "Estado", align: "center" },
      { key: "start_date", label: "Inicio" },
      { key: "end_date", label: "Fin" },
      { key: "actions", label: "Acciones" },
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
      { label: "Sprints" },
    ],
    [project]
  );

  async function runConfirmedAction() {
    if (!confirm || !confirm.row) {
      setConfirm(null);
      return;
    }
    const row = confirm.row;
    const kind = confirm.type;
    setConfirm(null);
    setMutationError(null);
    setBusyId(row.id);
    try {
      if (kind === "start") {
        await sprintService.startSprint(row.id);
      } else if (kind === "close") {
        await sprintService.closeSprint(row.id);
      } else if (kind === "delete") {
        await sprintService.deleteSprint(row.id);
      }
      await load();
    } catch (e) {
      setMutationError(presentationForSprintError(e && e.code));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className={wave1.stack} data-testid="sprints-root">
      <PageHeader
        title="Sprints"
        description={
          project ? `${project.name} · ${sprints.length} sprint(s)` : "Sprints del proyecto."
        }
        breadcrumb={
          <div data-testid="breadcrumb-sprints">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        }
        actions={
          !loading && project ? (
            <div className={wave1.navRow}>
              {canCreateSprint ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}/sprints/new`)}
                >
                  Nuevo sprint
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
              <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
                Lista proyectos
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="sprints-loading">
          {MSG_LOADING}
        </div>
      ) : (
        <span data-testid="sprints-loaded-marker" hidden />
      )}

      {!loading && errorMessage ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} data-testid="sprints-error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {!loading && mutationError ? (
        <div className={mutationBannerClass(mutationError.tone)} role="alert">
          {mutationError.userMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && project ? (
        <Card padding="default">
          <StatCardGrid>
            <StatCard label="Total sprints" value={String(sprints.length)} variant="primary" />
          </StatCardGrid>

          <div data-testid="sprints-table" className={wave1.tableSection}>
            {sprints.length === 0 ? (
              <EmptyState
                title="Sin sprints"
                description="Aún no hay sprints en este proyecto. Crea uno nuevo o revisa permisos."
                actions={
                  canCreateSprint ? (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}/sprints/new`)}
                    >
                      Nuevo sprint
                    </Button>
                  ) : null
                }
              />
            ) : (
              <DataTable
                caption={`Sprints · ${sprints.length} fila(s)`}
                columns={columns}
                rows={sprints}
                getRowKey={(row) => row.id}
                renderCell={({ column, row, value }) => {
                  if (column.key === "name") {
                    return (
                      <button
                        type="button"
                        className={wave1.tableLink}
                        onClick={() => {
                          if (!row || !row.id || !project) return;
                          navigate(`/projects/${project.id}/sprints/${row.id}`);
                        }}
                      >
                        {value || "—"}
                      </button>
                    );
                  }
                  if (column.key === "status") {
                    const ui = mapSprintStatusForUi(row.status);
                    return <Badge variant={mapSprintUiStatusToDsBadgeVariant(ui)}>{ui}</Badge>;
                  }
                  if (column.key === "start_date" || column.key === "end_date") {
                    return value ? String(value).slice(0, 10) : "—";
                  }
                  if (column.key === "actions") {
                    const st = row.status != null ? String(row.status) : "";
                    const disabled = busyId === row.id;
                    return (
                      <div className={wave1.navRow} onClick={(ev) => ev.stopPropagation()} role="presentation">
                        {st === "PLANNED" && canManageSprint ? (
                          <>
                            <Button
                              variant="secondary"
                              type="button"
                              disabled={disabled}
                              onClick={() => navigate(`/projects/${project.id}/sprints/${row.id}/edit`)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="secondary"
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                setConfirm({
                                  type: "start",
                                  row,
                                  title: "Activar sprint",
                                  message:
                                    "¿Activar este sprint? Solo puede haber un sprint en curso por proyecto.",
                                })
                              }
                            >
                              Iniciar
                            </Button>
                            <Button
                              variant="danger"
                              type="button"
                              disabled={disabled}
                              onClick={() =>
                                setConfirm({
                                  type: "delete",
                                  row,
                                  title: "Eliminar sprint",
                                  message: "¿Eliminar este sprint planificado? Esta acción no se puede deshacer.",
                                })
                              }
                            >
                              Eliminar
                            </Button>
                          </>
                        ) : null}
                        {st === "IN_PROGRESS" && canManageSprint ? (
                          <Button
                            variant="secondary"
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              setConfirm({
                                type: "close",
                                row,
                                title: "Cerrar sprint",
                                message:
                                  "¿Cerrar el sprint? Las historias no completadas se desasignarán del sprint.",
                              })
                            }
                          >
                            Cerrar
                          </Button>
                        ) : null}
                        {st === "CLOSED" ? <span className={wave1.meta}>—</span> : null}
                      </div>
                    );
                  }
                  return value ?? "—";
                }}
              />
            )}
          </div>
        </Card>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm && confirm.title}
        message={confirm && confirm.message}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          runConfirmedAction();
        }}
      />
    </div>
  );
}
