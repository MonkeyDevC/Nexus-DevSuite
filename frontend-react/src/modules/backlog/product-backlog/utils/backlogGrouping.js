/**
 * Agrupa historias ordenadas bajo features (salida estable).
 * @typedef {import("./normalizeProductBacklog.js").NormalizedStory} NormalizedStory
 * @typedef {import("./normalizeProductBacklog.js").NormalizedFeature} NormalizedFeature
 */

/** Id estable para la sección "Sin feature" (historias con feature_id null). */
export const BACKLOG_NO_FEATURE_SECTION_ID = "__backlog_no_feature__";

/**
 * @typedef {object} BacklogFeatureSection
 * @property {NormalizedFeature|null} feature — null = lista plana sin cabecera de grupo
 * @property {NormalizedStory[]} stories
 */

/**
 * @param {NormalizedStory} s
 * @returns {string}
 */
function groupingKeyForStory(s) {
  const fid = s.feature_id != null ? String(s.feature_id).trim() : "";
  if (fid && fid.length > 0) return fid;
  return BACKLOG_NO_FEATURE_SECTION_ID;
}

/**
 * @param {NormalizedStory[]} sortedStories
 * @param {NormalizedFeature[]} featuresOrdered
 * @param {boolean} groupByFeature
 * @returns {BacklogFeatureSection[]}
 */
export function groupStoriesForProductBacklog(sortedStories, featuresOrdered, groupByFeature) {
  const list = Array.isArray(sortedStories) ? sortedStories : [];
  if (!groupByFeature) {
    return [{ feature: null, stories: [...list] }];
  }
  const byFeature = new Map();
  for (const s of list) {
    const key = groupingKeyForStory(s);
    if (!byFeature.has(key)) byFeature.set(key, []);
    byFeature.get(key).push(s);
  }
  /** @type {BacklogFeatureSection[]} */
  const sections = [];
  const seen = new Set();
  for (const f of featuresOrdered) {
    const rows = byFeature.get(f.id) || [];
    sections.push({ feature: f, stories: rows });
    seen.add(f.id);
  }
  for (const [fid, rows] of byFeature) {
    if (!seen.has(fid) && fid !== BACKLOG_NO_FEATURE_SECTION_ID && rows.length > 0) {
      sections.push({
        feature: {
          id: fid,
          title: "Feature desconocida",
          number: null,
          display_key: "FT-?",
          project_id: rows[0].project_id,
        },
        stories: rows,
      });
    }
  }
  const noFeatureRows = byFeature.get(BACKLOG_NO_FEATURE_SECTION_ID) || [];
  if (noFeatureRows.length > 0) {
    sections.push({
      feature: {
        id: BACKLOG_NO_FEATURE_SECTION_ID,
        title: "Sin feature",
        number: null,
        display_key: "—",
        project_id: noFeatureRows[0].project_id,
      },
      stories: noFeatureRows,
    });
  }
  return sections;
}
