/**
 * Normalización de evidencia markdown (mismo límite que proyecto / backlog.validator).
 */

const MAX_EVIDENCE_MARKDOWN_LEN = 120000;

function normalizeEvidenceMarkdownForPersistence(value) {
  const s = value == null ? "" : String(value);
  return s.slice(0, MAX_EVIDENCE_MARKDOWN_LEN);
}

module.exports = {
  MAX_EVIDENCE_MARKDOWN_LEN,
  normalizeEvidenceMarkdownForPersistence
};
