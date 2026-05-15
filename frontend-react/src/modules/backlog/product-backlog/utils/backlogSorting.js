/**
 * Ordenamiento puro de historias del product backlog.
 * @typedef {"manual"|"priority"|"created_at"} ProductBacklogSortMode
 */

/** @type {Record<string, number>} */
const PRIORITY_RANK = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
});

/**
 * @param {unknown} priority
 * @returns {number}
 */
function priorityRank(priority) {
  if (priority == null) return 99;
  const key = String(priority).trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(PRIORITY_RANK, key)) {
    return PRIORITY_RANK[key];
  }
  return 50;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {number}
 */
function compareNullableNumberAsc(a, b) {
  const na = a == null || Number.isNaN(Number(a)) ? null : Number(a);
  const nb = b == null || Number.isNaN(Number(b)) ? null : Number(b);
  if (na == null && nb == null) return 0;
  if (na == null) return 1;
  if (nb == null) return -1;
  if (na !== nb) return na - nb;
  return 0;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {number}
 */
function compareIsoDateAsc(a, b) {
  const ta = a != null ? Date.parse(String(a)) : NaN;
  const tb = b != null ? Date.parse(String(b)) : NaN;
  const va = Number.isFinite(ta) ? ta : null;
  const vb = Number.isFinite(tb) ? tb : null;
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  if (va !== vb) return va - vb;
  return 0;
}

/**
 * @param {{ id?: string }} s
 * @returns {string}
 */
function stableStoryKey(s) {
  return s.id != null ? String(s.id) : "";
}

/**
 * @param {object[]} stories — historias normalizadas (NormalizedStory)
 * @param {ProductBacklogSortMode} mode
 * @returns {object[]}
 */
export function sortProductBacklogStories(stories, mode) {
  const list = Array.isArray(stories) ? [...stories] : [];
  if (mode === "priority") {
    list.sort((a, b) => {
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      const bp = compareNullableNumberAsc(a.backlog_position, b.backlog_position);
      if (bp !== 0) return bp;
      const cd = compareIsoDateAsc(a.created_at, b.created_at);
      if (cd !== 0) return cd;
      return stableStoryKey(a).localeCompare(stableStoryKey(b));
    });
    return list;
  }
  if (mode === "created_at") {
    list.sort((a, b) => {
      const cd = compareIsoDateAsc(a.created_at, b.created_at);
      if (cd !== 0) return cd;
      const bp = compareNullableNumberAsc(a.backlog_position, b.backlog_position);
      if (bp !== 0) return bp;
      return stableStoryKey(a).localeCompare(stableStoryKey(b));
    });
    return list;
  }
  /* manual: backlog_position ascendente, null al final; empate → prioridad → created_at → id */
  list.sort((a, b) => {
    const bp = compareNullableNumberAsc(a.backlog_position, b.backlog_position);
    if (bp !== 0) return bp;
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    const cd = compareIsoDateAsc(a.created_at, b.created_at);
    if (cd !== 0) return cd;
    return stableStoryKey(a).localeCompare(stableStoryKey(b));
  });
  return list;
}
