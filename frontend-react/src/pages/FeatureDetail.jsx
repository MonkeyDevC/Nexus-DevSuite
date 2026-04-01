/**
 * Detalle feature — HTTP core, refetch tras guardar, delete con confirmación.
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
import { getProjectById } from "../services/projectApiClient.js";
import * as featuresService from "../modules/features/featuresService.js";
import { presentationForFeatureError } from "../modules/features/errorPresentation.js";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission } from "../auth/authorization.js";
import { Badge } from "../design-system/components/Badge/Badge.jsx";
import { Button } from "../design-system/components/Button/Button.jsx";
import { Card } from "../design-system/components/Card/Card.jsx";
import { Input } from "../design-system/components/Input/Input.jsx";
import { FormSection } from "../design-system/patterns/FormSection/FormSection.jsx";
import { PageHeader } from "../design-system/patterns/PageHeader/PageHeader.jsx";
import { mapFeatureStatusToDsBadgeVariant } from "./wave1DsMappers.js";
import wave1 from "./wave1Surfaces.module.css";

const MSG_LOADING = "Cargando...";
const MSG_NOT_FOUND = "Elemento no encontrado";
const MSG_MISMATCH = "Elemento no pertenece a este contexto";

function resolveFeatureProjectId(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.project_id != null && String(raw.project_id).trim() !== "") {
    const p = String(raw.project_id).trim();
    return isValidNexusUuid(p) ? p : null;
  }
  return null;
}

function normalizeFeature(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id != null ? String(raw.id).trim() : "";
  if (!id || !isValidNexusUuid(id)) return null;
  const titleFromTitle = typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title.trim() : null;
  const titleFromName = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : null;
  const displayTitle = titleFromTitle || titleFromName;
  if (!displayTitle) return null;
  return {
    id,
    displayTitle,
    description:
      typeof raw.description === "string" && raw.description.trim() !== "" ? raw.description.trim() : "",
    status: raw.status != null ? String(raw.status) : "UNKNOWN",
    created_at: raw.created_at != null ? raw.created_at : null,
    updated_at: raw.updated_at != null ? raw.updated_at : null,
  };
}

export default function FeatureDetail() {
  const { user } = useAuth();
  const { projectId, featureId } = useParams();
  const navigate = useNavigate();
  const canWriteFeature = hasPermission(user, "feature:write");
  const [displayFeature, setDisplayFeature] = useState(null);
  const [projectName, setProjectName] = useState("Project");
  const [loading, setLoading] = useState(true);
  const [errorPresentation, setErrorPresentation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const urlFeatureId = featureId != null ? String(featureId).trim() : "";

  const loadFeature = useCallback(async () => {
    setLoading(true);
    setErrorPresentation(null);
    setDisplayFeature(null);
    try {
      const raw = await featuresService.getFeature(urlFeatureId);
      const normalized = normalizeFeature(raw);
      if (!normalized || String(normalized.id) !== String(urlFeatureId)) {
        setErrorPresentation({ tone: "secondary", userMessage: MSG_NOT_FOUND });
        return;
      }
      const effectiveProjectId = resolveFeatureProjectId(raw);
      if (!effectiveProjectId || String(effectiveProjectId) !== String(urlProjectId)) {
        logDev("[FeatureDetail] mismatch proyecto", { urlProjectId, effectiveProjectId });
        setErrorPresentation({ tone: "danger", userMessage: MSG_MISMATCH });
        return;
      }
      setDisplayFeature(normalized);
      setEditTitle(normalized.displayTitle);
      setEditDescription(normalized.description);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProjectName(cached.name);
      } else {
        const p = await getProjectById(urlProjectId);
        setProjectName(p.name);
        setCachedProjectMeta(p.id, p.name);
      }
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForFeatureError(code));
    } finally {
      setLoading(false);
    }
  }, [urlFeatureId, urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId) || !isValidNexusUuid(urlFeatureId)) {
      logDev("[FeatureDetail] fallback navegacion: UUID invalido", { urlProjectId, urlFeatureId });
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadFeature();
    return undefined;
  }, [navigate, urlProjectId, urlFeatureId, loadFeature]);

  async function handleSave() {
    if (!displayFeature || saving) return;
    const t = editTitle.trim();
    const d = editDescription.trim();
    if (!t || !d) return;
    setSaving(true);
    setErrorPresentation(null);
    try {
      await featuresService.updateFeature(urlFeatureId, { title: t, description: d });
      await loadFeature();
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForFeatureError(code));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    setConfirmDeleteOpen(false);
    setSaving(true);
    setErrorPresentation(null);
    try {
      await featuresService.deleteFeature(urlFeatureId);
      await navigate(`/projects/${urlProjectId}/features`, { replace: true });
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorPresentation(presentationForFeatureError(code));
    } finally {
      setSaving(false);
    }
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectName, path: `/projects/${urlProjectId}` },
      {
        label: "Features",
        path: `/projects/${urlProjectId}/features`,
      },
      { label: displayFeature?.displayTitle || "Feature" },
    ],
    [displayFeature, projectName, urlProjectId]
  );

  function errorBannerClass() {
    if (!errorPresentation) return wave1.banner;
    if (errorPresentation.tone === "secondary") return `${wave1.banner} ${wave1.bannerSecondary}`;
    if (errorPresentation.tone === "danger") return `${wave1.banner} ${wave1.bannerDanger}`;
    return `${wave1.banner} ${wave1.bannerWarning}`;
  }

  return (
    <div className={wave1.stack} data-testid="feature-detail-root">
      <PageHeader
        title={displayFeature?.displayTitle || "Feature"}
        description={
          loading
            ? "Cargando detalle…"
            : displayFeature && !errorPresentation
              ? `Proyecto: ${projectName}`
              : undefined
        }
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        actions={
          !loading && displayFeature && !errorPresentation ? (
            <div className={wave1.navRow}>
              <Button variant="primary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/backlog`)}>
                Ver Backlog
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/projects/${urlProjectId}/features`)}>
                Features
              </Button>
              <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${urlProjectId}`)}>
                Proyecto
              </Button>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className={wave1.loading} data-testid="feature-detail-loading">
          {MSG_LOADING}
        </div>
      ) : null}

      {!loading && errorPresentation ? (
        <div className={errorBannerClass()} data-testid="feature-detail-message" role="alert">
          {errorPresentation.userMessage}
        </div>
      ) : null}

      {!loading && displayFeature && !errorPresentation ? (
        <Card padding="default" data-testid="feature-detail-card">
          <p className={wave1.meta}>ID: {displayFeature.id}</p>
          <div className={wave1.statusRow}>
            <span className={wave1.meta}>Estado</span>
            <Badge variant={mapFeatureStatusToDsBadgeVariant(displayFeature.status)}>{displayFeature.status}</Badge>
          </div>

          {canWriteFeature ? (
            <FormSection title="Editar" description="Título y descripción deben ser no vacíos para guardar.">
              <Input label="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={saving} />
              <div className={wave1.formField}>
                <label className={wave1.fieldLabel} htmlFor="feature-detail-desc">
                  Descripción
                </label>
                <textarea
                  id="feature-detail-desc"
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
                  Eliminar feature
                </Button>
              </div>
            </FormSection>
          ) : (
            <p className={wave1.readOnlyNote}>Solo lectura: tu rol no permite editar o eliminar features.</p>
          )}

          <p className={`${wave1.detailMeta} ${wave1.blockTopMargin}`}>
            Creada:{" "}
            {displayFeature.created_at ? String(displayFeature.created_at).slice(0, 19).replace("T", " ") : "—"} ·
            Actualizada:{" "}
            {displayFeature.updated_at ? String(displayFeature.updated_at).slice(0, 19).replace("T", " ") : "—"}
          </p>

          <div className={wave1.footerNav}>
            <Button variant="ghost" type="button" onClick={() => navigate("/projects")}>
              Lista proyectos
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Eliminar feature"
        message="Se eliminará esta feature. ¿Continuar?"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
