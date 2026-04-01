import { validateAndNormalizeConfig } from "./devDataConfig.js";
import {
  computeVolumeTotals,
  estimatedLoadFromTotalStories,
  isGenerationBlockedByVolume,
} from "./devDataLimits.js";

/**
 * Preview determinista derivado solo de config normalizada.
 * @param {object} config
 */
export function buildPreview(config) {
  const normalized = validateAndNormalizeConfig(config);
  const { volume, randomness } = normalized;
  const { totalFeatures, totalStories, totalSprints, totalIncidents } = computeVolumeTotals(volume);
  const blocked = isGenerationBlockedByVolume(volume);
  const estimatedLoad = estimatedLoadFromTotalStories(totalStories);
  const notes = [
    "Los conteos de historias son deterministas respecto al volumen.",
    "El import (`POST /projects/import`) solo persiste proyectos, features e historias; no crea sprints ni incidentes aunque el volumen los planifique.",
  ];
  if (Number(randomness.jitterPct) > 0) {
    notes.push("Textos y criterios pueden variar dentro del jitterPct configurado.");
  }
  return {
    totals: {
      projects: volume.projects,
      features: totalFeatures,
      stories: totalStories,
      sprints: totalSprints,
      incidents: totalIncidents,
    },
    estimatedLoad,
    blocked,
    notes,
  };
}
