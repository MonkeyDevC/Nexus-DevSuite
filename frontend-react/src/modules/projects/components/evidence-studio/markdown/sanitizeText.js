/**
 * Escape HTML para texto plano mostrado o procesado de forma segura.
 */
export function sanitizeText(text) {
  const s = text == null ? "" : String(text);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
