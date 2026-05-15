/**
 * Filtros puros sobre historias ya normalizadas.
 * @typedef {import("./normalizeProductBacklog.js").NormalizedStory} NormalizedStory
 */

import { getPrimaryQualityFinding } from "./backlogQuality.js";

export const READY_ONLY_FILTER_VALUE = "__ONLY_READY__";

export const NO_FEATURE_FILTER_VALUE = "__no_feature__";
export const UNASSIGNED_FILTER_VALUE = "__unassigned__";
export const QUALITY_OK_FILTER_VALUE = "ok";

const REFINEMENT_VALUES = new Set(["IDEA", "DRAFT", "REFINED", "READY"]);
const ITEM_TYPES = new Set(["STORY", "BUG", "TECH_TASK", "IMPROVEMENT"]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const QUALITY_SEVERITIES = new Set(["critical", "warning", "info"]);

/**
 * @param {NormalizedStory[]} stories
 * @param {string} query
 * @returns {NormalizedStory[]}
 */
export function filterStoriesBySearchQuery(stories, query) {
  const q = query != null ? String(query).trim().toLowerCase() : "";
  if (!q) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  return list.filter((s) => {
    const inTitle = s.title.toLowerCase().includes(q);
    const inId = s.id.toLowerCase().includes(q);
    const numPart = s.number != null ? String(s.number) : "";
    const inNumber = numPart.includes(q);
    const inKey = s.display_key.toLowerCase().includes(q);
    return inTitle || inId || inNumber || inKey;
  });
}

/**
 * @param {NormalizedStory[]} stories
 * @param {string} refinementFilter — "" = todos; valor IDEA|DRAFT|REFINED|READY
 * @returns {NormalizedStory[]}
 */
export function filterStoriesByRefinementStatus(stories, refinementFilter) {
  const st = refinementFilter != null ? String(refinementFilter).trim() : "";
  if (!st || !REFINEMENT_VALUES.has(st)) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  return list.filter((s) => String(s.refinement_status || "").trim() === st);
}

/**
 * @param {NormalizedStory[]} stories
 * @param {string} itemTypeFilter — "" = todos
 * @returns {NormalizedStory[]}
 */
export function filterStoriesByItemType(stories, itemTypeFilter) {
  const t = itemTypeFilter != null ? String(itemTypeFilter).trim() : "";
  if (!t || !ITEM_TYPES.has(t)) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  return list.filter((s) => String(s.item_type || "STORY").trim() === t);
}

/**
 * @param {NormalizedStory[]} stories
 * @param {boolean} readyOnly
 * @returns {NormalizedStory[]}
 */
export function filterStoriesReadyOnly(stories, readyOnly) {
  if (!readyOnly) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  return list.filter((s) => String(s.refinement_status || "").trim() === "READY");
}

/**
 * @param {NormalizedStory[]} stories
 * @param {string} priorityFilter
 * @returns {NormalizedStory[]}
 */
export function filterStoriesByPriority(stories, priorityFilter) {
  const p = priorityFilter != null ? String(priorityFilter).trim().toUpperCase() : "";
  if (!p || !PRIORITIES.has(p)) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  return list.filter((s) => String(s.priority || "").trim().toUpperCase() === p);
}

/**
 * @param {NormalizedStory[]} stories
 * @param {string} featureIdFilter — UUID, NO_FEATURE, o ""
 */
export function filterStoriesByFeatureId(stories, featureIdFilter) {
  const f = featureIdFilter != null ? String(featureIdFilter).trim() : "";
  if (!f) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  if (f === NO_FEATURE_FILTER_VALUE) {
    return list.filter((s) => s.feature_id == null || String(s.feature_id).trim() === "");
  }
  return list.filter((s) => String(s.feature_id || "").trim() === f);
}

/**
 * @param {NormalizedStory[]} stories
 * @param {string} assigneeFilter — UUID, UNASSIGNED, o ""
 */
export function filterStoriesByAssignee(stories, assigneeFilter) {
  const a = assigneeFilter != null ? String(assigneeFilter).trim() : "";
  if (!a) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  if (a === UNASSIGNED_FILTER_VALUE) {
    return list.filter((s) => s.assignee_id == null || String(s.assignee_id).trim() === "");
  }
  return list.filter((s) => String(s.assignee_id || "").trim() === a);
}

/**
 * @param {NormalizedStory[]} stories
 * @param {string} qualitySeverityFilter — critical|warning|info|ok|""
 */
export function filterStoriesByQualitySeverity(stories, qualitySeverityFilter) {
  const q = qualitySeverityFilter != null ? String(qualitySeverityFilter).trim().toLowerCase() : "";
  if (!q) return [...stories];
  const list = Array.isArray(stories) ? stories : [];
  if (q === QUALITY_OK_FILTER_VALUE) {
    return list.filter((s) => getPrimaryQualityFinding(s) == null);
  }
  if (!QUALITY_SEVERITIES.has(q)) return [...list];
  return list.filter((s) => getPrimaryQualityFinding(s)?.severity === q);
}

/**
 * Pipeline AND: refinamiento → prioridad → feature → asignado → calidad → tipo → solo READY; luego búsqueda en el hook.
 * @param {NormalizedStory[]} stories
 * @param {{
 *   refinementFilter: string,
 *   priorityFilter: string,
 *   featureIdFilter: string,
 *   assigneeFilter: string,
 *   qualitySeverityFilter: string,
 *   itemTypeFilter: string,
 *   readyOnly: boolean
 * }} criteria
 * @returns {NormalizedStory[]}
 */
export function applyProductBacklogFilters(stories, criteria) {
  const list = Array.isArray(stories) ? stories : [];
  const refinementFilter = criteria?.refinementFilter != null ? String(criteria.refinementFilter).trim() : "";
  const priorityFilter = criteria?.priorityFilter != null ? String(criteria.priorityFilter).trim() : "";
  const featureIdFilter = criteria?.featureIdFilter != null ? String(criteria.featureIdFilter).trim() : "";
  const assigneeFilter = criteria?.assigneeFilter != null ? String(criteria.assigneeFilter).trim() : "";
  const qualitySeverityFilter = criteria?.qualitySeverityFilter != null ? String(criteria.qualitySeverityFilter).trim() : "";
  const itemTypeFilter = criteria?.itemTypeFilter != null ? String(criteria.itemTypeFilter).trim() : "";
  const readyOnly = Boolean(criteria?.readyOnly);
  let out = filterStoriesByRefinementStatus(list, refinementFilter);
  out = filterStoriesByPriority(out, priorityFilter);
  out = filterStoriesByFeatureId(out, featureIdFilter);
  out = filterStoriesByAssignee(out, assigneeFilter);
  out = filterStoriesByQualitySeverity(out, qualitySeverityFilter);
  out = filterStoriesByItemType(out, itemTypeFilter);
  out = filterStoriesReadyOnly(out, readyOnly);
  return out;
}

/** @deprecated Usar filterStoriesByRefinementStatus; se mantiene por compatibilidad temporal. */
export function filterStoriesByStatus(stories, statusFilter) {
  return filterStoriesByRefinementStatus(stories, statusFilter);
}
