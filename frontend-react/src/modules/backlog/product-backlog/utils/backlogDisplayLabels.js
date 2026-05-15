/**
 * Etiquetas de presentación (wireframe Product Backlog) — sin lógica de negocio.
 */

import { getPrimaryQualityFinding } from "./backlogQuality.js";

/** @param {string} code */
export function refinementStatusDisplayLabel(code) {
  const c = code != null ? String(code).trim().toUpperCase() : "";
  const map = {
    IDEA: "Idea",
    DRAFT: "Borrador",
    REFINED: "Refinado",
    READY: "Listo",
  };
  return map[c] || c || "Borrador";
}

/** @param {string} code */
export function itemTypeDisplayLabel(code) {
  const c = code != null ? String(code).trim().toUpperCase() : "";
  const map = {
    STORY: "Historia",
    BUG: "Bug",
    TECH_TASK: "Tarea técnica",
    IMPROVEMENT: "Mejora",
  };
  return map[c] || c || "Historia";
}

/**
 * Texto corto para columna Calidad (wireframe: OK / Grooming / Bajo).
 * @param {import("./normalizeProductBacklog.js").NormalizedStory} story
 */
export function qualityColumnLabel(story) {
  const primary = getPrimaryQualityFinding(story);
  if (!primary) return "OK";
  if (primary.severity === "critical") return "Bajo";
  if (primary.severity === "warning") return "Grooming";
  return "Grooming";
}
