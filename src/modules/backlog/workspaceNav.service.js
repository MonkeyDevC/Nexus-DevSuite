/**
 * Resolución de códigos humanos (PR-n, FT-n, US-n) → ids para navegación.
 * Aislamiento multi-tenant: todo resultado debe pertenecer a organizationId del request.
 */

const projectsRepository = require("./projects.repository");
const featureRepository = require("./feature.repository");
const userStoryRepository = require("./userStory.repository");

/**
 * @param {string} raw
 * @returns {{ prefix: string, number: number } | null}
 */
function parseHumanWorkItemCode(raw) {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return null;
  const m = s.match(/^(PR|FT|US)\s*[-]?\s*(\d+)\s*$/i);
  if (!m) return null;
  const num = parseInt(m[2], 10);
  if (!Number.isFinite(num) || num < 1) return null;
  return { prefix: m[1].toUpperCase(), number: num };
}

/**
 * @param {string|null|undefined} organizationId
 * @param {string} rawQuery
 * @returns {Promise<object>}
 */
async function resolveHumanWorkItemCode(organizationId, rawQuery) {
  const parsed = parseHumanWorkItemCode(rawQuery);
  if (!parsed) {
    return { matched: false, reason: "not_a_code" };
  }
  if (organizationId == null || String(organizationId).trim() === "") {
    return { matched: false, reason: "tenant_required" };
  }
  const orgId = String(organizationId).trim();
  const { prefix, number } = parsed;

  if (prefix === "PR") {
    const project = await projectsRepository.findByOrganizationAndNumber(orgId, number);
    if (!project) {
      return { matched: false, reason: "not_found", code: `PR-${number}` };
    }
    return {
      matched: true,
      kind: "project",
      code: `PR-${number}`,
      id: project.id,
      project_id: project.id,
      feature_id: null
    };
  }

  if (prefix === "FT") {
    const feature = await featureRepository.findByNumber(number);
    if (!feature) {
      return { matched: false, reason: "not_found", code: `FT-${number}` };
    }
    const project = await projectsRepository.findById(feature.project_id);
    if (!project || String(project.organization_id) !== orgId) {
      return { matched: false, reason: "not_found", code: `FT-${number}` };
    }
    return {
      matched: true,
      kind: "feature",
      code: `FT-${number}`,
      id: feature.id,
      project_id: feature.project_id,
      feature_id: feature.id
    };
  }

  const story = await userStoryRepository.findByNumber(number);
  if (!story) {
    return { matched: false, reason: "not_found", code: `US-${number}` };
  }
  let resolvedProjectId =
    story.project_id != null && String(story.project_id).trim() !== ""
      ? String(story.project_id).trim()
      : null;
  if (!resolvedProjectId && story.feature_id) {
    const f = await featureRepository.findById(story.feature_id);
    resolvedProjectId = f && f.project_id ? String(f.project_id) : null;
  }
  if (!resolvedProjectId) {
    return { matched: false, reason: "not_found", code: `US-${number}` };
  }
  const project = await projectsRepository.findById(resolvedProjectId);
  if (!project || String(project.organization_id) !== orgId) {
    return { matched: false, reason: "not_found", code: `US-${number}` };
  }
  const fid = story.feature_id != null && String(story.feature_id).trim() !== "" ? String(story.feature_id).trim() : null;
  return {
    matched: true,
    kind: "story",
    code: `US-${number}`,
    id: story.id,
    project_id: resolvedProjectId,
    feature_id: fid
  };
}

module.exports = {
  parseHumanWorkItemCode,
  resolveHumanWorkItemCode
};
