import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isValidNexusUuid } from "../../../../shared/cache/domainWorkCache.js";
import { fetchNormalizedProductBacklog } from "../services/productBacklog.service.js";
import {
  applyProductBacklogFilters,
  filterStoriesBySearchQuery,
  NO_FEATURE_FILTER_VALUE,
  UNASSIGNED_FILTER_VALUE,
} from "../utils/backlogFilters.js";
import { BACKLOG_NO_FEATURE_SECTION_ID, groupStoriesForProductBacklog } from "../utils/backlogGrouping.js";
import { sortProductBacklogStories } from "../utils/backlogSorting.js";

/**
 * Convención expand/collapse: en la primera carga con datos, todas las features inician expandidas (`true`).
 * `expandedFeatureIds` es únicamente `Record<string, boolean>` (sin Set).
 *
 * Fuente de verdad del proyecto: query `?project=<uuid>`. El fetch solo depende de eso.
 */
export function useProductBacklog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const projectIdFromUrl = useMemo(() => {
    const raw = searchParams.get("project");
    const trimmed = raw != null ? String(raw).trim() : "";
    return isValidNexusUuid(trimmed) ? trimmed : "";
  }, [searchParams]);

  const [rawData, setRawData] = useState(null);
  const [normalizedData, setNormalizedData] = useState(null);
  const [fetchStrategy, setFetchStrategy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refinementFilter, setRefinementFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [featureIdFilter, setFeatureIdFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [qualitySeverityFilter, setQualitySeverityFilter] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState("");
  const [readyOnlyFilter, setReadyOnlyFilter] = useState(false);
  const [sortMode, setSortMode] = useState(/** @type {"manual"|"priority"|"created_at"} */ ("manual"));
  const [groupByFeature, setGroupByFeature] = useState(true);
  const [expandedFeatureIds, setExpandedFeatureIds] = useState(() => ({}));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runFetch = useCallback(async (pid) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNormalizedProductBacklog(pid);
      setRawData(result.rawPayload);
      setNormalizedData(result.normalizedData);
      setFetchStrategy(result.fetchStrategy);
      const nextExpanded = Object.create(null);
      for (const f of result.normalizedData?.featuresOrdered ?? []) {
        nextExpanded[f.id] = true;
      }
      nextExpanded[BACKLOG_NO_FEATURE_SECTION_ID] = true;
      setExpandedFeatureIds(nextExpanded);
    } catch (e) {
      setError(e);
      setRawData(null);
      setNormalizedData(null);
      setFetchStrategy(null);
      setExpandedFeatureIds({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!projectIdFromUrl) {
      setRawData(null);
      setNormalizedData(null);
      setFetchStrategy(null);
      setLoading(false);
      setError(null);
      setExpandedFeatureIds({});
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchNormalizedProductBacklog(projectIdFromUrl);
        if (cancelled) return;
        setRawData(result.rawPayload);
        setNormalizedData(result.normalizedData);
        setFetchStrategy(result.fetchStrategy);
        const nextExpanded = Object.create(null);
        for (const f of result.normalizedData?.featuresOrdered ?? []) {
          nextExpanded[f.id] = true;
        }
        nextExpanded[BACKLOG_NO_FEATURE_SECTION_ID] = true;
        setExpandedFeatureIds(nextExpanded);
      } catch (e) {
        if (cancelled) return;
        setError(e);
        setRawData(null);
        setNormalizedData(null);
        setFetchStrategy(null);
        setExpandedFeatureIds({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectIdFromUrl]);

  const setProjectFilter = useCallback(
    (nextProjectId) => {
      const trimmed = nextProjectId != null ? String(nextProjectId).trim() : "";
      const next = new URLSearchParams(searchParams);
      if (!trimmed || !isValidNexusUuid(trimmed)) {
        next.delete("project");
      } else {
        next.set("project", trimmed);
      }
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const filteredStories = useMemo(() => {
    if (!normalizedData?.stories) return [];
    const afterFilters = applyProductBacklogFilters(normalizedData.stories, {
      refinementFilter,
      priorityFilter,
      featureIdFilter,
      assigneeFilter,
      qualitySeverityFilter,
      itemTypeFilter,
      readyOnly: readyOnlyFilter,
    });
    return filterStoriesBySearchQuery(afterFilters, searchQuery);
  }, [
    normalizedData,
    searchQuery,
    refinementFilter,
    priorityFilter,
    featureIdFilter,
    assigneeFilter,
    qualitySeverityFilter,
    itemTypeFilter,
    readyOnlyFilter,
  ]);

  const sortedStories = useMemo(
    () => sortProductBacklogStories(filteredStories, sortMode),
    [filteredStories, sortMode]
  );

  const groupedSections = useMemo(
    () =>
      groupStoriesForProductBacklog(sortedStories, normalizedData?.featuresOrdered ?? [], groupByFeature),
    [sortedStories, normalizedData, groupByFeature]
  );

  const refinementFilterOptions = useMemo(() => {
    const base = ["IDEA", "DRAFT", "REFINED", "READY"];
    if (!normalizedData?.stories) return base;
    const uniq = new Set(base);
    for (const s of normalizedData.stories) {
      if (s.refinement_status) uniq.add(String(s.refinement_status).trim());
    }
    return Array.from(uniq).filter((x) => base.includes(x));
  }, [normalizedData]);

  const itemTypeFilterOptions = useMemo(() => {
    const base = ["STORY", "BUG", "TECH_TASK", "IMPROVEMENT"];
    return base;
  }, []);

  const priorityFilterOptions = useMemo(() => ["LOW", "MEDIUM", "HIGH", "CRITICAL"], []);

  const featureFilterSelectOptions = useMemo(() => {
    const opts = [];
    const feats = normalizedData?.featuresOrdered ?? [];
    for (const f of feats) {
      if (f?.id && f?.title) {
        const prefix = f.display_key ? `${f.display_key} — ` : "";
        opts.push({ value: f.id, label: `${prefix}${f.title}` });
      }
    }
    opts.push({ value: NO_FEATURE_FILTER_VALUE, label: "Sin feature" });
    return opts;
  }, [normalizedData]);

  const assigneeFilterOptions = useMemo(() => {
    const list = normalizedData?.stories ?? [];
    const byId = new Map();
    for (const s of list) {
      const aid = s.assignee_id != null ? String(s.assignee_id).trim() : "";
      if (!aid) continue;
      const label = s.assignee_label || s.assignee_initials || aid;
      if (!byId.has(aid)) byId.set(aid, label);
    }
    return Array.from(byId.entries())
      .map(([id, label]) => ({ value: id, label: String(label) }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [normalizedData]);

  const qualitySeverityFilterOptions = useMemo(
    () => [
      { value: "", label: "Todas" },
      { value: "ok", label: "OK" },
      { value: "info", label: "Grooming (info)" },
      { value: "warning", label: "Grooming (estimación)" },
      { value: "critical", label: "Bajo (crítico)" },
    ],
    []
  );

  const toggleFeatureExpanded = useCallback((featureId) => {
    const fid = featureId != null ? String(featureId) : "";
    if (!fid) return;
    setExpandedFeatureIds((prev) => {
      const currentlyOpen = prev[fid] !== false;
      return { ...prev, [fid]: !currentlyOpen };
    });
  }, []);

  const refetch = useCallback(() => {
    if (projectIdFromUrl) return runFetch(projectIdFromUrl);
    return Promise.resolve();
  }, [runFetch, projectIdFromUrl]);

  return {
    projectId: projectIdFromUrl,
    rawData,
    normalizedData,
    fetchStrategy,
    searchQuery,
    refinementFilter,
    priorityFilter,
    featureIdFilter,
    assigneeFilter,
    qualitySeverityFilter,
    itemTypeFilter,
    readyOnlyFilter,
    sortMode,
    groupByFeature,
    expandedFeatureIds,
    loading,
    error,
    filteredStories,
    sortedStories,
    groupedSections,
    refinementFilterOptions,
    priorityFilterOptions,
    featureFilterSelectOptions,
    assigneeFilterOptions,
    qualitySeverityFilterOptions,
    unassignedFilterValue: UNASSIGNED_FILTER_VALUE,
    itemTypeFilterOptions,
    setProjectFilter,
    setSearchQuery,
    setRefinementFilter,
    setPriorityFilter,
    setFeatureIdFilter,
    setAssigneeFilter,
    setQualitySeverityFilter,
    setItemTypeFilter,
    setReadyOnlyFilter,
    setSortMode,
    setGroupByFeature,
    toggleFeatureExpanded,
    refetch,
  };
}
