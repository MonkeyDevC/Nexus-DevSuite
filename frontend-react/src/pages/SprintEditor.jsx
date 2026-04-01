/**
 * Crear o editar sprint (PLANNED) — HTTP core, errores por código.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import * as sprintService from "../modules/sprints/sprintsService.js";
import { presentationForSprintError } from "../modules/sprints/errorPresentation.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import ForbiddenPage from "./ForbiddenPage.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import { Textarea } from "../design-system/components/Textarea/Textarea.jsx";
import editorStyles from "./sprintEditor.module.css";

const MSG_LOADING = "Cargando...";

export default function SprintEditor() {
  const { user } = useAuth();
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlSprintId = sprintId != null ? String(sprintId).trim() : "";
  const mode = sprintId ? "edit" : "create";

  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      navigate("/projects", { replace: true });
    }
  }, [navigate, urlProjectId]);

  const load = useCallback(async () => {
    if (mode !== "edit" || !isValidNexusUuid(urlSprintId)) return;
    setLoading(true);
    setErrorPresentation(null);
    try {
      const sp = await sprintService.getSprint(urlSprintId);
      if (String(sp.project_id) !== String(urlProjectId)) {
        setErrorPresentation(presentationForSprintError("SPRINT_NOT_FOUND"));
        return;
      }
      if (sp.status !== "PLANNED") {
        setErrorPresentation({
          tone: "warning",
          userMessage: "Solo se puede editar un sprint en estado PLANNED.",
        });
        return;
      }
      setName(sp.name);
      setGoal(sp.goal || "");
      setStartDate(sp.start_date || "");
      setEndDate(sp.end_date || "");
      setStatus(sp.status);
    } catch (e) {
      setErrorPresentation(presentationForSprintError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [mode, urlProjectId, urlSprintId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = getCachedProjectMeta(urlProjectId);
      if (c) {
        if (!cancelled) setProjectName(c.name);
        return;
      }
      try {
        const p = await sprintService.getProject(urlProjectId);
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
        const created = await sprintService.createSprint({
          projectId: urlProjectId,
          name: name.trim(),
          goal: goal.trim() || null,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
        });
        if (created && created.id) {
          navigate(`/projects/${urlProjectId}/sprints/${created.id}`, { replace: true });
        }
      } else {
        await sprintService.updateSprint(urlSprintId, {
          name: name.trim(),
          goal: goal.trim() || null,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
        });
        navigate(`/projects/${urlProjectId}/sprints/${urlSprintId}`, { replace: true });
      }
    } catch (err) {
      setErrorPresentation(presentationForSprintError(err.code || "UNKNOWN_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      { label: "Sprints", path: `/projects/${urlProjectId}/sprints` },
      { label: mode === "create" ? "Nuevo sprint" : "Editar sprint" },
    ],
    [mode, projectName, urlProjectId]
  );

  if (mode === "create" && !hasPermission(user, "sprint:create")) {
    return (
      <ForbiddenPage
        title="Acceso denegado"
        message="Solo usuarios MASTER pueden crear sprints en este proyecto."
      />
    );
  }
  if (mode === "edit" && !hasPermission(user, "sprint:manage")) {
    return (
      <ForbiddenPage title="Acceso denegado" message="Tu rol no permite editar sprints." />
    );
  }

  const alertClass =
    errorPresentation &&
    (errorPresentation.tone === "danger"
      ? editorStyles.alertDanger
      : errorPresentation.tone === "secondary"
        ? editorStyles.alertSecondary
        : editorStyles.alertWarning);

  return (
    <div className={editorStyles.root} data-testid="sprint-editor-root">
      <div>
        <h1 className={editorStyles.title}>{mode === "create" ? "Nuevo sprint" : "Editar sprint"}</h1>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {loading ? <p className={editorStyles.muted}>{MSG_LOADING}</p> : null}

      {errorPresentation ? <div className={alertClass}>{errorPresentation.userMessage}</div> : null}

      {!loading && (mode === "create" || (status === "PLANNED" && !errorPresentation)) ? (
        <Card padding="default">
          <form onSubmit={onSubmit} className={editorStyles.formStack}>
            <Input
              id="sprint-name"
              label="Nombre"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              maxLength={255}
            />
            <Textarea id="sprint-goal" label="Objetivo" rows={3} value={goal} onChange={(ev) => setGoal(ev.target.value)} />
            <div className={editorStyles.dateRow}>
              <div className={editorStyles.dateField}>
                <Input
                  id="sprint-start"
                  label="Inicio"
                  type="date"
                  value={startDate}
                  onChange={(ev) => setStartDate(ev.target.value)}
                  required
                />
              </div>
              <div className={editorStyles.dateField}>
                <Input
                  id="sprint-end"
                  label="Fin"
                  type="date"
                  value={endDate}
                  onChange={(ev) => setEndDate(ev.target.value)}
                  required
                />
              </div>
            </div>
            <div className={editorStyles.actions}>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(
                    mode === "edit" && urlSprintId
                      ? `/projects/${urlProjectId}/sprints/${urlSprintId}`
                      : `/projects/${urlProjectId}/sprints`
                  )
                }
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
