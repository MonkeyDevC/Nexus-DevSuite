/**
 * @param {string | undefined} status
 * @returns {"success"|"warning"|"danger"|"neutral"}
 */
export function badgeVariantForDocStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "ACTIVE" || s === "APPROVED" || s === "COMMITTED" || s === "MERGED") return "success";
  if (s === "DRAFT" || s === "PREPARING") return "warning";
  if (s === "ARCHIVED" || s === "DELETED") return "neutral";
  return "neutral";
}
