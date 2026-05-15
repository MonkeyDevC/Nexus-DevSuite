/**
 * Códigos humanos canónicos: PR-n (proyecto), FT-n (feature), US-n (historia).
 * El número de negocio vive en la columna `number`; el título/nombre no debe duplicar el prefijo.
 */

/**
 * @param {string} rawTitle
 * @param {number|null|undefined} canonicalNumber
 * @returns {string}
 */
function stripEmbeddedFeatureCodeFromTitle(rawTitle, canonicalNumber) {
  const raw = rawTitle != null ? String(rawTitle).trim() : "";
  if (!raw) return "";
  let t = raw;
  const num =
    canonicalNumber != null && !Number.isNaN(Number(canonicalNumber))
      ? Number(canonicalNumber)
      : null;
  if (num != null) {
    t = t.replace(new RegExp(`^\\s*FT-?\\s*${num}\\s*[-–—:.]\\s*`, "i"), "").trim();
  }
  t = t.replace(/^\s*FT-?\s*\d+\s*[-–—:.]\s*/i, "").trim();
  return t || raw;
}

/**
 * @param {string} rawTitle
 * @param {number|null|undefined} canonicalNumber
 * @returns {string}
 */
function stripEmbeddedStoryCodeFromTitle(rawTitle, canonicalNumber) {
  const raw = rawTitle != null ? String(rawTitle).trim() : "";
  if (!raw) return "";
  let t = raw;
  const num =
    canonicalNumber != null && !Number.isNaN(Number(canonicalNumber))
      ? Number(canonicalNumber)
      : null;
  if (num != null) {
    t = t.replace(new RegExp(`^\\s*US-?\\s*${num}\\s*[-–—:.]\\s*`, "i"), "").trim();
  }
  t = t.replace(/^\s*US-?\s*\d+\s*[-–—:.]\s*/i, "").trim();
  return t || raw;
}

/**
 * @param {string} rawName
 * @param {number|null|undefined} canonicalNumber
 * @returns {string}
 */
function stripEmbeddedProjectCodeFromName(rawName, canonicalNumber) {
  const raw = rawName != null ? String(rawName).trim() : "";
  if (!raw) return "";
  let t = raw;
  const num =
    canonicalNumber != null && !Number.isNaN(Number(canonicalNumber))
      ? Number(canonicalNumber)
      : null;
  if (num != null) {
    t = t.replace(new RegExp(`^\\s*PR-?\\s*${num}\\s*[-–—:.]\\s*`, "i"), "").trim();
  }
  t = t.replace(/^\s*PR-?\s*\d+\s*[-–—:.]\s*/i, "").trim();
  return t || raw;
}

module.exports = {
  stripEmbeddedFeatureCodeFromTitle,
  stripEmbeddedStoryCodeFromTitle,
  stripEmbeddedProjectCodeFromName,
};
