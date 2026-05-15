/**
 * Crear o editar release (no RELEASED) — HTTP shared; Admin UI System (FormPage / FormSection).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { getCachedProjectMeta, isValidNexusUuid, setCachedProjectMeta } from "../../../shared/cache/domainWorkCache.js";
import * as releasesService from "../releasesService.js";
import { presentationForReleaseError } from "../errorPresentation.js";
import { getProject } from "../../sprints/sprintsService.js";
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

function errorBannerClass(tone) {
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

export default function ReleaseEditorPage() {
  const { user } = useAuth();
  const { projectId, releaseId } = useParams();
  const navigate = useNavigate();
  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const effectiveReleaseId = releaseId != null ? String(releaseId).trim() : "";
  const mode = effectiveReleaseId ? "edit" : "create";

  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [changeRequestId, setChangeRequestId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      navigate("/projects", { replace: true });
    }
  }, [navigate, urlProjectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = getCachedProjectMeta(urlProjectId);
      if (c) {
        if (!cancelled) setProjectName(c.name);
        return;
      }
      try {
        const p = await getProject(urlProjectId);
        if (cancelled || !p) return;
        const n = typeof p.name === "string" ? p.name : "Project";
        setCachedProjectMeta(urlProjectId, n);
        if (!cancelled) setProjectName(n);
      } catch {
        if (!cancelled) setProjectName("Project");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlProjectId]);

  const load = useCallback(async () => {
    if (mode !== "edit" || !isValidNexusUuid(effectiveReleaseId)) return;
    setLoading(true);
    setErrorPresentation(null);
    try {
      const r = await releasesService.getRelease(effectiveReleaseId);
      setName(r.name || "");
      setVersion(r.version || "");
      setDescription(r.description || "");
      setStatus(r.status || "");
      if (r.status === "RELEASED") {
        setErrorPresentation(presentationForReleaseError("RELEASE_FROZEN"));
      }
    } catch (e) {
      setErrorPresentation(presentationForReleaseError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [mode, effectiveReleaseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorPresentation(null);
    try {
      if (mode === "create") {
        const created = await releasesService.createRelease({
          name: name.trim(),
          version: version.trim(),
          description: description.trim() || null,
        });
        if (created && created.id) {
          navigate(`/projects/${urlProjectId}/releases/${created.id}`, { replace: true });
        }
      } else {
        if (!changeRequestId.trim()) {
          setErrorPresentation(presentationForReleaseError("CHANGE_REQUEST_REQUIRED"));
          return;
        }
        await releasesService.updateRelease(effectiveReleaseId, {
          change_request_id: changeRequestId.trim(),
          name: name.trim(),
          version: version.trim(),
          description: description.trim() || null,
        });
        navigate(`/projects/${urlProjectId}/releases/${effectiveReleaseId}`, { replace: true });
      }
    } catch (err) {
      setErrorPresentation(presentationForReleaseError(err.code || "UNKNOWN_ERROR"));
    } finally {
      setSaving(false);
    }
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      { label: "Releases", path: `/projects/${urlProjectId}/releases` },
      { label: mode === "create" ? "Nueva release" : "Editar release" },
    ],
    [mode, projectName, urlProjectId]
  );

  const frozen = status === "RELEASED";
  const pageTitle = mode === "create" ? "Nueva release" : "Editar release";
  const canShowForm = !frozen && (mode === "create" || (mode === "edit" && !errorPresentation));

  if (!hasPermission(user, "release:access")) {
    return (
      <ForbiddenPage
        title="Acceso denegado"
        message="Tu rol no permite acceder al módulo de releases en este proyecto."
      />
    );
  }

  return (
    <div className={wave1.stack} data-testid="release-editor-root">
      <PageHeader
        title={pageTitle}
        description={projectName ? `Proyecto: ${projectName}` : undefined}
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
      />

      {loading ? (
        <div className={wave1.loading} data-testid="release-editor-loading">
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
                <Button type="submit" variant="primary" disabled={saving} loading={saving} data-testid="release-editor-save">
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() =>
                    navigate(
                      mode === "edit" && effectiveReleaseId
                        ? `/projects/${urlProjectId}/releases/${effectiveReleaseId}`
                        : `/projects/${urlProjectId}/releases`
                    )
                  }
                >
                  Cancelar
                </Button>
              </>
            }
          >
            <FormSection
              title={mode === "create" ? "Alta de release" : "Edición de release"}
              description={
                mode === "create"
                  ? "Nombre y versión son obligatorios. La descripción es opcional."
                  : "Se requiere change_request_id aprobado para guardar cambios en una release existente."
              }
            >
              <Input
                id="rel-name"
                label="Nombre"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                required
                maxLength={255}
                data-testid="release-editor-name"
              />
              <Input
                id="rel-version"
                label="Versión"
                value={version}
                onChange={(ev) => setVersion(ev.target.value)}
                required
                maxLength={50}
                data-testid="release-editor-version"
              />
              <div className={wave1.formField}>
                <label className={wave1.fieldLabel} htmlFor="rel-desc">
                  Descripción
                </label>
                <textarea
                  id="rel-desc"
                  className={wave1.textarea}
                  rows={3}
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                  data-testid="release-editor-description"
                />
              </div>
              {mode === "edit" ? (
                <Input
                  id="rel-cr"
                  label="change_request_id (obligatorio para guardar)"
                  value={changeRequestId}
                  onChange={(ev) => setChangeRequestId(ev.target.value)}
                  placeholder="UUID"
                  className={wave1.selectInput}
                  data-testid="release-editor-cr"
                />
              ) : null}
            </FormSection>
          </FormPage>
        </Card>
      ) : null}
    </div>
  );
}
