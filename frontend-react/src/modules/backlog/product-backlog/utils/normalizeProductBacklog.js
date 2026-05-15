/**
 * SSOT: interpretación de payloads API → shape estable para Product Backlog.
 * La UI no debe leer campos crudos ni coercer en JSX.
 */

import { isValidNexusUuid, logDev } from "../../../../shared/cache/domainWorkCache.js";
import {
  stripEmbeddedFeatureCodeFromTitle,
  stripEmbeddedStoryCodeFromTitle,
} from "../../../../shared/workspace/workItemHumanIds.js";

/**
 * @typedef {object} NormalizedStory
 * @property {string} id
 * @property {number|null} number
 * @property {string} display_key
 * @property {string} title
 * @property {string} refinement_status
 * @property {string} item_type
 * @property {string} workflow_status — status de ejecución API (DRAFT, READY, IN_PROGRESS, …)
 * @property {string} priority
 * @property {number|null} story_points
 * @property {string|null} assignee_initials
 * @property {string|null} assignee_label
 * @property {string|null} assignee_id
 * @property {string|null} sprint_id
 * @property {string|null} sprint_name
 * @property {string|null} feature_id
 * @property {number|null} backlog_position
 * @property {string|null} created_at
 * @property {string} description
 * @property {string} project_id
 */

/**
 * @typedef {object} NormalizedFeature
 * @property {string} id
 * @property {string} title
 * @property {number|null} number
 * @property {string} display_key
 * @property {string} project_id
 */

/**
 * @typedef {object} NormalizedProductBacklogModel
 * @property {NormalizedFeature[]} featuresOrdered
 * @property {NormalizedStory[]} stories
 * @property {Record<string, NormalizedStory>} storiesById
 * @property {Record<string, NormalizedFeature>} featuresById
 */

/**
 * @param {unknown} v
 * @returns {string}
 */
function asTrimmedString(v) {
  if (v == null) return "";
  return String(v).trim();
}

/**
 * @param {unknown} assignee
 * @returns {{ initials: string|null, label: string|null }}
 */
function deriveAssigneePresentation(assignee) {
  if (!assignee || typeof assignee !== "object") {
    return { initials: null, label: null };
  }
  const name = typeof assignee.name === "string" ? assignee.name.trim() : "";
  const email = typeof assignee.email === "string" ? assignee.email.trim() : "";
  const label = name || email || null;
  if (!label) {
    return { initials: null, label: null };
  }
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0] || "";
      const b = parts[parts.length - 1][0] || "";
      const ini = `${a}${b}`.toUpperCase();
      return { initials: ini || null, label };
    }
    const ch = name.slice(0, 2);
    return { initials: ch.toUpperCase() || null, label };
  }
  const local = email.includes("@") ? email.split("@")[0] : email;
  const ini = local.slice(0, 2).toUpperCase();
  return { initials: ini || null, label: email };
}

/**
 * @param {object} raw
 * @param {string} projectId
 * @returns {NormalizedStory|null}
 */
export function normalizeProductBacklogStory(raw, projectId) {
  if (!raw || typeof raw !== "object") return null;
  const id = asTrimmedString(raw.id);
  if (!id || !isValidNexusUuid(id)) return null;
  const titleRaw = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!titleRaw) {
    logDev("[ProductBacklog] story sin título válido", raw);
    return null;
  }
  const num = raw.number != null && !Number.isNaN(Number(raw.number)) ? Number(raw.number) : null;
  const title = stripEmbeddedStoryCodeFromTitle(titleRaw, num);
  const featureFromNested =
    raw.feature && typeof raw.feature === "object" && raw.feature.id != null
      ? asTrimmedString(raw.feature.id)
      : "";
  const featureIdRaw = asTrimmedString(raw.feature_id) || featureFromNested;
  const featureId =
    featureIdRaw && isValidNexusUuid(featureIdRaw) ? featureIdRaw : null;
  const displayKey = num != null ? `US-${num}` : `US-${id.slice(0, 8).toUpperCase()}`;
  const { initials, label } = deriveAssigneePresentation(raw.assignee);
  const desc = raw.description != null ? String(raw.description) : "";
  const pid = asTrimmedString(raw.project_id) || projectId;
  const effectiveProjectId = isValidNexusUuid(pid) ? pid : isValidNexusUuid(projectId) ? projectId : "";
  if (!isValidNexusUuid(effectiveProjectId)) {
    logDev("[ProductBacklog] story sin project_id válido", raw);
    return null;
  }
  const rs = raw.refinement_status != null ? String(raw.refinement_status).trim() : "";
  const refinementStatus = ["IDEA", "DRAFT", "REFINED", "READY"].includes(rs) ? rs : "DRAFT";
  const it = raw.item_type != null ? String(raw.item_type).trim() : "STORY";
  const itemType = ["STORY", "BUG", "TECH_TASK", "IMPROVEMENT"].includes(it) ? it : "STORY";
  const wf = raw.status != null ? String(raw.status).trim() || "UNKNOWN" : "UNKNOWN";
  const assignedTo = asTrimmedString(raw.assigned_to);
  const assigneeId = assignedTo && isValidNexusUuid(assignedTo) ? assignedTo : null;
  const sprintIdRaw = asTrimmedString(raw.sprint_id);
  const sprintId = sprintIdRaw && isValidNexusUuid(sprintIdRaw) ? sprintIdRaw : null;
  let sprintName = null;
  if (raw.sprint && typeof raw.sprint === "object") {
    const nm = raw.sprint.name != null ? String(raw.sprint.name).trim() : "";
    sprintName = nm || null;
  }
  return {
    id,
    number: num,
    display_key: displayKey,
    title,
    refinement_status: refinementStatus,
    item_type: itemType,
    workflow_status: wf,
    priority: raw.priority != null ? String(raw.priority).trim() || "—" : "—",
    story_points:
      raw.story_points != null && !Number.isNaN(Number(raw.story_points)) ? Number(raw.story_points) : null,
    assignee_initials: initials,
    assignee_label: label,
    assignee_id: assigneeId,
    sprint_id: sprintId,
    sprint_name: sprintName,
    feature_id: featureId,
    backlog_position:
      raw.backlog_position != null && !Number.isNaN(Number(raw.backlog_position))
        ? Number(raw.backlog_position)
        : null,
    created_at: raw.created_at != null ? String(raw.created_at) : null,
    description: desc,
    project_id: effectiveProjectId,
  };
}

/**
 * @param {object} raw
 * @param {string} projectId
 * @returns {NormalizedFeature|null}
 */
export function normalizeProductBacklogFeature(raw, projectId) {
  if (!raw || typeof raw !== "object") return null;
  const id = asTrimmedString(raw.id);
  if (!id || !isValidNexusUuid(id)) return null;
  const titleRaw = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!titleRaw) {
    logDev("[ProductBacklog] feature sin título válido", raw);
    return null;
  }
  const pidRaw = raw.project_id != null ? asTrimmedString(raw.project_id) : projectId;
  const pid = pidRaw && isValidNexusUuid(pidRaw) ? pidRaw : projectId;
  if (!isValidNexusUuid(pid)) return null;
  if (raw.project_id != null && isValidNexusUuid(pidRaw) && pidRaw !== projectId) {
    logDev("[ProductBacklog] feature project_id inconsistente con contexto", { pidRaw, projectId });
    return null;
  }
  const featNum = raw.number != null && !Number.isNaN(Number(raw.number)) ? Number(raw.number) : null;
  const title = stripEmbeddedFeatureCodeFromTitle(titleRaw, featNum);
  const displayKey = featNum != null ? `FT-${featNum}` : `FT-${id.slice(0, 8).toUpperCase()}`;
  return { id, title, number: featNum, display_key: displayKey, project_id: pid };
}

/**
 * @param {{ rawStories: object[], rawFeatures: object[], projectId: string }} input
 * @returns {NormalizedProductBacklogModel}
 */
export function buildNormalizedProductBacklogModel({ rawStories, rawFeatures, projectId }) {
  const pid = asTrimmedString(projectId);
  const featuresOrdered = [];
  const featuresById = Object.create(null);
  const featureItems = Array.isArray(rawFeatures) ? rawFeatures : [];
  for (const fr of featureItems) {
    const nf = normalizeProductBacklogFeature(fr, pid);
    if (!nf) continue;
    featuresOrdered.push(nf);
    featuresById[nf.id] = nf;
  }

  const stories = [];
  const storiesById = Object.create(null);
  const storyItems = Array.isArray(rawStories) ? rawStories : [];
  for (const sr of storyItems) {
    const ns = normalizeProductBacklogStory(sr, pid);
    if (!ns) continue;
    stories.push(ns);
    storiesById[ns.id] = ns;
  }

  return { featuresOrdered, stories, storiesById, featuresById };
}
