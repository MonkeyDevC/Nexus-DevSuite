/**
 * Preview seguro sin motor Markdown: escape HTML + salto de línea preservado (pre-wrap en CSS).
 */
export function escapeHtmlForEvidencePreview(text) {
  const s = text == null ? "" : String(text);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
