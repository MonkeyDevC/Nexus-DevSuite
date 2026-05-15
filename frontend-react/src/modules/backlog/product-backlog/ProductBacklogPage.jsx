import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/context/AuthContext.jsx";
import { hasPermission, hasRole, ROLE_MASTER } from "../../../auth/authorization.js";
import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import Breadcrumb from "../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { getCachedProjectMeta, isValidNexusUuid, setCachedProjectMeta } from "../../../shared/cache/domainWorkCache.js";
import {
  buildStoryDetailHref,
  STORY_DETAIL_FROM_QUERY,
  STORY_DETAIL_FROM_BACKLOG,
} from "../../../shared/routing/storyDetailRouteContext.js";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";
import pageStyles from "../../features/styles/featureDetailPage.module.css";
import { getProjectById, useProjectContext } from "../../projects/index.js";
import * as storiesService from "../../stories/storiesService.js";
import { listUsersNormalized } from "../../admin/adminService.js";
import { DetailWorkspaceShell } from "../../projects/components/workspace/DetailWorkspaceShell.jsx";
import { HierarchyOverlayStack, HierarchyOverlayStackLayer } from "../../projects/components/workspace/HierarchyOverlayStack.jsx";
import StoryDetailCard from "../../projects/components/workspace/StoryDetailCard.jsx";
import WorkspaceHeader from "../../projects/components/workspace/WorkspaceHeader.jsx";
import { PROJECT_DETAIL_TAB_VISTA } from "../../projects/components/workspace/projectDetailConstants.js";
import ProductBacklogEmptyState from "./components/ProductBacklogEmptyState.jsx";
import ProductBacklogSkeleton from "./components/ProductBacklogSkeleton.jsx";
import ProductBacklogTable from "./components/ProductBacklogTable.jsx";
import ProductBacklogToolbar from "./components/ProductBacklogToolbar.jsx";
import {
  ITEM_TYPE_COLUMN_LABELS,
  PRIORITY_COLUMN_LABELS,
  REFINEMENT_COLUMN_LABELS,
} from "./constants/columnFilterLabels.js";
import { useProductBacklog } from "./hooks/useProductBacklog.js";
import styles from "./ProductBacklogPage.module.css";

export default function ProductBacklogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { projects, refreshProjects } = useProjectContext();
  const isMaster = hasRole(user, ROLE_MASTER);
  const canListProjects = hasPermission(user, "project:read");
  const canCreateStory = hasPermission(user, "story:write");

  const {
    projectId,
    normalizedData,
    searchQuery,
    setSearchQuery,
    refinementFilter,
    setRefinementFilter,
    priorityFilter,
    setPriorityFilter,
    featureIdFilter,
    setFeatureIdFilter,
    assigneeFilter,
    setAssigneeFilter,
    qualitySeverityFilter,
    setQualitySeverityFilter,
    itemTypeFilter,
    setItemTypeFilter,
    readyOnlyFilter,
    setReadyOnlyFilter,
    sortMode,
    setSortMode,
    groupByFeature,
    setGroupByFeature,
    expandedFeatureIds,
    loading,
    error,
    groupedSections,
    refinementFilterOptions,
    priorityFilterOptions,
    featureFilterSelectOptions,
    assigneeFilterOptions,
    qualitySeverityFilterOptions,
    unassignedFilterValue,
    itemTypeFilterOptions,
    setProjectFilter,
    toggleFeatureExpanded,
    refetch,
  } = useProductBacklog();

  const storyParam = searchParams.get("story") || "";
  const validOverlayStoryId = isValidNexusUuid(storyParam) ? storyParam : "";

  const [overlayStoryDetail, setOverlayStoryDetail] = useState(null);
  const [overlayStoryLoading, setOverlayStoryLoading] = useState(false);
  const [overlayStoryError, setOverlayStoryError] = useState("");
  const [overlayProjectData, setOverlayProjectData] = useState(null);
  const [assignmentUsers, setAssignmentUsers] = useState([]);
  const [pendingStoryOverlayTab, setPendingStoryOverlayTab] = useState(PROJECT_DETAIL_TAB_VISTA);
  const previousProjectIdRef = useRef(undefined);

  const clearStoryOverlay = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("story");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openStoryInBacklogUrl = useCallback(
    (sid) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("story", String(sid));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    listUsersNormalized({ page: 1, limit: 200 })
      .then((r) => {
        if (!cancelled) setAssignmentUsers(Array.isArray(r.items) ? r.items : []);
      })
      .catch(() => {
        if (!cancelled) setAssignmentUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!validOverlayStoryId || !projectId || !isValidNexusUuid(projectId)) {
      setOverlayStoryDetail(null);
      setOverlayStoryError("");
      setOverlayStoryLoading(false);
      setOverlayProjectData(null);
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setOverlayStoryLoading(true);
      setOverlayStoryError("");
      setOverlayStoryDetail(null);
      try {
        const [s, proj] = await Promise.all([storiesService.getStory(validOverlayStoryId), getProjectById(projectId)]);
        if (cancelled) return;
        if (!proj || String(proj.id) !== String(projectId)) {
          setOverlayStoryError("Proyecto no disponible.");
          return;
        }
        const fid = s.feature_id != null ? String(s.feature_id).trim() : "";
        const featureRow = fid && normalizedData?.featuresById ? normalizedData.featuresById[fid] : null;
        const storyProjectId =
          (s.project_id != null && String(s.project_id).trim() !== "" && String(s.project_id).trim()) ||
          (featureRow?.project_id != null ? String(featureRow.project_id).trim() : "");
        if (!storyProjectId) {
          setOverlayStoryError("No se pudo validar el proyecto de la historia.");
          return;
        }
        if (String(storyProjectId) !== String(projectId)) {
          setOverlayStoryError("La historia no pertenece al proyecto del backlog.");
          return;
        }
        setOverlayProjectData(proj);
        setOverlayStoryDetail(s);
      } catch {
        if (!cancelled) setOverlayStoryError("Historia no encontrada");
      } finally {
        if (!cancelled) setOverlayStoryLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [validOverlayStoryId, projectId, normalizedData]);

  useEffect(() => {
    const prev = previousProjectIdRef.current;
    previousProjectIdRef.current = projectId;
    if (prev !== undefined && prev !== projectId && validOverlayStoryId) {
      clearStoryOverlay();
    }
  }, [projectId, validOverlayStoryId, clearStoryOverlay]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (validOverlayStoryId) clearStoryOverlay();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [validOverlayStoryId, clearStoryOverlay]);

  const handleProjectFilterChange = useCallback(
    (nextProjectId) => {
      setProjectFilter(nextProjectId);
    },
    [setProjectFilter]
  );

  useEffect(() => {
    if (!canListProjects) return undefined;
    (async () => {
      try {
        await refreshProjects();
      } catch {
        /* catálogo opcional */
      }
    })();
    return undefined;
  }, [canListProjects, refreshProjects]);

  useEffect(() => {
    if (!projectId || !normalizedData?.featuresOrdered) return;
    const nameFromContext = projects.find((p) => p?.id === projectId)?.name;
    if (typeof nameFromContext === "string" && nameFromContext.trim()) {
      setCachedProjectMeta(projectId, nameFromContext.trim());
    }
  }, [projectId, normalizedData, projects]);

  const projectOptions = useMemo(() => {
    const byId = new Map();
    const list = Array.isArray(projects) ? projects : [];
    for (const p of list) {
      if (p?.id && p?.name) {
        byId.set(String(p.id).trim(), String(p.name).trim());
      }
    }
    if (projectId && isValidNexusUuid(projectId) && !byId.has(projectId)) {
      const cached = getCachedProjectMeta(projectId);
      const label = cached?.name ? String(cached.name).trim() : "Proyecto actual";
      byId.set(projectId, label);
    }
    return Array.from(byId.entries()).map(([id, name]) => ({ id, name }));
  }, [projects, projectId]);

  const projectLabel = useMemo(() => {
    if (!projectId) return "";
    const hit = projectOptions.find((p) => p.id === projectId);
    return hit?.name || "";
  }, [projectId, projectOptions]);

  const storyCount = normalizedData?.stories?.length ?? 0;
  const title =
    projectId != null && projectId !== ""
      ? `Backlog de Producto (${storyCount} ${storyCount === 1 ? "historia" : "historias"})`
      : "Backlog de Producto";

  /** Misma envoltura de página/tarjeta que el detalle de feature (workspace con header). */
  const useProjectWorkspaceChrome = Boolean(projectId && isValidNexusUuid(projectId));

  const breadcrumbItems = useMemo(() => {
    if (!projectId) {
      return [{ label: "Product Backlog" }];
    }
    return [
      { label: projectLabel || "Proyecto", path: `/projects/${projectId}` },
      { label: "Product Backlog" },
    ];
  }, [projectId, projectLabel]);

  const workspaceBreadcrumbItems = useMemo(() => {
    if (!projectId || !isValidNexusUuid(projectId)) return [];
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectLabel || "Proyecto", path: `/projects/${projectId}` },
      { label: "Backlog de producto" },
    ];
  }, [projectId, projectLabel]);

  const parentFeatureForOverlay = useMemo(() => {
    if (!overlayStoryDetail?.feature_id || !normalizedData?.featuresById) return null;
    const fid = String(overlayStoryDetail.feature_id).trim();
    return normalizedData.featuresById[fid] || null;
  }, [overlayStoryDetail, normalizedData]);

  const storyOverlayBreadcrumbs = useMemo(() => {
    if (!projectId || !isValidNexusUuid(projectId)) return [];
    const backlogPath = `/backlog?project=${encodeURIComponent(projectId)}`;
    const storyTitle = overlayStoryDetail?.title?.trim() ? overlayStoryDetail.title.trim() : "Historia";
    return [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Projects", path: "/projects" },
      { label: projectLabel || "Proyecto", path: `/projects/${projectId}` },
      { label: "Backlog de producto", path: backlogPath },
      { label: storyTitle },
    ];
  }, [projectId, projectLabel, overlayStoryDetail]);

  const storyEvidenceHistoryKey = useMemo(
    () => [projectId || "", validOverlayStoryId].filter(Boolean).join("|"),
    [projectId, validOverlayStoryId],
  );

  const handleOpenStoryFromBacklog = useCallback(
    (storyId) => {
      const sid = storyId != null ? String(storyId).trim() : "";
      if (!sid || !normalizedData?.storiesById) return;
      const story = normalizedData.storiesById[sid];
      if (!story) return;
      const pid = story.project_id || projectId;
      if (!pid || !isValidNexusUuid(pid)) return;
      if (!projectId || String(pid) !== String(projectId)) {
        navigate(
          buildStoryDetailHref(pid, story.id, { [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_BACKLOG }),
        );
        return;
      }
      setPendingStoryOverlayTab(PROJECT_DETAIL_TAB_VISTA);
      openStoryInBacklogUrl(sid);
    },
    [navigate, projectId, normalizedData, openStoryInBacklogUrl],
  );

  const handleCreateStory = useCallback(
    (featureId) => {
      if (!projectId || !featureId) return;
      navigate(`/projects/${encodeURIComponent(projectId)}?feature=${encodeURIComponent(featureId)}&createStory=1`);
    },
    [navigate, projectId]
  );

  const clearColumnFiltersOnly = useCallback(() => {
    setRefinementFilter("");
    setPriorityFilter("");
    setFeatureIdFilter("");
    setAssigneeFilter("");
    setQualitySeverityFilter("");
    setItemTypeFilter("");
    setReadyOnlyFilter(false);
  }, [
    setRefinementFilter,
    setPriorityFilter,
    setFeatureIdFilter,
    setAssigneeFilter,
    setQualitySeverityFilter,
    setItemTypeFilter,
    setReadyOnlyFilter,
  ]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    clearColumnFiltersOnly();
  }, [setSearchQuery, clearColumnFiltersOnly]);

  const hasActiveColumnFilters = useMemo(
    () =>
      Boolean(
        refinementFilter ||
          priorityFilter ||
          featureIdFilter ||
          assigneeFilter ||
          qualitySeverityFilter ||
          itemTypeFilter ||
          readyOnlyFilter
      ),
    [
      refinementFilter,
      priorityFilter,
      featureIdFilter,
      assigneeFilter,
      qualitySeverityFilter,
      itemTypeFilter,
      readyOnlyFilter,
    ]
  );

  const assigneeColumnFilterOptions = useMemo(() => {
    return [
      { value: unassignedFilterValue, label: "Sin asignar" },
      ...assigneeFilterOptions,
    ];
  }, [assigneeFilterOptions, unassignedFilterValue]);

  const featureFilterToolbarOptions = useMemo(
    () => [{ value: "", label: "Todas" }, ...featureFilterSelectOptions],
    [featureFilterSelectOptions]
  );

  const qualityColumnFilterOptions = useMemo(
    () => qualitySeverityFilterOptions.filter((o) => String(o.value) !== ""),
    [qualitySeverityFilterOptions]
  );

  const backlogColumnFilters = useMemo(
    () => ({
      refinement: {
        value: refinementFilter,
        options: refinementFilterOptions.map((s) => ({
          value: s,
          label: REFINEMENT_COLUMN_LABELS[s] || s,
        })),
        onChange: setRefinementFilter,
      },
      priority: {
        value: priorityFilter,
        options: priorityFilterOptions.map((p) => ({
          value: p,
          label: PRIORITY_COLUMN_LABELS[p] || p,
        })),
        onChange: setPriorityFilter,
      },
      assignee: {
        value: assigneeFilter,
        options: assigneeColumnFilterOptions,
        onChange: setAssigneeFilter,
      },
      quality: {
        value: qualitySeverityFilter,
        options: qualityColumnFilterOptions,
        onChange: setQualitySeverityFilter,
      },
      itemType: {
        value: itemTypeFilter,
        options: itemTypeFilterOptions.map((t) => ({
          value: t,
          label: ITEM_TYPE_COLUMN_LABELS[t] || t,
        })),
        onChange: setItemTypeFilter,
      },
      readySprint: {
        value: readyOnlyFilter ? "ready_only" : "",
        options: [{ value: "ready_only", label: "Solo listas (READY)" }],
        onChange: (v) => setReadyOnlyFilter(v === "ready_only"),
      },
    }),
    [
      refinementFilter,
      refinementFilterOptions,
      setRefinementFilter,
      priorityFilter,
      priorityFilterOptions,
      setPriorityFilter,
      assigneeFilter,
      assigneeColumnFilterOptions,
      setAssigneeFilter,
      qualitySeverityFilter,
      qualityColumnFilterOptions,
      setQualitySeverityFilter,
      itemTypeFilter,
      itemTypeFilterOptions,
      setItemTypeFilter,
      readyOnlyFilter,
      setReadyOnlyFilter,
    ]
  );

  const hasStoriesInDataset = (normalizedData?.stories?.length ?? 0) > 0;
  const tableHasRows = groupedSections.some((s) => s.stories.length > 0);

  let emptyVariant = null;
  if (!projectId) {
    emptyVariant = "no_project";
  } else if (!loading && !error && hasStoriesInDataset && !tableHasRows) {
    emptyVariant = "filtered_empty";
  } else if (!loading && !error && !hasStoriesInDataset) {
    emptyVariant = "no_stories";
  }

  const backlogToolbarAndTable = (
    <>
      <ProductBacklogToolbar
        projectScoped={false}
        projectId={projectId}
        projectOptions={projectOptions}
        onProjectChange={handleProjectFilterChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        featureFilterValue={featureIdFilter}
        featureFilterOptions={featureFilterToolbarOptions}
        onFeatureFilterChange={setFeatureIdFilter}
        sortMode={sortMode}
        onSortChange={setSortMode}
        groupByFeature={groupByFeature}
        onGroupChange={setGroupByFeature}
        featuresForCreate={normalizedData?.featuresOrdered ?? []}
        canCreateStory={canCreateStory}
        onCreateStoryRequest={handleCreateStory}
        hasActiveColumnFilters={hasActiveColumnFilters}
        onClearColumnFilters={clearColumnFiltersOnly}
      />

      {projectId && loading ? <ProductBacklogSkeleton /> : null}

      {!loading ? <span data-testid="backlog-loaded-marker" hidden /> : null}

      {error ? (
        <div className={`${wave1.banner} ${wave1.bannerWarning}`} role="alert" data-testid="backlog-error-banner">
          Error cargando datos
        </div>
      ) : null}

      {!projectId && !loading ? <ProductBacklogEmptyState variant="no_project" /> : null}

      {projectId && !loading && !error && emptyVariant === "no_stories" ? (
        <div data-testid="backlog-table">
          <ProductBacklogEmptyState variant="no_stories" />
        </div>
      ) : null}

      {projectId && !loading && !error && emptyVariant === "filtered_empty" ? (
        <div data-testid="backlog-table">
          <ProductBacklogEmptyState variant="filtered_empty" onClearFilters={clearFilters} />
        </div>
      ) : null}

      {projectId && !loading && !error && tableHasRows ? (
        <ProductBacklogTable
          sections={groupedSections}
          expandedFeatureIds={expandedFeatureIds}
          onToggleFeatureExpanded={toggleFeatureExpanded}
          onSelectStory={handleOpenStoryFromBacklog}
          groupByFeature={groupByFeature}
          filtersDisabled={false}
          columnFilters={backlogColumnFilters}
        />
      ) : null}
    </>
  );

  const quickNav = projectId ? (
    <nav className={styles.headerNavLinks} aria-label="Accesos del backlog">
      <button type="button" className={styles.headerNavLink} onClick={() => navigate(`/projects/${projectId}`)}>
        Ir al proyecto
      </button>
      <button type="button" className={styles.headerNavLink} onClick={() => navigate(`/projects/${projectId}/features`)}>
        Features
      </button>
      {isMaster ? (
        <button type="button" className={styles.headerNavLink} onClick={() => navigate("/projects")}>
          Lista proyectos
        </button>
      ) : null}
    </nav>
  ) : null;

  const workspaceHeaderMeta =
    projectId && isValidNexusUuid(projectId) ? (
      <>
        <Badge variant="secondary">
          {storyCount} {storyCount === 1 ? "historia" : "historias"}
        </Badge>
      </>
    ) : null;

  if (useProjectWorkspaceChrome) {
    return (
      <div className={pageStyles.page} data-testid="backlog-root">
        {loading ? (
          <div className={pageStyles.loading} data-testid="backlog-workspace-loading">
            Cargando backlog…
          </div>
        ) : null}

        {!loading && error ? (
          <div className={`${pageStyles.message} ${pageStyles.messageDanger}`} role="alert" data-testid="backlog-error-banner">
            Error cargando datos
          </div>
        ) : null}

        {!loading && !error ? (
          <div className={pageStyles.cardWrap} data-testid="product-backlog-workspace-card">
            <HierarchyOverlayStack>
              <HierarchyOverlayStackLayer depth={0} isTop={!validOverlayStoryId}>
                <DetailWorkspaceShell
                  depth={0}
                  rootDataTestId="product-backlog-workspace-shell"
                  header={
                    <WorkspaceHeader
                      kicker="Planificación"
                      breadcrumbItems={workspaceBreadcrumbItems}
                      breadcrumbDataTestId="breadcrumb-product-backlog"
                      title="Backlog de producto"
                      meta={workspaceHeaderMeta}
                      onRequestClose={() => navigate(`/projects/${projectId}`)}
                      closeAriaLabel="Volver al proyecto"
                    />
                  }
                >
                  <div className={styles.workspaceShellBody}>
                    {quickNav}
                    {backlogToolbarAndTable}
                  </div>
                </DetailWorkspaceShell>
              </HierarchyOverlayStackLayer>

              {validOverlayStoryId && projectId && isValidNexusUuid(projectId) ? (
                <HierarchyOverlayStackLayer depth={1} isTop>
                  <StoryDetailCard
                    rootDataTestId="story-detail-card"
                    story={overlayStoryDetail}
                    parentFeature={parentFeatureForOverlay}
                    initialActiveTab={canCreateStory ? pendingStoryOverlayTab : PROJECT_DETAIL_TAB_VISTA}
                    loading={overlayStoryLoading}
                    error={overlayStoryError}
                    breadcrumbItems={storyOverlayBreadcrumbs}
                    projectData={
                      overlayProjectData || {
                        id: projectId,
                        name: projectLabel || "Proyecto",
                        status: "ACTIVE",
                      }
                    }
                    draftData={null}
                    onDraftPatch={() => {}}
                    onProjectSave={async () => {}}
                    projectIsDirty={false}
                    projectIsSaving={false}
                    canEditProject={false}
                    editBlocked
                    evidenceHistoryResetKey={storyEvidenceHistoryKey}
                    canWriteStory={hasPermission(user, "story:write")}
                    versionConflict={false}
                    onReloadAfterConflict={null}
                    projectSaveErrorMessage=""
                    onStoryUpdated={(updated) => {
                      setOverlayStoryDetail(updated);
                      refetch();
                    }}
                    onClose={clearStoryOverlay}
                    onOpenFullPage={() =>
                      navigate(
                        buildStoryDetailHref(projectId, validOverlayStoryId, {
                          [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_BACKLOG,
                        }),
                      )
                    }
                    assignmentUsers={assignmentUsers}
                    workOrdersRefreshNonce={0}
                    createWorkOrderPanelOpen={false}
                    onOpenCreateWorkOrderPanel={() =>
                      navigate(
                        buildStoryDetailHref(projectId, validOverlayStoryId, {
                          [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_BACKLOG,
                          createWorkOrder: "1",
                        }),
                      )
                    }
                    onCloseCreateWorkOrderPanel={() => {}}
                    onOpenWorkOrder={(woId) =>
                      navigate(
                        buildStoryDetailHref(projectId, validOverlayStoryId, {
                          [STORY_DETAIL_FROM_QUERY]: STORY_DETAIL_FROM_BACKLOG,
                          workOrder: String(woId),
                        }),
                      )
                    }
                  />
                </HierarchyOverlayStackLayer>
              ) : null}
            </HierarchyOverlayStack>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={wave1.stack} data-testid="backlog-root">
      <header className={styles.wireframePageHeader}>
        <div data-testid="breadcrumb-product-backlog">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <h1 className={styles.wireframeTitle}>{title}</h1>
        {projectId ? (
          quickNav
        ) : (
          <p className={styles.backlogMutedHint} style={{ marginTop: "var(--ds-space-2)" }}>
            Elige un proyecto para cargar el backlog.
          </p>
        )}
      </header>

      <div className={styles.backlogWorkspace}>
        <div className={styles.mainColumn}>{backlogToolbarAndTable}</div>
      </div>
    </div>
  );
}
