/**
 * Detalle story — HTTP core, refetch tras guardar, errores por código.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import ConfirmModal from "../components/ui/ConfirmModal/ConfirmModal.jsx";
import {
  getCachedFeatureProjectId,
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedFeatureProjectId,
  setCachedProjectMeta,
} from "../services/domainWorkCache.js";
import { getProjectById } from "../services/projectApiClient.js";
import * as featuresService from "../modules/features/featuresService.js";
import * as storiesService from "../modules/stories/storiesService.js";
import { presentationForStoryError } from "../modules/stories/errorPresentation.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { mapStoryStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_NOT_FOUND = "Elemento no encontrado";
const MSG_MISMATCH = "Elemento no pertenece a este contexto";

function normalizeFeature(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  if (!title) return null;
  const project_id = raw.project_id != null ? String(raw.project_id).trim() : "";
  if (!project_id || !isValidNexusUuid(project_id)) return null;
  return { id, title, project_id };
}

function formatDateSafe(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export default function StoryDetail() {
  const { user } = useAuth();
  const { projectId, storyId } = useParams();
  const navigate = useNavigate();
  const canWriteStory = hasPermission(user, "story:write");
  const [storyRaw, setStoryRaw] = useState(null);
  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlStoryId = storyId != null ? String(storyId).trim() : "";

  const loadStory = useCallback(async () => {
    setLoading(true);
    setErrorPresentation(null);
    setStoryRaw(null);
    try {
      const raw = await storiesService.getStory(urlStoryId);
      const title = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
      if (!title || String(raw.id) !== String(urlStoryId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }

      let effectiveProjectId = "";
      if (raw.feature_id != null) {
        const fid = String(raw.feature_id).trim();
        if (isValidNexusUuid(fid)) {
          const cached = getCachedFeatureProjectId(fid);
          if (cached) effectiveProjectId = String(cached).trim();
          else {
            const feat = await featuresService.getFeature(fid);
            const nf = normalizeFeature(feat);
            if (nf && nf.project_id) {
              effectiveProjectId = nf.project_id;
              setCachedFeatureProjectId(fid, effectiveProjectId);
            }
          }
        }
      }

      if (!effectiveProjectId || !isValidNexusUuid(effectiveProjectId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }
      if (String(effectiveProjectId) !== String(urlProjectId)) {
        setErrorPresentation({ tone: "danger", userMessage: MSG_MISMATCH });
        return;
      }

      setStoryRaw(raw);
      setEditTitle(title);
      setEditDescription(
        raw.description != null && String(raw.description).trim() !== "" ? String(raw.description) : ""
      );

      const cachedProj = getCachedProjectMeta(urlProjectId);
      if (cachedProj) setProjectName(cachedProj.name);
      else {
        const p = await getProjectById(urlProjectId);
        setProjectName(p.name);
        setCachedProjectMeta(p.id, p.name);
      }
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForStoryError(code));
    } finally {
      setLoading(false);
    }
  }, [urlProjectId, urlStoryId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId) || !isValidNexusUuid(urlStoryId)) {
      logDev("[StoryDetail] fallback navegacion: params UUID invalidos", { urlProjectId, urlStoryId });
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadStory();
    return undefined;
  }, [navigate, urlProjectId, urlStoryId, loadStory]);

  async function handleSave() {
    if (!storyRaw || saving) return;
    const t = editTitle.trim();
    const d = editDescription.trim();
    if (!t || !d) return;
    setSaving(true);
    setErrorPresentation(null);
    try {
      await storiesService.updateStory(urlStoryId, { title: t, description: d });
      await loadStory();
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForStoryError(code));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    setConfirmDeleteOpen(false);
    setSaving(true);
    setErrorPresentation(null);
    try {
      const fid = storyRaw && storyRaw.feature_id ? String(storyRaw.feature_id) : null;
      await storiesService.deleteStory(urlStoryId);
      if (fid && isValidNexusUuid(fid)) {
        await navigate(`/projects/${urlProjectId}/features/${fid}`, { replace: true });
      } else {
        await navigate(`/projects/${urlProjectId}/features`, { replace: true });
      }
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForStoryError(code));
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = storyRaw && storyRaw.status != null ? String(storyRaw.status) : "UNKNOWN";

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      {
        label: "Backlog",
        path: `/projects/${urlProjectId}/backlog`,
      },
      { label: editTitle || "Story" },
    ],
    [editTitle, projectName, urlProjectId]
  );

  function errorBannerClass() {
    if (!errorPresentation) return wave1.banner;
    if (errorPresentation.tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
    if (errorPresentation.tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
    return `${wave1.banner} ${wave1.bannerWarning}`;
  }

  return (
    <div className={wave1.stack} data-testid="story-detail-root">
      <PageHeader
        title={editTitle || "Historia"}
        description={
          loading
            ? "Cargando detalle…"
            : storyRaw && !errorPresentation
              ? `Proyecto: ${projectName}`
              : undefined
        }
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          !loading && storyRaw && !errorPresentation ? (
            <div className={wave1.navRow}>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}`)}>
                Proyecto
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/features`)}>
                Features
              </Button>
              <Button variant="primary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/backlog`)}>
                Backlog
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="story-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorPresentation ? (
        <div className={errorBannerClass()} data-testid="story-detail-message" role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {!loading && storyRaw && !errorPresentation ? (
        <Card padding="default" data-testid="story-detail-card">
          <p className={wave1.detailMeta}>
            <strong>Título:</strong> {editTitle}
          </p>

          <div className={wave1.statusRow}>
            <span className={wave1.meta}>Estado</span>
            <Badge variant={mapStoryStatusToDsBadgeVariant(statusLabel)}>{statusLabel}</Badge>
          </div>

          {canWriteStory ? (
            <FormSection title="Editar" description="Título y descripción obligatorios para guardar.">
              <Input label="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={saving} />
              <div className={wave1.formField}>
                <label className={wave1.fieldLabel} htmlFor="story-detail-desc">
                  Descripción
                </label>
                <textarea
                  id="story-detail-desc"
                  className={wave1.textarea}
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className={wave1.navRow}>
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim() || !editDescription.trim()}
                  loading={saving}
                >
                  Guardar cambios
                </Button>
                <Button variant="danger" type="button" onClick={() => setConfirmDeleteOpen(true)} disabled={saving}>
                  Eliminar historia
                </Button>
              </div>
            </FormSection>
          ) : (
            <p className={wave1.readOnlyNote}>Solo lectura: tu rol no permite editar o eliminar historias.</p>
          )}

          <p className={`${wave1.detailMeta} ${wave1.blockTopMargin}`}>
            <strong>Descripción (vista):</strong> {editDescription || "—"}
          </p>

          {formatDateSafe(storyRaw.created_at) ? (
            <p className={wave1.detailMeta}>
              <strong>Creada:</strong> {formatDateSafe(storyRaw.created_at)}
            </p>
          ) : null}
          {formatDateSafe(storyRaw.updated_at) ? (
            <p className={wave1.detailMeta}>
              <strong>Actualizada:</strong> {formatDateSafe(storyRaw.updated_at)}
            </p>
          ) : null}

          <div className={wave1.footerNav}>
            <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
              Lista proyectos
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Eliminar historia"
        message="Se eliminará esta historia. ¿Continuar?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
