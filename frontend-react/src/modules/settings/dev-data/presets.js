import { DEFAULT_DEV_DATA_CONFIG, validateAndNormalizeConfig } from "./devDataConfig.js";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function base() {
  return deepClone(DEFAULT_DEV_DATA_CONFIG);
}

/** Snapshots completos por id de preset (sin feedback). */
const SNAPSHOTS = {
  balanced: (() => {
    const c = base();
    c.preset = "balanced";
    return validateAndNormalizeConfig(c);
  })(),
  small: (() => {
    const c = base();
    c.preset = "small";
    c.volume.projects = 1;
    c.volume.featuresPerProject = 2;
    c.volume.storiesPerFeature = 3;
    c.volume.sprintsPerProject = 0;
    c.volume.incidentsPerProject = 0;
    c.complexity.criteria.projectAcceptanceCriteriaCount = 1;
    c.complexity.criteria.featureAcceptanceCriteriaCount = 1;
    c.complexity.criteria.storyAcceptanceCriteriaCount = 1;
    return validateAndNormalizeConfig(c);
  })(),
  large: (() => {
    const c = base();
    c.preset = "large";
    c.volume.projects = 5;
    c.volume.featuresPerProject = 8;
    c.volume.storiesPerFeature = 8;
    c.volume.sprintsPerProject = 2;
    c.volume.incidentsPerProject = 0;
    c.randomness.jitterPct = 15;
    return validateAndNormalizeConfig(c);
  })(),
  edge: (() => {
    const c = base();
    c.preset = "edge";
    c.volume.projects = 2;
    c.volume.featuresPerProject = 10;
    c.volume.storiesPerFeature = 30;
    c.volume.sprintsPerProject = 0;
    c.volume.incidentsPerProject = 0;
    return validateAndNormalizeConfig(c);
  })(),
};

/**
 * Aplica preset: sobrescribe config completo (no merge parcial).
 * @param {"balanced"|"small"|"large"|"edge"} presetId
 */
export function applyPreset(presetId) {
  const snap = SNAPSHOTS[presetId];
  if (!snap) return validateAndNormalizeConfig(base());
  return validateAndNormalizeConfig(deepClone(snap));
}

export const PRESET_IDS = ["balanced", "small", "large", "edge"];
