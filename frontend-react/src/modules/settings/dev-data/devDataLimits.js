/** Límites y umbrales (contrato plan — sin ambigüedad). */

export const MAX_PROJECTS = 20;
export const MAX_FEATURES_PER_PROJECT = 50;
export const MAX_STORIES_PER_FEATURE = 200;
export const MAX_SPRINTS_PER_PROJECT = 20;
export const MAX_INCIDENTS_PER_PROJECT = 200;

export const MIN_AUTO_RESET_INTERVAL_MINUTES = 1;

/** Sin confirmación extra (además de reglas específicas de reset). */
export const STORIES_SOFT_CAP = 500;

/** Requiere modal de confirmación. */
export const STORIES_CONFIRM_CAP = 2000;

/** Bloqueo absoluto de Generate. */
export const STORIES_HARD_CAP = 2000;

export function computeVolumeTotals(volume) {
  const projects = Math.max(0, Number(volume?.projects) || 0);
  const featuresPerProject = Math.max(0, Number(volume?.featuresPerProject) || 0);
  const storiesPerFeature = Math.max(0, Number(volume?.storiesPerFeature) || 0);
  const totalFeatures = projects * featuresPerProject;
  const totalStories = totalFeatures * storiesPerFeature;
  const totalSprints = projects * Math.max(0, Number(volume?.sprintsPerProject) || 0);
  const totalIncidents = projects * Math.max(0, Number(volume?.incidentsPerProject) || 0);
  return { totalFeatures, totalStories, totalSprints, totalIncidents };
}

export function estimatedLoadFromTotalStories(totalStories) {
  const t = Number(totalStories) || 0;
  if (t <= 200) return "low";
  if (t <= 1000) return "medium";
  return "high";
}

export function isGenerationBlockedByVolume(volume) {
  const { totalStories } = computeVolumeTotals(volume);
  return totalStories > STORIES_HARD_CAP;
}

export function requiresConfirmForVolume(volume) {
  const { totalStories } = computeVolumeTotals(volume);
  return totalStories > STORIES_SOFT_CAP && totalStories <= STORIES_CONFIRM_CAP;
}
