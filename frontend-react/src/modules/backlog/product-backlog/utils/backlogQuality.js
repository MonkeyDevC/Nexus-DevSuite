/**
 * Indicadores de calidad sobre historias normalizadas (util pura).
 * @typedef {"critical"|"warning"|"info"} QualitySeverity
 */

/** @type {Record<QualitySeverity, number>} */
const SEVERITY_RANK = Object.freeze({
  critical: 3,
  warning: 2,
  info: 1,
});

/**
 * @param {import("./normalizeProductBacklog.js").NormalizedStory} story
 * @returns {{ severity: QualitySeverity, key: string, label: string }[]}
 */
export function getStoryQualityFindings(story) {
  if (!story) return [];
  /** @type {{ severity: QualitySeverity, key: string, label: string }[]} */
  const out = [];
  const desc = story.description != null ? String(story.description).trim() : "";
  if (!desc) {
    out.push({ severity: "critical", key: "description", label: "Sin descripción" });
  }
  if (story.story_points == null || Number.isNaN(Number(story.story_points))) {
    out.push({ severity: "warning", key: "story_points", label: "Sin estimación" });
  }
  if (story.feature_id == null || String(story.feature_id).trim() === "") {
    out.push({ severity: "info", key: "feature", label: "Sin feature" });
  }
  return out;
}

/**
 * @param {import("./normalizeProductBacklog.js").NormalizedStory} story
 * @returns {{ severity: QualitySeverity, key: string, label: string }|null}
 */
export function getPrimaryQualityFinding(story) {
  const all = getStoryQualityFindings(story);
  if (all.length === 0) return null;
  return all.reduce((best, cur) => (SEVERITY_RANK[cur.severity] > SEVERITY_RANK[best.severity] ? cur : best));
}

/**
 * @param {{ severity: QualitySeverity, key: string, label: string }[]} findings
 * @returns {string}
 */
export function formatQualityTooltipLines(findings) {
  if (!Array.isArray(findings) || findings.length === 0) return "";
  return findings.map((f) => f.label).join("\n");
}
