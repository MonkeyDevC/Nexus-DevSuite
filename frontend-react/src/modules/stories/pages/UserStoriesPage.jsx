/**
 * Listado de user stories por proyecto + feature — misma envoltura que FeaturesPage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import {
  getCachedProjectMeta,
  isValidNexusUuid,
  logDev,
  setCachedProjectMeta,
} from "../../../shared/cache/domainWorkCache.js";
import { getProjectById, useProjectContext } from "../../projects/index.js";
import * as featuresService from "../../features/featuresService.js";
import { mapFeatureDto } from "../../features/featureDto.js";
import * as storiesService from "../storiesService.js";
import { mapStoryDto } from "../storyDto.js";
import { presentationForStoryError } from "../errorPresentation.js";
import TableUserStories from "../components/tables/TableUserStories.jsx";
import LoadingSpinner from "../../projects/components/tables/LoadingSpinner.jsx";
import ErrorBanner from "../../projects/components/workspace/ErrorBanner.jsx";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../auth/authorization.js";
import TableFilterSelect from "../../projects/components/tables/TableFilterSelect.jsx";
import pageStyles from "../../features/styles/featuresPage.module.css";
import {
  buildStoryDetailHref,
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_USER_STORIES,
  STORY_DETAIL_FEATURE_FILTER_QUERY,
} from "../../../shared/routing/storyDetailRouteContext.js";
import {
  formatFeatureListLabel,
  formatProjectHumanId,
  stripEmbeddedProjectCodeFromName,
} from "../../../shared/workspace/workItemHumanIds.js";

const FEATURE_QUERY_KEY = "feature";

function normalizeFeatureOption(raw, urlProjectId) {
  const mapped = mapFeatureDto(raw);
  if (!mapped) return null;
  if (mapped.project_id != null) {
    const pid = String(mapped.project_id).trim();
    if (!isValidNexusUuid(pid) || pid !== String(urlProjectId)) return null;
  }
  const t = mapped.title != null ? String(mapped.title).trim() : "";
  if (!t) return null;
  return mapped;
}

function normalizeStoryRow(raw, urlProjectId, featureId) {
  const mapped = mapStoryDto(raw);
  if (!mapped) return null;
  if (String(mapped.feature_id) !== String(featureId)) return null;
  if (mapped.project_id && String(mapped.project_id) !== String(urlProjectId)) return null;
  return mapped;
}

export default function UserStoriesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { projects, refreshProjects } = useProjectContext();
  const isMaster = hasRole(user, ROLE_MASTER);
  const canWriteStory = hasPermission(user, "story:write");
  const canListProjects = hasPermission(user, "project:read");

  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [stories, setStories] = useState([]);
  const [loadingProjectFeatures, setLoadingProjectFeatures] = useState(true);
  const [loadingStories, setLoadingStories] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [projectCatalogReady, setProjectCatalogReady] = useState(false);
  const successTimerRef = useRef(null);

  const urlProjectId = projectId != null ? String(projectId).trim() : "";
  const featureIdFromUrl = useMemo(() => {
    const raw = searchParams.get(FEATURE_QUERY_KEY);
    const t = raw != null ? String(raw).trim() : "";
    return isValidNexusUuid(t) ? t : "";
  }, [searchParams]);

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
        /* noop */
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
    navigate(`/projects/${nextProjectId}/user-stories`, { replace: false });
  }

  function handleFeatureScopeChange(nextFeatureId) {
    const next = new URLSearchParams(searchParams);
    const fid = nextFeatureId != null ? String(nextFeatureId).trim() : "";
    if (!fid || !isValidNexusUuid(fid)) {
      next.delete(FEATURE_QUERY_KEY);
    } else {
      next.set(FEATURE_QUERY_KEY, fid);
    }
    setSearchParams(next, { replace: false });
  }

  function showSuccess(msg) {
    setErrorMessage("");
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(""), 6000);
  }

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  const loadProjectAndFeatures = useCallback(async () => {
    setLoadingProjectFeatures(true);
    setErrorMessage("");
    try {
      const data = await featuresService.listAllFeaturesForProject(urlProjectId);
      const items = data && Array.isArray(data.items) ? data.items : [];
      const normalized = items.map((row) => normalizeFeatureOption(row, urlProjectId)).filter(Boolean);
      setFeatures(normalized);

      const cached = getCachedProjectMeta(urlProjectId);
      if (cached) {
        setProject({ id: urlProjectId, name: cached.name, status: "UNKNOWN" });
      } else {
        const p = await getProjectById(urlProjectId);
        setProject({ id: p.id, name: p.name, status: p.status });
        setCachedProjectMeta(p.id, p.name);
      }
    } catch {
      setErrorMessage("Error cargando proyecto o features.");
      setFeatures([]);
    } finally {
      setLoadingProjectFeatures(false);
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId)) {
      logDev("[UserStories] projectId invalido", urlProjectId);
      navigate("/projects", { replace: true });
      return undefined;
    }
    loadProjectAndFeatures();
    return undefined;
  }, [navigate, urlProjectId, loadProjectAndFeatures]);

  useEffect(() => {
    if (!isValidNexusUuid(urlProjectId) || loadingProjectFeatures) return undefined;
    if (!isValidNexusUuid(featureIdFromUrl)) {
      setStories([]);
      setLoadingStories(false);
      return undefined;
    }
    let cancelled = false;
    setLoadingStories(true);
    setErrorMessage("");
    (async () => {
      try {
        const all = await storiesService.listAllStoriesByFeature(featureIdFromUrl);
        if (cancelled) return;
        const normalized = all.map((row) => normalizeStoryRow(row, urlProjectId, featureIdFromUrl)).filter(Boolean);
        setStories(normalized);
      } catch (err) {
        if (cancelled) return;
        const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
        setErrorMessage(presentationForStoryError(code).userMessage);
        setStories([]);
      } finally {
        if (!cancelled) setLoadingStories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlProjectId, featureIdFromUrl, loadingProjectFeatures]);

  const featureSelectOptions = useMemo(() => {
    const opts = [{ value: "", label: "Seleccione una feature…" }];
    for (const f of features) {
      opts.push({ value: f.id, label: formatFeatureListLabel(f.number, f.title) });
    }
    return opts;
  }, [features]);

  const selectedFeatureMeta = useMemo(
    () => features.find((f) => String(f.id) === String(featureIdFromUrl)) || null,
    [features, featureIdFromUrl],
  );

  const featureLabelForTable = useMemo(() => {
    if (!selectedFeatureMeta) return "";
    return formatFeatureListLabel(selectedFeatureMeta.number, selectedFeatureMeta.title);
  }, [selectedFeatureMeta]);

  /** Si la URL tiene feature que ya no existe en el proyecto cargado, limpiar query. */
  useEffect(() => {
    if (loadingProjectFeatures || !isValidNexusUuid(urlProjectId)) return;
    if (!featureIdFromUrl) return;
    if (features.length === 0) return;
    const exists = features.some((f) => String(f.id) === String(featureIdFromUrl));
    if (!exists) {
      const next = new URLSearchParams(searchParams);
      next.delete(FEATURE_QUERY_KEY);
      setSearchParams(next, { replace: true });
    }
  }, [loadingProjectFeatures, urlProjectId, featureIdFromUrl, features, searchParams, setSearchParams]);

  const breadcrumbItems = useMemo(() => {
    let projectCrumb = "Project";
    if (project) {
      const num =
        project.number != null && Number.isFinite(Number(project.number)) ? Number(project.number) : null;
      const pr = formatProjectHumanId(num);
      const clean = stripEmbeddedProjectCodeFromName(project.name, num) || project.name;
      projectCrumb = pr ? `${pr} — ${clean}` : clean;
    }
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      {
        label: projectCrumb,
        path: project ? `/projects/${project.id}` : undefined,
      },
      { label: "User Stories" },
    ];
  }, [project]);

  const refreshAll = useCallback(async () => {
    await loadProjectAndFeatures();
    if (!isValidNexusUuid(featureIdFromUrl)) return;
    setLoadingStories(true);
    setErrorMessage("");
    try {
      const all = await storiesService.listAllStoriesByFeature(featureIdFromUrl);
      const normalized = all.map((row) => normalizeStoryRow(row, urlProjectId, featureIdFromUrl)).filter(Boolean);
      setStories(normalized);
    } catch (err) {
      const code = err && err.code ? String(err.code) : "UNKNOWN_ERROR";
      setErrorMessage(presentationForStoryError(code).userMessage);
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, [loadProjectAndFeatures, featureIdFromUrl, urlProjectId]);

  const loading = loadingProjectFeatures || (Boolean(featureIdFromUrl) && loadingStories);

  return (
    <div className={pageStyles.root} data-testid="user-stories-root">
      <div>
        <h1 className={pageStyles.pageTitle}>User Stories - Nexus DevSuite</h1>
        <div data-testid="breadcrumb-user-stories">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {isValidNexusUuid(urlProjectId) && projectCatalogReady ? (
        <div className={pageStyles.projectScopeStack} data-testid="user-stories-scope-filters">
          <div className={pageStyles.projectScopeRow}>
            <span className={pageStyles.projectScopeLabel} id="user-stories-project-scope-label">
              Proyecto
            </span>
            <div className={pageStyles.projectScopeSelect}>
              <TableFilterSelect
                id="user-stories-project-select"
                ariaLabel="Proyecto para listar historias"
                value={urlProjectId}
                options={projectSelectOptions}
                disabled={!canListProjects || projectSelectOptions.length === 0}
                onChange={handleProjectScopeChange}
              />
            </div>
          </div>
          <div className={pageStyles.projectScopeRow}>
            <span className={pageStyles.projectScopeLabel} id="user-stories-feature-scope-label">
              Feature
            </span>
            <div className={pageStyles.projectScopeSelect}>
              <TableFilterSelect
                id="user-stories-feature-select"
                ariaLabel="Feature para listar historias"
                value={featureIdFromUrl}
                options={featureSelectOptions}
                disabled={!project || features.length === 0}
                onChange={handleFeatureScopeChange}
              />
            </div>
          </div>
        </div>
      ) : null}

      {loading && !project ? (
        <div data-testid="user-stories-loading">
          <LoadingSpinner show />
        </div>
      ) : null}

      <ErrorBanner message={!loadingProjectFeatures ? errorMessage : ""} />

      {successMessage ? <p className={pageStyles.successBanner}>{successMessage}</p> : null}

      {!loadingProjectFeatures && project && !featureIdFromUrl ? (
        <p className={pageStyles.successBanner} style={{ background: "var(--ds-color-surface-raised)", borderStyle: "dashed" }}>
          Selecciona una feature para cargar sus historias de usuario.
        </p>
      ) : null}

      {!loadingProjectFeatures && project && featureIdFromUrl && !loadingStories ? (
        <TableUserStories
          stories={stories}
          projectId={urlProjectId}
          projectLabel={project.name}
          featureId={featureIdFromUrl}
          featureLabel={featureLabelForTable}
          onOpen={(sid) =>
            navigate(
              buildStoryDetailHref(urlProjectId, sid, {
                [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_USER_STORIES,
                [STORY_DETAIL_FEATURE_FILTER_QUERY]: featureIdFromUrl,
              }),
            )}
          onOpenEdit={(sid) =>
            navigate(
              buildStoryDetailHref(urlProjectId, sid, {
                [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_USER_STORIES,
                [STORY_DETAIL_FEATURE_FILTER_QUERY]: featureIdFromUrl,
              }),
            )}
          canCreate={canWriteStory}
          onCreateClick={
            canWriteStory
              ? () =>
                  navigate(
                    `/projects/${encodeURIComponent(urlProjectId)}?feature=${encodeURIComponent(featureIdFromUrl)}&createStory=1`
                  )
              : undefined
          }
          onActionError={(msg) => setErrorMessage(msg === "" ? "" : msg || "Error")}
          onSuccessMessage={showSuccess}
          onRefresh={refreshAll}
          isMaster={isMaster}
        />
      ) : null}

      {loading && project && featureIdFromUrl ? (
        <div data-testid="user-stories-loading-stories">
          <LoadingSpinner show />
        </div>
      ) : null}
    </div>
  );
}
