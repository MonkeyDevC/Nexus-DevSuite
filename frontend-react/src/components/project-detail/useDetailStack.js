/**
 * Profundidad del workspace stack derivada únicamente de query params (feature / story).
 * z-index por nivel: project 10, feature 20, story 30 (ver HierarchyOverlayStack).
 */

/** @param {string} validFeatureId */
/** @param {string} validStoryId */
export function getDetailStackTopDepth(validFeatureId, validStoryId) {
  if (validStoryId) return 2;
  if (validFeatureId) return 1;
  return 0;
}

/**
 * Stack lógico para auditoría / tests: siempre incluye project; feature y story si aplican.
 * @param {{ validFeatureId: string, validStoryId: string }} p
 * @returns {Array<'project'|'feature'|'story'>}
 */
export function buildDetailStackLevels({ validFeatureId, validStoryId }) {
  const out = /** @type {Array<'project'|'feature'|'story'>} */ (["project"]);
  if (validFeatureId) out.push("feature");
  if (validStoryId) out.push("story");
  return out;
}
