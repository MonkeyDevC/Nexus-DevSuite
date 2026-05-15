/**
 * Crear o editar sprint (PLANNED) — HTTP core, errores por código.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  setCachedProjectMeta,
} from "../../../shared/cache/domainWorkCache.js";
import * as sprintService from "../sprintsService.js";
import { presentationForSprintError } from "../errorPresentation.js";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission } from "../../../auth/authorization.js";
import ForbiddenPage from "../../../pages/ForbiddenPage.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Card } from "../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../../design-system/components/Textarea/Textarea.jsx";
import editorStyles from "./sprintEditor.module.css";
import { sprintDetailUrl, sprintsListUrl } from "../../../shared/routing/workspaceNavUrls.js";

const MSG_LOADING = "Cargando...";

export default function SprintEditorPage() {
  const { user } = useAuth();
  const { sprintId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlProjectIdFromQuery = searchParams.get("project") != null ? String(searchParams.get("project")).trim() : "";
  const urlSprintId = sprintId != null ? String(sprintId).trim() : "";
  const mode = urlSprintId ? "edit" : "create";
  const [resolvedProjectId, setResolvedProjectId] = useState("");
  const urlProjectId = mode === "edit" ? resolvedProjectId || urlProjectIdFromQuery : urlProjectIdFromQuery;

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
    if (mode === "create" && !isValidNexusUuid(urlProjectIdFromQuery)) {
      navigate("/projects", { replace: true });
    }
  }, [mode, navigate, urlProjectIdFromQuery]);

  useEffect(() => {
    if (mode === "edit" && !isValidNexusUuid(urlSprintId)) {
      navigate("/projects", { replace: true });
    }
  }, [mode, navigate, urlSprintId]);

  const load = useCallback(async () => {
    if (mode !== "edit" || !isValidNexusUuid(urlSprintId)) return;
    setLoading(true);
    setErrorPresentation(null);
    try {
      const sp = await sprintService.getSprint(urlSprintId);
      const pid = sp.project_id != null ? String(sp.project_id).trim() : "";
      if (!isValidNexusUuid(pid)) {
        setErrorPresentation(presentationForSprintError("SPRINT_NOT_FOUND"));
        return;
      }
      if (isValidNexusUuid(urlProjectIdFromQuery) && pid !== urlProjectIdFromQuery) {
        setErrorPresentation(presentationForSprintError("SPRINT_NOT_FOUND"));
        return;
      }
      setResolvedProjectId(pid);
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
  }, [mode, urlProjectIdFromQuery, urlSprintId]);

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
          navigate(sprintDetailUrl(created.id, urlProjectId), { replace: true });
        }
      } else {
        await sprintService.updateSprint(urlSprintId, {
          name: name.trim(),
          goal: goal.trim() || null,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
        });
        navigate(sprintDetailUrl(urlSprintId, urlProjectId), { replace: true });
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
      { label: "Proyectos", path: "/projects" },
      { label: projectName, path: isValidNexusUuid(urlProjectId) ? `/projects/${urlProjectId}` : undefined },
      { label: "Sprint Backlog", path: isValidNexusUuid(urlProjectId) ? sprintsListUrl(urlProjectId) : undefined },
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
                      ? sprintDetailUrl(urlSprintId, urlProjectId)
                      : sprintsListUrl(urlProjectId)
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
