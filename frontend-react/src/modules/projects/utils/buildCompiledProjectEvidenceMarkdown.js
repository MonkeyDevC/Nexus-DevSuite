/**
 * Arma un único markdown de evidencia del proyecto a partir de features e historias (solo lectura en UI).
 * Usa encabezados Markdown (# / ##) para que la vista previa muestre jerarquía clara (tipo Word / menú).
 */

function padCodeNum(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "00";
  return String(Math.trunc(x)).padStart(2, "0");
}

/** @param {{ id?: string, number?: number | null }} feature */
export function formatFeatureEvidenceCode(feature) {
  const n = feature?.number != null ? Number(feature.number) : null;
  if (n != null && Number.isFinite(n)) return `FT-${padCodeNum(n)}`;
  const id = feature?.id != null ? String(feature.id).trim() : "";
  return id ? `FT-${id.slice(0, 8)}` : "FT-—";
}

/** @param {{ id?: string, number?: number | null }} story */
export function formatStoryEvidenceCode(story) {
  const n = story?.number != null ? Number(story.number) : null;
  if (n != null && Number.isFinite(n)) return `US-${padCodeNum(n)}`;
  const id = story?.id != null ? String(story.id).trim() : "";
  return id ? `US-${id.slice(0, 8)}` : "US-—";
}

function trimEvidenceBody(value) {
  return String(value ?? "").trim();
}

/**
 * @param {Array<object>} features — DTOs con id, number, evidence_markdown
 * @param {Map<string, object[]>} storiesByFeatureId — feature id → historias ordenables por number
 * @returns {string}
 */
export function buildCompiledProjectEvidenceMarkdown(features, storiesByFeatureId) {
  const list = Array.isArray(features) ? [...features] : [];
  list.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

  if (list.length === 0) {
    return "_No hay features en este proyecto; no hay evidencia que agrupar._";
  }

  const chunks = [];

  for (let fi = 0; fi < list.length; fi += 1) {
    const feature = list[fi];
    const ft = formatFeatureEvidenceCode(feature);
    chunks.push(`# Evidencia ${ft}`);
    chunks.push("");
    const featureBody = trimEvidenceBody(feature.evidence_markdown);
    chunks.push(featureBody || "_Sin evidencia en esta feature._");
    chunks.push("");

    const storiesRaw = storiesByFeatureId.get(String(feature.id)) || [];
    const stories = Array.isArray(storiesRaw) ? [...storiesRaw] : [];
    stories.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

    for (const story of stories) {
      const us = formatStoryEvidenceCode(story);
      chunks.push(`## Historia ${us}`);
      chunks.push("");
      const storyBody = trimEvidenceBody(story.evidence_markdown);
      chunks.push(storyBody || "_Sin evidencia en esta historia._");
      chunks.push("");
    }

    if (fi < list.length - 1) {
      chunks.push("---");
      chunks.push("");
    }
  }

  return chunks.join("\n").replace(/\n+$/, "");
}
