/**
 * ----
 * Modulo: IncidentDetail
 * Descripcion: Detalle incidente (Admin UI System); transiciones; cierre con root_cause; edicion; delete OPEN.
 * ----
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import Modal from "../components/ui/Modal/Modal.jsx";
import ConfirmModal from "../components/ui/ConfirmModal/ConfirmModal.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import * as incidentService from "../modules/incidents/incidentsService.js";
import { presentationForIncidentError } from "../modules/incidents/errorPresentation.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import {
  mapIncidentPriorityToDsBadgeVariant,
  mapIncidentSeverityToDsBadgeVariant,
  mapIncidentStatusToDsBadgeVariant,
} from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_ERROR = "Error cargando datos";
const MSG_NOT_FOUND = "Elemento no encontrado";
const MSG_MISMATCH = "Elemento no pertenece a este contexto";

function normalizeProject(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pid = raw.id != null ? String(raw.id).trim() : "";
  if (!pid || !isValidNexusUuid(pid)) return null;
  const pname = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  if (!pname) return null;
  return { id: pid, name: pname };
}

function errorBannerClass(tone) {
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

function actionErrorClass(tone) {
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

export default function IncidentDetail() {
  const { user } = useAuth();
  const { projectId, incidentId } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [storyLabel, setStoryLabel] = useState("");
  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [alertTone, setAlertTone] = useState("warning");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [rootCauseDraft, setRootCauseDraft] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlIncidentId = incidentId != null ? String(incidentId).trim() : "";
  const canEditIncident = hasPermission(user, "incident:edit");
  const canTransitionIncident = hasPermission(user, "incident:transition");
  const canCloseIncident = hasPermission(user, "incident:close");
  const canDeleteIncident = hasPermission(user, "incident:delete");

  const load = useCallback(async () => {
    if (!isValidNexusUuid(urlIncidentId) || !isValidNexusUuid(urlProjectId)) return;
    setLoading(true);
    setErrorMessage("");
    setAlertTone("warning");
    setIncident(null);
    setStoryLabel("");
    try {
      const data = await incidentService.getIncident(urlIncidentId);
      if (String(data.project_id) !== String(urlProjectId)) {
        logDev("[IncidentDetail] mismatch proyecto URL vs incidente", {
          urlProjectId,
          incidentProjectId: data.project_id,
        });
        setAlertTone("danger");
        setErrorMessage(MSG_MISMATCH);
        return;
      }
      setIncident(data);

      try {
        const stories = await incidentService.listProjectStoriesBrief(urlProjectId, { limit: 200 });
        if (data.story_id) {
          const found = stories.find((s) => String(s.id) === String(data.story_id));
          setStoryLabel(found ? `${found.title || found.id}` : String(data.story_id));
        }
      } catch {
        if (data.story_id) setStoryLabel(String(data.story_id));
      }
    } catch (e) {
      const code = e?.code || "UNKNOWN_ERROR";
      if (code === "INCIDENT_NOT_FOUND") {
        setAlertTone("secondary");
        setErrorMessage(MSG_NOT_FOUND);
      } else {
        setErrorMessage(MSG_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }, [urlProjectId, urlIncidentId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      navigate("/projects", { replace: true });
      return undefined;
    }
    if (!isValidNexusUuid(urlIncidentId)) {
      navigate("/projects", { replace: true });
      return undefined;
    }

    const cachedProj = getCachedProjectMeta(urlProjectId);
    if (cachedProj) setProjectName(cachedProj.name);

    (async () => {
      if (!getCachedProjectMeta(urlProjectId)) {
        try {
          const pdata = await incidentService.getProject(urlProjectId);
          const np = normalizeProject(pdata);
          if (np && String(np.id) === String(urlProjectId)) {
            setCachedProjectMeta(np.id, np.name);
            setProjectName(np.name);
          }
        } catch {
          /* noop */
        }
      } else if (cachedProj) {
        setProjectName(cachedProj.name);
      }
    })();

    load();
    return undefined;
  }, [navigate, urlProjectId, urlIncidentId, load]);

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      {
        label: "Incidents",
        path: `/projects/${urlProjectId}/incidents`,
      },
      { label: incident ? incident.title : "Incident" },
    ],
    [projectName, incident, urlProjectId]
  );

  function formatDate(value) {
    if (!value) return "—";
    return String(value).slice(0, 19).replace("T", " ");
  }

  async function runAction(fn) {
    setActionBusy(true);
    setActionError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      const code = e?.code || "UNKNOWN_ERROR";
      setActionError(presentationForIncidentError(code));
    } finally {
      setActionBusy(false);
    }
  }

  function onStart() {
    runAction(() => incidentService.startIncident(urlIncidentId));
  }

  function onResolve() {
    runAction(() => incidentService.resolveIncident(urlIncidentId));
  }

  function onConfirmClose() {
    const rca = String(rootCauseDraft || "").trim();
    runAction(async () => {
      await incidentService.closeIncident(urlIncidentId, { root_cause_analysis: rca });
      setCloseModalOpen(false);
      setRootCauseDraft("");
    });
  }

  function onDeleteConfirm() {
    runAction(async () => {
      await incidentService.deleteIncident(urlIncidentId);
      setDeleteModalOpen(false);
      navigate(`/projects/${urlProjectId}/incidents`, { replace: true });
    });
  }

  const canEdit = incident && incident.status !== "CLOSED";
  const canDelete = incident && incident.status === "OPEN";
  const canStart = incident && incident.status === "OPEN";
  const canResolve = incident && incident.status === "IN_PROGRESS";
  const canClose = incident && incident.status === "RESOLVED";

  const headerDescription =
    incident && !errorMessage ? `${projectName} · ${incident.status}` : loading ? "Cargando detalle…" : undefined;

  return (
    <div className={wave1.stack} data-testid="incident-detail-root">
      <PageHeader
        title={incident ? incident.title : "Incident"}
        description={!loading && errorMessage ? undefined : headerDescription}
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          !loading && incident && !errorMessage ? (
            <div className={wave1.navRow}>
              {canEdit && canEditIncident ? (
                <Button
                  variant="primary"
                  type="button"
                  data-testid="incident-detail-edit"
                  disabled={actionBusy}
                  onClick={() => navigate(`/projects/${urlProjectId}/incidents/${urlIncidentId}/edit`)}
                >
                  Editar
                </Button>
              ) : null}
              {canStart && canTransitionIncident ? (
                <Button
                  variant="secondary"
                  type="button"
                  data-testid="incident-detail-start"
                  disabled={actionBusy}
                  onClick={onStart}
                >
                  Iniciar
                </Button>
              ) : null}
              {canResolve && canTransitionIncident ? (
                <Button
                  variant="secondary"
                  type="button"
                  data-testid="incident-detail-resolve"
                  disabled={actionBusy}
                  onClick={onResolve}
                >
                  Resolver
                </Button>
              ) : null}
              {canClose && canCloseIncident ? (
                <Button
                  variant="secondary"
                  type="button"
                  data-testid="incident-detail-close"
                  disabled={actionBusy}
                  onClick={() => {
                    setActionError(null);
                    setRootCauseDraft(incident.root_cause_analysis || "");
                    setCloseModalOpen(true);
                  }}
                >
                  Cerrar
                </Button>
              ) : null}
              {canDelete && canDeleteIncident ? (
                <Button
                  variant="danger"
                  type="button"
                  data-testid="incident-detail-delete"
                  disabled={actionBusy}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="incident-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorMessage ? (
        <div
          className={errorBannerClass(alertTone)}
          data-testid="incident-detail-message"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className={actionErrorClass(actionError.tone)} data-testid="incident-detail-action-error" role="alert">
          {actionError.userMessage}
        </div>
      ) : null}

      {canClose && !canCloseIncident ? (
        <p className={wave1.readOnlyNote}>
          Solo usuarios MASTER pueden cerrar incidentes (política del servidor).
        </p>
      ) : null}

      {!loading && !errorMessage && incident ? (
        <>
          <Card padding="default" data-testid="incident-detail-card">
            <p className={wave1.meta}>ID: {incident.id}</p>
            <div className={wave1.statusRow}>
              <Badge variant={mapIncidentStatusToDsBadgeVariant(incident.status)}>{incident.status}</Badge>
              <Badge variant={mapIncidentSeverityToDsBadgeVariant(incident.severity)}>
                {incident.severity || "—"}
              </Badge>
              <Badge variant={mapIncidentPriorityToDsBadgeVariant(incident.priority)}>
                {incident.priority || "—"}
              </Badge>
            </div>

            <FormSection title="Descripción" description="Contexto del incidente.">
              <p className={wave1.detailMeta} style={{ margin: 0 }}>
                {incident.description || "—"}
              </p>
            </FormSection>

            <FormSection title="Vínculos y análisis" description="Historia relacionada y causa raíz registrada.">
              <p className={wave1.meta}>Historia relacionada</p>
              <p className={wave1.detailMeta} style={{ marginTop: 0 }}>
                {incident.story_id ? storyLabel || incident.story_id : "—"}
              </p>
              <p className={wave1.meta}>Análisis causa raíz</p>
              <p className={wave1.detailMeta} style={{ marginTop: 0 }}>
                {incident.root_cause_analysis || "—"}
              </p>
            </FormSection>

            <FormSection title="Metadatos" description="Fechas del ciclo de vida.">
              <div className={wave1.navRow} style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <p className={wave1.meta}>Creado</p>
                  <p className={wave1.detailMeta} style={{ marginTop: 0 }}>
                    {formatDate(incident.created_at)}
                  </p>
                </div>
                <div>
                  <p className={wave1.meta}>Actualizado</p>
                  <p className={wave1.detailMeta} style={{ marginTop: 0 }}>
                    {formatDate(incident.updated_at)}
                  </p>
                </div>
                <div>
                  <p className={wave1.meta}>Cerrado</p>
                  <p className={wave1.detailMeta} style={{ marginTop: 0 }}>
                    {formatDate(incident.closed_at)}
                  </p>
                </div>
              </div>
            </FormSection>
          </Card>

          <div className={`${wave1.navRow} ${wave1.footerNav}`}>
            <Button
              variant="secondary"
              type="button"
              data-testid="incident-detail-nav-incidents"
              onClick={() => navigate(`/projects/${urlProjectId}/incidents`)}
            >
              Volver a incidents
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${urlProjectId}`)}>
              Volver al proyecto
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
              Volver a lista
            </Button>
          </div>
        </>
      ) : null}

      <Modal isOpen={closeModalOpen} onClose={() => !actionBusy && setCloseModalOpen(false)} title="Cerrar incidente">
        <p className={wave1.detailMeta}>Indique el análisis de causa raíz (obligatorio para cierre ISO).</p>
        <textarea
          className={wave1.textarea}
          rows={4}
          value={rootCauseDraft}
          onChange={(e) => setRootCauseDraft(e.target.value)}
          placeholder="Análisis de causa raíz..."
          data-testid="incident-close-root-cause"
        />
        <div className={wave1.navRow} style={{ justifyContent: "flex-end", marginTop: "var(--ds-space-3)" }}>
          <Button type="button" variant="ghost" disabled={actionBusy} onClick={() => setCloseModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={actionBusy}
            data-testid="incident-close-confirm"
            onClick={onConfirmClose}
          >
            Confirmar cierre
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onCancel={() => !actionBusy && setDeleteModalOpen(false)}
        onConfirm={onDeleteConfirm}
        title="Eliminar incidente"
        message="Solo se pueden eliminar incidentes en estado OPEN. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
}
