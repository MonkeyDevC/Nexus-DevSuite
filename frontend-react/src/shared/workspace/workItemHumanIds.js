/**
 * Patrón único de códigos de trabajo en UI: PR-n, FT-n, US-n.
 * El `number` canónico viene del API; títulos pueden traer prefijos legacy que conviene quitar al componer etiquetas.
 */

/**
 * Entrada tal cual en la barra global: una sola pieza PR-1 / ft-2 / US 3.
 * @param {string} raw
 * @returns {{ prefix: 'PR'|'FT'|'US', number: number } | null}
 */
export function parseHumanWorkItemCodeInput(raw) {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return null;
  const m = s.match(/^(PR|FT|US)\s*[-]?\s*(\d+)\s*$/i);
  if (!m) return null;
  const num = parseInt(m[2], 10);
  if (!Number.isFinite(num) || num < 1) return null;
  const prefix = m[1].toUpperCase();
  if (prefix !== "PR" && prefix !== "FT" && prefix !== "US") return null;
  return { prefix, number: num };
}

/**
 * @param {number|null|undefined} n
 * @returns {string|null}
 */
export function formatProjectHumanId(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) return null;
  return `PR-${num}`;
}

/**
 * @param {number|null|undefined} n
 * @returns {string|null}
 */
export function formatFeatureHumanId(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) return null;
  return `FT-${num}`;
}

/**
 * @param {number|null|undefined} n
 * @returns {string|null}
 */
export function formatStoryHumanId(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) return null;
  return `US-${num}`;
}

/**
 * @param {string} rawTitle
 * @param {number|null|undefined} featureNumber
 * @returns {string}
 */
export function stripEmbeddedFeatureCodeFromTitle(rawTitle, featureNumber) {
  const raw = rawTitle != null ? String(rawTitle).trim() : "";
  if (!raw) return "";
  let t = raw;
  const num =
    featureNumber != null && !Number.isNaN(Number(featureNumber)) ? Number(featureNumber) : null;
  if (num != null) {
    t = t.replace(new RegExp(`^\\s*FT-?\\s*${num}\\s*[-–—:.]\\s*`, "i"), "").trim();
  }
  t = t.replace(/^\s*FT-?\s*\d+\s*[-–—:.]\s*/i, "").trim();
  return t || raw;
}

/**
 * @param {string} rawTitle
 * @param {number|null|undefined} storyNumber
 * @returns {string}
 */
export function stripEmbeddedStoryCodeFromTitle(rawTitle, storyNumber) {
  const raw = rawTitle != null ? String(rawTitle).trim() : "";
  if (!raw) return "";
  let t = raw;
  const num =
    storyNumber != null && !Number.isNaN(Number(storyNumber)) ? Number(storyNumber) : null;
  if (num != null) {
    t = t.replace(new RegExp(`^\\s*US-?\\s*${num}\\s*[-–—:.]\\s*`, "i"), "").trim();
  }
  t = t.replace(/^\s*US-?\s*\d+\s*[-–—:.]\s*/i, "").trim();
  return t || raw;
}

/**
 * @param {string} rawName
 * @param {number|null|undefined} projectNumber
 * @returns {string}
 */
export function stripEmbeddedProjectCodeFromName(rawName, projectNumber) {
  const raw = rawName != null ? String(rawName).trim() : "";
  if (!raw) return "";
  let t = raw;
  const num =
    projectNumber != null && !Number.isNaN(Number(projectNumber)) ? Number(projectNumber) : null;
  if (num != null) {
    t = t.replace(new RegExp(`^\\s*PR-?\\s*${num}\\s*[-–—:.]\\s*`, "i"), "").trim();
  }
  t = t.replace(/^\s*PR-?\s*\d+\s*[-–—:.]\s*/i, "").trim();
  return t || raw;
}

/**
 * @param {number|null|undefined} number
 * @param {string} rawTitle
 * @param {string} [separator=' — ']
 */
export function formatFeatureListLabel(number, rawTitle, separator = " — ") {
  const code = formatFeatureHumanId(number);
  const title = stripEmbeddedFeatureCodeFromTitle(rawTitle, number);
  if (code && title) return `${code}${separator}${title}`;
  if (title) return title;
  return "—";
}

/**
 * @param {number|null|undefined} number
 * @param {string} rawTitle
 * @param {string} [separator=' — ']
 */
export function formatStoryListLabel(number, rawTitle, separator = " — ") {
  const code = formatStoryHumanId(number);
  const title = stripEmbeddedStoryCodeFromTitle(rawTitle, number);
  if (code && title) return `${code}${separator}${title}`;
  if (title) return title;
  return "—";
}
