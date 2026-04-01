/**
 * ----
 * Módulo: AI Review Prompts
 * Descripción: Construye prompts deterministas para revisión de código basada en diff.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

function truncate(text, maxLen) {
  const value = typeof text === "string" ? text : "";
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen) + "\n... [TRUNCATED]";
}

function generateCodeReviewPrompt(diffPayload = {}) {
  const baseCommit = diffPayload.base_commit_hash || "unknown";
  const filesSummary = Array.isArray(diffPayload.summary)
    ? diffPayload.summary.map((f) => `- ${f.path || "unknown"} (${f.status || "unknown"})`).join("\n")
    : "- No file summary";
  const diff = truncate(diffPayload.diff || "", 12000);

  return [
    "Eres un revisor de código senior para un sistema enterprise auditado.",
    "Devuelve EXCLUSIVAMENTE JSON válido con este shape:",
    "{",
    '  "summary": "string",',
    '  "issues": [{"title":"string","severity":"low|medium|high","detail":"string"}],',
    '  "security_warnings": [{"title":"string","detail":"string"}],',
    '  "improvements": [{"title":"string","detail":"string"}],',
    '  "risk_level": "low|medium|high"',
    "}",
    "",
    `BASE_COMMIT: ${baseCommit}`,
    "FILES:",
    filesSummary,
    "",
    "DIFF:",
    diff
  ].join("\n");
}

module.exports = {
  generateCodeReviewPrompt
};
