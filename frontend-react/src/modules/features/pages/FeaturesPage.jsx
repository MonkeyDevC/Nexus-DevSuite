/**
 * Listado de features por proyecto — panel alineado a ProjectsPage (tabla, tabs, modal crear).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import Modal from "../../../design-system/components/Modal/Modal.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../../../shared/cache/domainWorkCache.js";
import { getProjectById, useProjectContext } from "../../projects/index.js";
import * as featuresService from "../featuresService.js";
import { presentationForFeatureError } from "../errorPresentation.js";
import FormCreateFeature from "../components/forms/FormCreateFeature.jsx";
import TableFeatures from "../components/tables/TableFeatures.jsx";
import LoadingSpinner from "../../projects/components/tables/LoadingSpinner.jsx";
import ErrorBanner from "../../projects/components/workspace/ErrorBanner.jsx";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../auth/authorization.js";
import { mapFeatureDto } from "../featureDto.js";
import TableFilterSelect from "../../projects/components/tables/TableFilterSelect.jsx";
import pageStyles from "../styles/featuresPage.module.css";

function normalizeFeatureForPage(raw, urlProjectId) {
  const mapped = mapFeatureDto(raw);
  if (!mapped) return null;
  if (mapped.project_id != null) {
    const pid = String(mapped.project_id).trim();
    if (!isValidNexusUuid(pid) || pid !== String(urlProjectId)) {
      logDev("[Features] feature project_id inconsistente con URL", { pid, urlProjectId });
      return null;
    }
  }
  const t = mapped.title != null ? String(mapped.title).trim() : "";
  if (!t) {
    logDev("[Features] feature sin título", raw);
    return null;
  }
  return mapped;
}

export default function FeaturesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, refreshProjects } = useProjectContext();
  const isMaster = hasRole(user, ROLE_MASTER);
  const canWriteFeature = hasPermission(user, "feature:write");
  const canListProjects = hasPermission(user, "project:read");

  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [projectCatalogReady, setProjectCatalogReady] = useState(false);
  const successTimerRef = useRef(null);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";

  useEffect(() => {
    if (!canListProjects) {
      setProjectCatalogReady(true);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        await refreshProjects();
      } catch {
        /* listado opcional: la URL sigue siendo la fuente del proyecto activo */
      } finally {
        if (!cancelled) setProjectCatalogReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canListProjects, refreshProjects]);

  const projectSelectOptions = useMemo(() => {
    const byId = new Map();
    const list = Array.isArray(projects) ? projects : [];
    for (const p of list) {
      if (p?.id && p?.name) {
        byId.set(String(p.id).trim(), String(p.name).trim());
      }
    }
    if (isValidNexusUuid(urlProjectId)) {
      const fromState = project?.id === urlProjectId && project?.name ? String(project.name).trim() : "";
      const cached = getCachedProjectMeta(urlProjectId);
      const fromCache = cached?.name ? String(cached.name).trim() : "";
      const fallbackLabel = fromState || fromCache || "Proyecto actual";
      if (!byId.has(urlProjectId)) {
        byId.set(urlProjectId, fallbackLabel);
      }
    }
    return [...byId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [projects, project, urlProjectId]);

  function handleProjectScopeChange(nextProjectId) {
    if (!nextProjectId || nextProjectId === urlProjectId) return;
    navigate(`/projects/${nextProjectId}/features`, { replace: false });
  }

  function showSuccess(msg) {
    setErrorMessage("");
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(""), 6000);
  }

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await featuresService.listAllFeaturesForProject(urlProjectId);
      const items = data && Array.isArray(data.items) ? data.items : [];
      const normalized = items.map((row) => normalizeFeatureForPage(row, urlProjectId)).filter(Boolean);
      setFeatures(normalized);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const p = await getProjectById(urlProjectId);
        setProject({ id: p.id, name: p.name, status: p.status });
        setCachedProjectMeta(p.id, p.name);
      }
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      const pres = presentationForFeatureError(code);
      setErrorMessage(pres.userMessage || "Error cargando datos");
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[Features] fallback navegacion: projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadAll();
    return undefined;
  }, [navigate, urlProjectId, loadAll]);

  async function handleCreate({ title, description }) {
    setSaving(true);
    setErrorMessage("");
    try {
      await featuresService.createFeature({ projectId: urlProjectId, title, description });
      setCreateModalOpen(false);
      await loadAll();
      showSuccess("Feature creada.");
    } catch (error) {
      setErrorMessage(error && error.message ? error.message : "Error cargando datos");
    } finally {
      setSaving(false);
    }
  }

  const breadcrumbItems = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      {
        label: project ? project.name : "Project",
        path: project ? `/projects/${project.id}` : undefined,
      },
      { label: "Features" },
    ],
    [project]
  );

  return (
    <div className={pageStyles.root} data-testid="features-root">
      <div>
        <h1 className={pageStyles.pageTitle}>Features - Nexus DevSuite</h1>
        <div data-testid="breadcrumb-features">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {isValidNexusUuid(urlProjectId) && projectCatalogReady ? (
        <div className={pageStyles.projectScopeRow} data-testid="features-project-scope">
          <span className={pageStyles.projectScopeLabel} id="features-project-scope-label">
            Proyecto
          </span>
          <div className={pageStyles.projectScopeSelect}>
            <TableFilterSelect
              id="features-project-select"
              ariaLabel="Proyecto para listar features"
              value={urlProjectId}
              options={projectSelectOptions}
              disabled={!canListProjects || projectSelectOptions.length === 0}
              onChange={handleProjectScopeChange}
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <div data-testid="features-loading">
          <LoadingSpinner show />
        </div>
      ) : null}

      <ErrorBanner message={!loading ? errorMessage : ""} />

      {successMessage ? <p className={pageStyles.successBanner}>{successMessage}</p> : null}

      {canWriteFeature ? (
        <Modal
          isOpen={createModalOpen}
          onClose={() => {
            if (!saving) setCreateModalOpen(false);
          }}
          title="Nueva feature"
          dialogClassName={pageStyles.createFeatureDialog}
          allowBackdropClose={!saving}
          allowEscapeClose={!saving}
        >
          <div data-testid="feature-create-modal">
            <FormCreateFeature
              embedded
              busy={saving}
              onSubmit={handleCreate}
              onCancel={saving ? undefined : () => setCreateModalOpen(false)}
            />
          </div>
        </Modal>
      ) : null}

      {!loading && project ? (
        <TableFeatures
          features={features}
          projectId={urlProjectId}
          projectLabel={project.name}
          onOpen={(fid) => navigate(`/projects/${project.id}/features/${fid}`)}
          onOpenEdit={(fid) => navigate(`/projects/${project.id}/features/${fid}?tab=edicion`)}
          canCreate={canWriteFeature}
          onCreateClick={canWriteFeature ? () => setCreateModalOpen(true) : undefined}
          onActionError={(msg) => setErrorMessage(msg === "" ? "" : msg || "Error cargando datos")}
          onSuccessMessage={showSuccess}
          onRefresh={loadAll}
          isMaster={isMaster}
        />
      ) : null}
    </div>
  );
}
