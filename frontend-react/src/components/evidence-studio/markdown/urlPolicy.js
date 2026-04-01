/**
 * Política V2: imágenes y enlaces seguros.
 * Permitir: https:// y rutas relativas que empiecen por / (no //).
 */

export function isAllowedEvidenceUrl(url) {
  if (url == null || typeof url !== "string") return false;
  const u = url.trim();
  if (!u) return false;
  const lower = u.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return false;
  if (lower.startsWith("//")) return false;
  if (u.startsWith("/")) return true;
  if (lower.startsWith("https://")) return true;
  return false;
}
