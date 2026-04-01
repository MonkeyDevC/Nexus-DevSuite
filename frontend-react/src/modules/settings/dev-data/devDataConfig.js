/**
 * SSOT config + feedback storage para Data Generation Control Panel (DEV).
 * Persistencia: localStorage única; toda escritura pasa por validateAndNormalizeConfig.
 */

import {
  MAX_FEATURES_PER_PROJECT,
  MAX_INCIDENTS_PER_PROJECT,
  MAX_PROJECTS,
  MAX_SPRINTS_PER_PROJECT,
  MAX_STORIES_PER_FEATURE,
  MIN_AUTO_RESET_INTERVAL_MINUTES,
} from "./devDataLimits.js";

export const DEV_DATA_CONFIG_STORAGE_KEY = "nexus.dev.dataGeneration.config";
export const DEV_DATA_FEEDBACK_STORAGE_KEY = "nexus.dev.dataGeneration.feedback";

/** Legacy (pre módulo): scheduler + panel simple. */
export const LEGACY_DEV_DATA_RESET_STORAGE_KEY = "nexus.dev.dataReset";

const CONFIG_VERSION = 1;

function clampInt(n, min, max) {
  const x = Math.trunc(Number(n));
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

function normalizePercentDistribution(raw, keys, fallbackEqual) {
  const out = {};
  let sum = 0;
  keys.forEach((k) => {
    const v = clampInt(raw && raw[k] != null ? raw[k] : fallbackEqual, 0, 100);
    out[k] = v;
    sum += v;
  });
  if (sum === 0) {
    const eq = Math.floor(100 / keys.length);
    keys.forEach((k, i) => {
      out[k] = i === keys.length - 1 ? 100 - eq * (keys.length - 1) : eq;
    });
    return out;
  }
  if (sum !== 100) {
    const factor = 100 / sum;
    let acc = 0;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        out[k] = 100 - acc;
      } else {
        const nv = Math.round(out[k] * factor);
        out[k] = nv;
        acc += nv;
      }
    });
  }
  return out;
}

export const DEFAULT_DEV_DATA_CONFIG = {
  version: CONFIG_VERSION,
  preset: "balanced",
  autoReset: {
    enabled: false,
    intervalMinutes: 0,
    runOnAppStart: false,
    minIntervalMinutes: MIN_AUTO_RESET_INTERVAL_MINUTES,
  },
  execution: {
    resetBeforeGenerate: false,
    requireConfirmOnMedium: true,
    requireConfirmOnHigh: true,
  },
  volume: {
    projects: 1,
    featuresPerProject: 3,
    storiesPerFeature: 5,
    sprintsPerProject: 1,
    incidentsPerProject: 0,
  },
  complexity: {
    text: {
      titleMinLen: 8,
      titleMaxLen: 80,
      descriptionMinLen: 20,
      descriptionMaxLen: 400,
    },
    criteria: {
      projectAcceptanceCriteriaCount: 2,
      projectImplementationCriteriaCount: 1,
      featureAcceptanceCriteriaCount: 2,
      featureImplementationCriteriaCount: 1,
      storyAcceptanceCriteriaCount: 2,
      storyImplementationCriteriaCount: 1,
      criteriaItemMinLen: 8,
      criteriaItemMaxLen: 120,
    },
    statusDistribution: {
      project: { ACTIVE: 100, ARCHIVED: 0 },
      feature: {
        DRAFT: 20,
        APPROVED: 20,
        IN_PROGRESS: 20,
        DONE: 20,
        ARCHIVED: 20,
      },
      story: {
        DRAFT: 20,
        READY: 15,
        IN_PROGRESS: 15,
        BLOCKED: 10,
        IN_REVIEW: 10,
        DONE: 20,
        ARCHIVED: 10,
      },
    },
  },
  relationships: {
    linkStoriesToSprints: false,
    linkFeaturesToReleases: false,
    assignStoryAssignees: false,
    enforceScrumInvariants: true,
  },
  randomness: {
    seed: "nexus-dev",
    deterministic: true,
    jitterPct: 10,
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {unknown} raw
 * @param {{ markPreset?: string } | undefined} options — si `markPreset: 'custom'`, fuerza preset custom tras merge
 */
export function validateAndNormalizeConfig(raw, options) {
  const markPreset = options && options.markPreset;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return deepClone(DEFAULT_DEV_DATA_CONFIG);
  }

  const d = DEFAULT_DEV_DATA_CONFIG;
  const v = clampInt(raw.version, 1, 999);
  const presetAllowed = new Set(["balanced", "small", "large", "edge", "custom"]);
  let preset = presetAllowed.has(String(raw.preset)) ? String(raw.preset) : d.preset;

  const ar = raw.autoReset && typeof raw.autoReset === "object" ? raw.autoReset : {};
  const autoReset = {
    enabled: Boolean(ar.enabled),
    intervalMinutes: clampInt(ar.intervalMinutes, 0, 24 * 60),
    runOnAppStart: false,
    minIntervalMinutes: MIN_AUTO_RESET_INTERVAL_MINUTES,
  };
  if (autoReset.enabled && autoReset.intervalMinutes > 0) {
    autoReset.intervalMinutes = Math.max(autoReset.intervalMinutes, MIN_AUTO_RESET_INTERVAL_MINUTES);
  }

  const ex = raw.execution && typeof raw.execution === "object" ? raw.execution : {};
  const execution = {
    resetBeforeGenerate: Boolean(ex.resetBeforeGenerate),
    requireConfirmOnMedium: ex.requireConfirmOnMedium !== false,
    requireConfirmOnHigh: ex.requireConfirmOnHigh !== false,
  };

  const vol = raw.volume && typeof raw.volume === "object" ? raw.volume : {};
  const volume = {
    projects: clampInt(vol.projects != null ? vol.projects : d.volume.projects, 1, MAX_PROJECTS),
    featuresPerProject: clampInt(
      vol.featuresPerProject != null ? vol.featuresPerProject : d.volume.featuresPerProject,
      0,
      MAX_FEATURES_PER_PROJECT
    ),
    storiesPerFeature: clampInt(
      vol.storiesPerFeature != null ? vol.storiesPerFeature : d.volume.storiesPerFeature,
      0,
      MAX_STORIES_PER_FEATURE
    ),
    sprintsPerProject: clampInt(
      vol.sprintsPerProject != null ? vol.sprintsPerProject : d.volume.sprintsPerProject,
      0,
      MAX_SPRINTS_PER_PROJECT
    ),
    incidentsPerProject: clampInt(
      vol.incidentsPerProject != null ? vol.incidentsPerProject : d.volume.incidentsPerProject,
      0,
      MAX_INCIDENTS_PER_PROJECT
    ),
  };

  const cx = raw.complexity && typeof raw.complexity === "object" ? raw.complexity : {};
  const tx = cx.text && typeof cx.text === "object" ? cx.text : {};
  const cr = cx.criteria && typeof cx.criteria === "object" ? cx.criteria : {};
  const sd = cx.statusDistribution && typeof cx.statusDistribution === "object" ? cx.statusDistribution : {};

  const dc = d.complexity.criteria;
  const complexity = {
    text: {
      titleMinLen: clampInt(tx.titleMinLen != null ? tx.titleMinLen : d.complexity.text.titleMinLen, 1, 200),
      titleMaxLen: clampInt(tx.titleMaxLen != null ? tx.titleMaxLen : d.complexity.text.titleMaxLen, 1, 300),
      descriptionMinLen: clampInt(
        tx.descriptionMinLen != null ? tx.descriptionMinLen : d.complexity.text.descriptionMinLen,
        1,
        2000
      ),
      descriptionMaxLen: clampInt(
        tx.descriptionMaxLen != null ? tx.descriptionMaxLen : d.complexity.text.descriptionMaxLen,
        1,
        50000
      ),
    },
    criteria: {
      projectAcceptanceCriteriaCount: clampInt(
        cr.projectAcceptanceCriteriaCount != null ? cr.projectAcceptanceCriteriaCount : dc.projectAcceptanceCriteriaCount,
        0,
        50
      ),
      projectImplementationCriteriaCount: clampInt(
        cr.projectImplementationCriteriaCount != null ? cr.projectImplementationCriteriaCount : dc.projectImplementationCriteriaCount,
        0,
        50
      ),
      featureAcceptanceCriteriaCount: clampInt(
        cr.featureAcceptanceCriteriaCount != null ? cr.featureAcceptanceCriteriaCount : dc.featureAcceptanceCriteriaCount,
        0,
        50
      ),
      featureImplementationCriteriaCount: clampInt(
        cr.featureImplementationCriteriaCount != null ? cr.featureImplementationCriteriaCount : dc.featureImplementationCriteriaCount,
        0,
        50
      ),
      storyAcceptanceCriteriaCount: clampInt(
        cr.storyAcceptanceCriteriaCount != null ? cr.storyAcceptanceCriteriaCount : dc.storyAcceptanceCriteriaCount,
        0,
        50
      ),
      storyImplementationCriteriaCount: clampInt(
        cr.storyImplementationCriteriaCount != null ? cr.storyImplementationCriteriaCount : dc.storyImplementationCriteriaCount,
        0,
        50
      ),
      criteriaItemMinLen: clampInt(
        cr.criteriaItemMinLen != null ? cr.criteriaItemMinLen : dc.criteriaItemMinLen,
        1,
        500
      ),
      criteriaItemMaxLen: clampInt(
        cr.criteriaItemMaxLen != null ? cr.criteriaItemMaxLen : dc.criteriaItemMaxLen,
        1,
        2000
      ),
    },
    statusDistribution: {
      project: normalizePercentDistribution(sd.project || d.complexity.statusDistribution.project, ["ACTIVE", "ARCHIVED"], 50),
      feature: normalizePercentDistribution(sd.feature || d.complexity.statusDistribution.feature, [
        "DRAFT",
        "APPROVED",
        "IN_PROGRESS",
        "DONE",
        "ARCHIVED",
      ], 20),
      story: normalizePercentDistribution(sd.story || d.complexity.statusDistribution.story, [
        "DRAFT",
        "READY",
        "IN_PROGRESS",
        "BLOCKED",
        "IN_REVIEW",
        "DONE",
        "ARCHIVED",
      ], 14),
    },
  };

  if (complexity.text.titleMaxLen < complexity.text.titleMinLen) {
    complexity.text.titleMaxLen = complexity.text.titleMinLen;
  }
  if (complexity.text.descriptionMaxLen < complexity.text.descriptionMinLen) {
    complexity.text.descriptionMaxLen = complexity.text.descriptionMinLen;
  }
  if (complexity.criteria.criteriaItemMaxLen < complexity.criteria.criteriaItemMinLen) {
    complexity.criteria.criteriaItemMaxLen = complexity.criteria.criteriaItemMinLen;
  }

  const rel = raw.relationships && typeof raw.relationships === "object" ? raw.relationships : {};
  const relationships = {
    linkStoriesToSprints: Boolean(rel.linkStoriesToSprints),
    linkFeaturesToReleases: Boolean(rel.linkFeaturesToReleases),
    assignStoryAssignees: Boolean(rel.assignStoryAssignees),
    enforceScrumInvariants: true,
  };

  const rnd = raw.randomness && typeof raw.randomness === "object" ? raw.randomness : {};
  const seedStr = rnd.seed != null && String(rnd.seed).trim() !== "" ? String(rnd.seed).trim() : d.randomness.seed;
  const randomness = {
    seed: seedStr.slice(0, 200),
    deterministic: true,
    jitterPct: clampInt(rnd.jitterPct != null ? rnd.jitterPct : d.randomness.jitterPct, 0, 50),
  };

  if (markPreset === "custom") {
    preset = "custom";
  }

  return {
    version: v,
    preset,
    autoReset,
    execution,
    volume,
    complexity,
    relationships,
    randomness,
  };
}

function tryMigrateLegacyConfig() {
  try {
    const legacy = window.localStorage.getItem(LEGACY_DEV_DATA_RESET_STORAGE_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy);
    const base = deepClone(DEFAULT_DEV_DATA_CONFIG);
    base.autoReset.enabled = Boolean(parsed && parsed.enabled);
    base.autoReset.intervalMinutes = clampInt(parsed && parsed.intervalMinutes, 0, 24 * 60);
    base.autoReset.runOnAppStart = false;
    base.preset = "custom";
    return validateAndNormalizeConfig(base);
  } catch {
    return null;
  }
}

export function loadDevDataConfig() {
  try {
    const raw = window.localStorage.getItem(DEV_DATA_CONFIG_STORAGE_KEY);
    if (!raw) {
      const migrated = tryMigrateLegacyConfig();
      if (migrated) {
        saveDevDataConfig(migrated);
        return migrated;
      }
      return deepClone(DEFAULT_DEV_DATA_CONFIG);
    }
    const parsed = JSON.parse(raw);
    return validateAndNormalizeConfig(parsed);
  } catch {
    return deepClone(DEFAULT_DEV_DATA_CONFIG);
  }
}

export function saveDevDataConfig(next, options) {
  const normalized = validateAndNormalizeConfig(next, options);
  try {
    window.localStorage.setItem(DEV_DATA_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
    try {
      window.dispatchEvent(new CustomEvent("nexus-dev-data-config-changed"));
    } catch {
      // ignore
    }
  } catch {
    // ignore quota
  }
  return normalized;
}

export function createEmptyFeedback() {
  return {
    lastRunId: null,
    lastRunAt: null,
    lastRunStatus: "idle",
    lastAction: "none",
    lastError: null,
    lastSummary: null,
    lastPreview: null,
    phasesCompleted: null,
  };
}

export function loadDevDataFeedback() {
  try {
    const raw = window.localStorage.getItem(DEV_DATA_FEEDBACK_STORAGE_KEY);
    if (!raw) return createEmptyFeedback();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return createEmptyFeedback();
    return {
      ...createEmptyFeedback(),
      ...parsed,
    };
  } catch {
    return createEmptyFeedback();
  }
}

export function saveDevDataFeedback(next) {
  const merged = { ...createEmptyFeedback(), ...next };
  try {
    window.localStorage.setItem(DEV_DATA_FEEDBACK_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
  return merged;
}
