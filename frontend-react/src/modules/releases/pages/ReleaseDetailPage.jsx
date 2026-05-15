/**
 * Detalle release: historias (canónico) + features legacy; start/publish con CR; asignar/quitar historia.
 * Admin UI System (T0); sin lógica de negocio fuera de handlers existentes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { getCachedProjectMeta, isValidNexusUuid, logDev, setCachedProjectMeta } from "../../../shared/cache/domainWorkCache.js";
import * as releasesService from "../releasesService.js";
import { presentationForReleaseError } from "../errorPresentation.js";
import { getProject } from "../../sprints/sprintsService.js";
import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Card } from "../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import { DataTable } from "../../../design-system/patterns/DataTable/DataTable.jsx";
import { FormSection } from "../../../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../../../design-system/patterns/PageHeader/PageHeader.jsx";
import { mapReleaseStatusToDsBadgeVariant } from "../../../shared/wave1/wave1DsMappers.js";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";

function errorBannerClass(tone) {
  if (tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
  if (tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
  return `${wave1.banner} ${wave1.bannerWarning}`;
}

export default function ReleaseDetailPage() {
  const { projectId, releaseId } = useParams();
  const navigate = useNavigate();
  const [release, setRelease] = useState(null);
  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [orphanForProject, setOrphanForProject] = useState(false);
  const [crStart, setCrStart] = useState("");
  const [crPublish, setCrPublish] = useState("");
  const [storyAssignId, setStoryAssignId] = useState("");
  const [busy, setBusy] = useState(false);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlReleaseId = releaseId != null ? String(releaseId).trim() : "";

  const reload = useCallback(async () => {
    if (!isValidNexusUuid(urlReleaseId)) return null;
    const data = await releasesService.getRelease(urlReleaseId);
    setRelease(data);
    return data;
  }, [urlReleaseId]);

  useEffect(() => {
    let cancelled = false;

    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[ReleaseDetail] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    if (!isValidNexusUuid(urlReleaseId)) {
      logDev("[ReleaseDetail] releaseId invalido", urlReleaseId);
      navigate("/projects", { replace: true });
      return undefined;
    }

    const cachedProj = getCachedProjectMeta(urlProjectId);
    if (cachedProj) setProjectName(cachedProj.name);

    async function load() {
      setLoading(true);
      setErrorPresentation(null);
      setOrphanForProject(false);
      setRelease(null);

      try {
        const data = await releasesService.getRelease(urlReleaseId);
        if (cancelled) return;
        if (String(data.id) !== String(urlReleaseId)) {
          setErrorPresentation(presentationForReleaseError("RELEASE_NOT_FOUND"));
          return;
        }
        const feats = Array.isArray(data.features) ? data.features : [];
        const stories = Array.isArray(data.stories) ? data.stories : [];
        const linkedFeat = feats.some((f) => f && String(f.project_id) === String(urlProjectId));
        const linkedStory = stories.some((s) => s && String(s.project_id) === String(urlProjectId));
        const hasAnyContent = feats.length > 0 || stories.length > 0;
        const linkedToProject = linkedFeat || linkedStory;
        setOrphanForProject(hasAnyContent && !linkedToProject);
        setRelease(data);
        if (!getCachedProjectMeta(urlProjectId)) {
          try {
            const np = await getProject(urlProjectId);
            if (!cancelled && np && String(np.id) === String(urlProjectId)) {
              setCachedProjectMeta(np.id, np.name);
              setProjectName(np.name);
            }
          } catch {
            /* ignore */
          }
        } else if (cachedProj) {
          setProjectName(cachedProj.name);
        }
      } catch (e) {
        if (cancelled) return;
        setErrorPresentation(presentationForReleaseError(e.code || "UNKNOWN_ERROR"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate, urlProjectId, urlReleaseId]);

  const storyLines = useMemo(() => {
    if (!release || !Array.isArray(release.stories)) return [];
    return release.stories.filter((s) => s && String(s.project_id) === String(urlProjectId));
  }, [release, urlProjectId]);

  const featureLines = useMemo(() => {
    if (!release || !Array.isArray(release.features)) return [];
    return release.features.filter((f) => f && String(f.project_id) === String(urlProjectId));
  }, [release, urlProjectId]);

  const frozen = release && release.status === "RELEASED";
  const canMutateRel = release && !frozen && release.status !== "ARCHIVED";

  const storyColumns = useMemo(
    () => [
      { key: "title", label: "Historia" },
      { key: "status", label: "Estado", align: "center" },
      { key: "actions", label: "Acciones", align: "end" },
    ],
    []
  );

  const featureColumns = useMemo(
    () => [
      { key: "title", label: "Feature" },
      { key: "status", label: "Estado", align: "center" },
    ],
    []
  );

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      { label: "Releases", path: `/projects/${urlProjectId}/releases` },
      { label: release ? release.name : "Release" },
    ],
    [projectName, release, urlProjectId]
  );

  function formatDate(value) {
    if (!value) return "—";
    return String(value).slice(0, 19).replace("T", " ");
  }

  async function onStart() {
    if (!crStart.trim()) {
      setErrorPresentation(presentationForReleaseError("CHANGE_REQUEST_REQUIRED"));
      return;
    }
    setBusy(true);
    setErrorPresentation(null);
    try {
      await releasesService.startRelease(urlReleaseId, crStart.trim());
      await reload();
    } catch (e) {
      setErrorPresentation(presentationForReleaseError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  async function onPublish() {
    if (!crPublish.trim()) {
      setErrorPresentation(presentationForReleaseError("CHANGE_REQUEST_REQUIRED"));
      return;
    }
    setBusy(true);
    setErrorPresentation(null);
    try {
      await releasesService.publishRelease(urlReleaseId, crPublish.trim());
      await reload();
    } catch (e) {
      setErrorPresentation(presentationForReleaseError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  async function onAssignStory() {
    if (!storyAssignId.trim() || !isValidNexusUuid(storyAssignId.trim())) {
      setErrorPresentation(presentationForReleaseError("VALIDATION_ERROR"));
      return;
    }
    setBusy(true);
    setErrorPresentation(null);
    try {
      await releasesService.assignStoryToRelease(storyAssignId.trim(), urlReleaseId);
      setStoryAssignId("");
      await reload();
    } catch (e) {
      setErrorPresentation(presentationForReleaseError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveStory(sid) {
    setBusy(true);
    setErrorPresentation(null);
    try {
      await releasesService.removeStoryFromRelease(sid);
      await reload();
    } catch (e) {
      setErrorPresentation(presentationForReleaseError(e.code || "UNKNOWN_ERROR"));
    } finally {
      setBusy(false);
    }
  }

  const monoClass = `${wave1.selectInput} ${wave1.meta}`;

  return (
    <div className={wave1.stack} data-testid="release-detail-root">
      <PageHeader
        title={release ? release.name : "Release"}
        description={
          !loading && release
            ? `${projectName} · ${release.version || "—"} · ${release.status || "—"}`
            : loading
              ? "Cargando detalle…"
              : undefined
        }
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          !loading && release && !errorPresentation ? (
            <div className={wave1.navRow}>
              {!frozen ? (
                <Button
                  variant="primary"
                  type="button"
                  data-testid="release-detail-edit"
                  disabled={busy}
                  onClick={() => navigate(`/projects/${urlProjectId}/releases/${urlReleaseId}/edit`)}
                >
                  Editar
                </Button>
              ) : null}
              <Button
                variant="secondary"
                type="button"
                data-testid="release-detail-nav-releases"
                disabled={busy}
                onClick={() => navigate(`/projects/${urlProjectId}/releases`)}
              >
                Volver a releases
              </Button>
              <Button
                variant="ghost"
                type="button"
                disabled={busy}
                onClick={() => navigate(`/projects/${urlProjectId}`)}
              >
                Volver al proyecto
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="release-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {errorPresentation ? (
        <div className={errorBannerClass(errorPresentation.tone)} data-testid="release-detail-error" role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {orphanForProject ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} data-testid="release-detail-orphan" role="status">
          Aún no hay features ni historias de este proyecto en esta release. Asigne una historia para enlazarla al
          proyecto.
        </div>
      ) : null}

      {!loading && !errorPresentation && release ? (
        <Card padding="default" data-testid="release-detail-card">
          <div className={wave1.cardHeaderRow}>
            <div>
              <h2 className={wave1.fieldLabel} style={{ fontSize: "var(--ds-font-size-lg)", margin: 0 }}>
                {release.name}
              </h2>
              <p className={wave1.detailMeta}>ID: {release.id}</p>
            </div>
            <Badge variant={mapReleaseStatusToDsBadgeVariant(release.status)}>{release.status}</Badge>
          </div>

          <FormSection title="Metadatos" description="Versión, descripción y fechas.">
            <div className={wave1.descriptionBlock}>
              <p className={wave1.labelOverBadge}>Versión</p>
              <p className={wave1.fieldLabel} style={{ margin: 0 }}>
                {release.version}
              </p>
            </div>
            <div className={wave1.descriptionBlock}>
              <p className={wave1.labelOverBadge}>Descripción</p>
              <p className={wave1.detailMeta} style={{ color: "var(--ds-color-text-heading)", margin: 0 }}>
                {release.description || "—"}
              </p>
            </div>
            <div className={wave1.navRow} style={{ alignItems: "stretch", gap: "var(--ds-space-4)" }}>
              <div>
                <p className={wave1.labelOverBadge}>Creado</p>
                <p className={wave1.detailMeta}>{formatDate(release.created_at)}</p>
              </div>
              <div>
                <p className={wave1.labelOverBadge}>Actualizado</p>
                <p className={wave1.detailMeta}>{formatDate(release.updated_at)}</p>
              </div>
              <div>
                <p className={wave1.labelOverBadge}>Publicado (release_date)</p>
                <p className={wave1.detailMeta}>{formatDate(release.release_date || release.released_at)}</p>
              </div>
            </div>
          </FormSection>

          {canMutateRel ? (
            <FormSection
              title="Transiciones"
              description="Requieren change_request_id aprobado (PLANNED → IN_PROGRESS → RELEASED)."
            >
              <div className={wave1.timelineRow}>
                <Input
                  id="cr-start"
                  label="CR start"
                  value={crStart}
                  onChange={(ev) => setCrStart(ev.target.value)}
                  className={monoClass}
                  data-testid="release-detail-cr-start"
                />
                <Button type="button" variant="primary" disabled={busy} data-testid="release-detail-start" onClick={onStart}>
                  Start (PLANNED → IN_PROGRESS)
                </Button>
              </div>
              <div className={`${wave1.timelineRow} ${wave1.blockTopMargin}`}>
                <Input
                  id="cr-publish"
                  label="CR publish"
                  value={crPublish}
                  onChange={(ev) => setCrPublish(ev.target.value)}
                  className={monoClass}
                  data-testid="release-detail-cr-publish"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  data-testid="release-detail-publish"
                  onClick={onPublish}
                >
                  Publish (→ RELEASED)
                </Button>
              </div>
            </FormSection>
          ) : null}

          <FormSection title="Historias (este proyecto)" description="Asignación por UUID de historia.">
            {!frozen ? (
              <div className={wave1.navRow} style={{ alignItems: "flex-end", marginBottom: "var(--ds-space-4)" }}>
                <div style={{ flex: "1 1 14rem", minWidth: "12rem" }}>
                  <Input
                    id="story-assign"
                    label="Story UUID"
                    value={storyAssignId}
                    onChange={(ev) => setStoryAssignId(ev.target.value)}
                    className={monoClass}
                    data-testid="release-detail-story-id"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  data-testid="release-detail-assign-story"
                  onClick={onAssignStory}
                >
                  Asignar historia
                </Button>
              </div>
            ) : null}
            <DataTable
              caption="Historias enlazadas por release_id"
              columns={storyColumns}
              rows={storyLines}
              getRowKey={(row) => String(row.id)}
              emptyContent="Ninguna historia enlazada por release_id."
              renderCell={({ column, row, value }) => {
                if (column.key === "title") {
                  return <span className={wave1.fieldLabel}>{row.title || row.id}</span>;
                }
                if (column.key === "status") {
                  return <span className={wave1.meta}>{value || "—"}</span>;
                }
                if (column.key === "actions") {
                  if (frozen) return <span className={wave1.meta}>—</span>;
                  return (
                    <Button
                      type="button"
                      variant="danger"
                      disabled={busy}
                      data-testid={`release-detail-remove-story-${row.id}`}
                      onClick={() => onRemoveStory(row.id)}
                    >
                      Quitar
                    </Button>
                  );
                }
                return value ?? "—";
              }}
            />
          </FormSection>

          <FormSection title="Features legacy" description="Features con release_id en el contexto del proyecto.">
            <DataTable
              caption="Features de este proyecto en la release"
              columns={featureColumns}
              rows={featureLines}
              getRowKey={(row) => String(row.id)}
              emptyContent="Ninguna feature de este proyecto en esta release."
              renderCell={({ column, row, value }) => {
                if (column.key === "title") {
                  return <span className={wave1.fieldLabel}>{row.title}</span>;
                }
                if (column.key === "status") {
                  return <span className={wave1.meta}>{value || "—"}</span>;
                }
                return value ?? "—";
              }}
            />
          </FormSection>
        </Card>
      ) : null}
    </div>
  );
}
