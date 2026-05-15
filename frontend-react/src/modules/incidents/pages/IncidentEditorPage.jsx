/**
 * Crear o editar incidente (Admin UI System) — PUT canónico en edición; HTTP core; errores por código.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  setCachedProjectMeta,
} from "../../../shared/cache/domainWorkCache.js";
import * as incidentService from "../incidentsService.js";
import { presentationForIncidentError } from "../errorPresentation.js";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission } from "../../../auth/authorization.js";
import ForbiddenPage from "../../../pages/ForbiddenPage.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Card } from "../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import { FormPage } from "../../../design-system/patterns/FormPage/FormPage.jsx";
import { FormSection } from "../../../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../../../design-system/patterns/PageHeader/PageHeader.jsx";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const SEVERITY_OPTS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const PRIORITY_OPTS = ["LOW", "MEDIUM", "HIGH"];

function errorBannerClass(tone) {
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

export default function IncidentEditorPage() {
  const { user } = useAuth();
  const { projectId, incidentId } = useParams();
  const navigate = useNavigate();
  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlIncidentId = incidentId != null ? String(incidentId).trim() : "";
  const mode = incidentId ? "edit" : "create";

  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [priority, setPriority] = useState("MEDIUM");
  const [storyId, setStoryId] = useState("");
  const [stories, setStories] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      navigate("/projects", { replace: true });
    }
  }, [navigate, urlProjectId]);

  const load = useCallback(async () => {
    if (mode !== "edit" || !isValidNexusUuid(urlIncidentId)) return;
    setLoading(true);
    setErrorPresentation(null);
    try {
      const inc = await incidentService.getIncident(urlIncidentId);
      if (String(inc.project_id) !== String(urlProjectId)) {
        setErrorPresentation(presentationForIncidentError("INCIDENT_NOT_FOUND"));
        return;
      }
      if (inc.status === "CLOSED") {
        setErrorPresentation({
          tone: "warning",
          userMessage: "No se puede editar un incidente cerrado.",
        });
        return;
      }
      setTitle(inc.title);
      setDescription(inc.description || "");
      setSeverity(inc.severity || "MEDIUM");
      setPriority(inc.priority || "MEDIUM");
      setStoryId(inc.story_id || "");
      setStatus(inc.status);
    } catch (e) {
      setErrorPresentation(presentationForIncidentError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [mode, urlProjectId, urlIncidentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await incidentService.listProjectStoriesBrief(urlProjectId, { limit: 100 });
        if (!cancelled) setStories(list);
      } catch {
        if (!cancelled) setStories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlProjectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = getCachedProjectMeta(urlProjectId);
      if (c) {
        if (!cancelled) setProjectName(c.name);
        return;
      }
      try {
        const p = await incidentService.getProject(urlProjectId);
        if (cancelled || !p) return;
        const n = typeof p.name === "string" ? p.name : "Project";
        setCachedProjectMeta(urlProjectId, n);
        setProjectName(n);
      } catch {
        if (!cancelled) setProjectName("Project");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlProjectId]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorPresentation(null);
    try {
      if (mode === "create") {
        const created = await incidentService.createIncidentRoot({
          project_id: urlProjectId,
          title: title.trim(),
          description: description.trim() || null,
          severity,
          priority,
          story_id: storyId.trim() || null,
        });
        if (created?.id) {
          navigate(`/projects/${urlProjectId}/incidents/${created.id}`, { replace: true });
        }
      } else {
        const payload = {
          title: title.trim(),
          description: description.trim() || null,
          severity,
          priority,
          story_id: storyId.trim() === "" ? null : storyId.trim(),
        };
        await incidentService.updateIncident(urlIncidentId, payload);
        navigate(`/projects/${urlProjectId}/incidents/${urlIncidentId}`, { replace: true });
      }
    } catch (err) {
      setErrorPresentation(presentationForIncidentError(err.code || "UNKNOWN_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      { label: "Incidents", path: `/projects/${urlProjectId}/incidents` },
      { label: mode === "create" ? "Nuevo incidente" : "Editar incidente" },
    ],
    [mode, projectName, urlProjectId]
  );

  const canShowForm = !loading && (mode === "create" || (status && status !== "CLOSED"));

  if (mode === "create" && !hasPermission(user, "incident:create")) {
    return (
      <ForbiddenPage
        title="Acceso denegado"
        message="Tu rol no permite crear incidentes en este proyecto."
      />
    );
  }
  if (mode === "edit" && !hasPermission(user, "incident:edit")) {
    return (
      <ForbiddenPage
        title="Acceso denegado"
        message="Tu rol no permite editar incidentes."
      />
    );
  }

  const pageTitle = mode === "create" ? "Nuevo incidente" : "Editar incidente";

  return (
    <div className={wave1.stack} data-testid="incident-editor-root">
      <PageHeader
        title={pageTitle}
        description={projectName ? `Proyecto: ${projectName}` : undefined}
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
      />

      {loading ? (
        <div className={wave1.loading} data-testid="incident-editor-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {errorPresentation ? (
        <div className={errorBannerClass(errorPresentation.tone)} role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {!loading && canShowForm ? (
        <Card padding="default">
          <FormPage
            formProps={{ onSubmit }}
            actions={
              <>
                <Button type="submit" variant="primary" disabled={saving} loading={saving}>
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() =>
                    navigate(
                      mode === "edit" && urlIncidentId
                        ? `/projects/${urlProjectId}/incidents/${urlIncidentId}`
                        : `/projects/${urlProjectId}/incidents`
                    )
                  }
                >
                  Cancelar
                </Button>
              </>
            }
          >
            <FormSection
              title="Datos del incidente"
              description={
                mode === "create"
                  ? "Completa título y severidad/prioridad. La descripción es opcional."
                  : "Modifica los campos permitidos mientras el incidente no esté cerrado."
              }
            >
              <Input
                id="incident-title"
                label="Título"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                required
                maxLength={255}
              />
              <div className={wave1.formField}>
                <label className={wave1.fieldLabel} htmlFor="incident-desc">
                  Descripción
                </label>
                <textarea
                  id="incident-desc"
                  className={wave1.textarea}
                  rows={3}
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                />
              </div>
              <div className={wave1.navRow} style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className={wave1.formField} style={{ flex: "1 1 12rem", minWidth: "10rem" }}>
                  <label className={wave1.fieldLabel} htmlFor="incident-severity">
                    Severidad
                  </label>
                  <select
                    id="incident-severity"
                    className={wave1.selectInput}
                    style={{ maxWidth: "none", width: "100%" }}
                    value={severity}
                    onChange={(ev) => setSeverity(ev.target.value)}
                    required
                  >
                    {SEVERITY_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={wave1.formField} style={{ flex: "1 1 12rem", minWidth: "10rem" }}>
                  <label className={wave1.fieldLabel} htmlFor="incident-priority">
                    Prioridad
                  </label>
                  <select
                    id="incident-priority"
                    className={wave1.selectInput}
                    style={{ maxWidth: "none", width: "100%" }}
                    value={priority}
                    onChange={(ev) => setPriority(ev.target.value)}
                    required
                  >
                    {PRIORITY_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={wave1.formField}>
                <label className={wave1.fieldLabel} htmlFor="incident-story">
                  Historia relacionada (opcional)
                </label>
                <select
                  id="incident-story"
                  className={wave1.selectInput}
                  style={{ maxWidth: "24rem" }}
                  value={storyId}
                  onChange={(ev) => setStoryId(ev.target.value)}
                  aria-label="Historia relacionada"
                >
                  <option value="">— Sin historia —</option>
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title || s.id}
                    </option>
                  ))}
                </select>
              </div>
            </FormSection>
          </FormPage>
        </Card>
      ) : null}
    </div>
  );
}
