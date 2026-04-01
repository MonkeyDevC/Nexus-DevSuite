import { validateAndNormalizeConfig } from "./devDataConfig.js";
import { isGenerationBlockedByVolume } from "./devDataLimits.js";
import { createSeededRng, nextUuid, randomIntInclusive } from "./devDataSeededRandom.js";

const IMPORT_PRIORITIES = ["MEDIUM", "LOW", "HIGH", "CRITICAL"];

function pickWeightedStatus(dist, rng) {
  const entries = Object.entries(dist).filter(([, w]) => w > 0);
  if (entries.length === 0) return Object.keys(dist)[0];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < entries.length; i += 1) {
    const [k, w] = entries[i];
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

function buildTextInRange(rng, minLen, maxLen, jitterPct, prefix) {
  const j = Math.max(0, Math.min(50, Number(jitterPct) || 0));
  const span = Math.max(0, maxLen - minLen);
  const delta = Math.round((span * j) / 100);
  const lo = Math.max(minLen, minLen - delta);
  const hi = Math.min(maxLen, maxLen + delta);
  const target = randomIntInclusive(rng, lo, hi);
  const base = String(prefix || "");
  const filler = "abcdefghijklmnopqrstuvwxyz0123456789 ";
  let s = base;
  while (s.length < target) {
    s += filler[randomIntInclusive(rng, 0, filler.length - 1)];
  }
  return s.slice(0, target);
}

function buildCriteriaList(rng, count, itemMin, itemMax, jitterPct, prefix) {
  const n = Math.max(0, count);
  const list = [];
  for (let i = 0; i < n; i += 1) {
    list.push(buildTextInRange(rng, itemMin, itemMax, jitterPct, `${prefix} ${i + 1}: `));
  }
  return list;
}

/**
 * @param {object} config
 * @param {string} exportedAtIso — generado fuera del builder (p.ej. en servicio).
 */
export function buildImportPayload(config, exportedAtIso) {
  const normalized = validateAndNormalizeConfig(config);
  if (isGenerationBlockedByVolume(normalized.volume)) {
    throw new Error("VOLUMEN_BLOQUEADO: demasiadas historias para generar (> 2000).");
  }
  const seed = normalized.randomness.seed;
  const jitterPct = normalized.randomness.jitterPct;
  const { volume, complexity, relationships } = normalized;
  const distProj = complexity.statusDistribution.project;
  const distFeat = complexity.statusDistribution.feature;
  const distStory = complexity.statusDistribution.story;

  const projectsOut = [];
  for (let p = 0; p < volume.projects; p += 1) {
    const rng = createSeededRng(seed, `proj:${p}`);
    const projectId = nextUuid(rng);
    const suffix = buildTextInRange(rng, 6, 10, 0, "").replace(/\s/g, "").slice(0, 8);
    const projectName = `[DEV-GEN] P${p + 1}-${suffix}`;
    const projectStatus = pickWeightedStatus(distProj, rng);
    const prAccept = buildCriteriaList(
      rng,
      complexity.criteria.projectAcceptanceCriteriaCount,
      complexity.criteria.criteriaItemMinLen,
      complexity.criteria.criteriaItemMaxLen,
      jitterPct,
      "CA proyecto"
    );
    const prImpl = buildCriteriaList(
      rng,
      complexity.criteria.projectImplementationCriteriaCount,
      complexity.criteria.criteriaItemMinLen,
      complexity.criteria.criteriaItemMaxLen,
      jitterPct,
      "CI proyecto"
    );

    const features = [];
    for (let f = 0; f < volume.featuresPerProject; f += 1) {
      const frng = createSeededRng(seed, `proj:${p}:feat:${f}`);
      const featTitle = buildTextInRange(
        frng,
        complexity.text.titleMinLen,
        complexity.text.titleMaxLen,
        jitterPct,
        `Feat ${p + 1}.${f + 1}`
      );
      const featDesc = buildTextInRange(
        frng,
        complexity.text.descriptionMinLen,
        complexity.text.descriptionMaxLen,
        jitterPct,
        "Descripción feature"
      );
      const featStatus = pickWeightedStatus(distFeat, frng);
      const featPriority = IMPORT_PRIORITIES[(p + f) % IMPORT_PRIORITIES.length];
      const fa = buildCriteriaList(
        frng,
        complexity.criteria.featureAcceptanceCriteriaCount,
        complexity.criteria.criteriaItemMinLen,
        complexity.criteria.criteriaItemMaxLen,
        jitterPct,
        "CA feature"
      );
      const fi = buildCriteriaList(
        frng,
        complexity.criteria.featureImplementationCriteriaCount,
        complexity.criteria.criteriaItemMinLen,
        complexity.criteria.criteriaItemMaxLen,
        jitterPct,
        "CI feature"
      );

      const stories = [];
      for (let s = 0; s < volume.storiesPerFeature; s += 1) {
        const srng = createSeededRng(seed, `proj:${p}:feat:${f}:story:${s}`);
        const stTitle = buildTextInRange(
          srng,
          complexity.text.titleMinLen,
          complexity.text.titleMaxLen,
          jitterPct,
          `Historia ${p + 1}.${f + 1}.${s + 1}`
        );
        const stDesc = buildTextInRange(
          srng,
          complexity.text.descriptionMinLen,
          complexity.text.descriptionMaxLen,
          jitterPct,
          "Descripción historia"
        );
        const stStatus = pickWeightedStatus(distStory, srng);
        const stPriority = IMPORT_PRIORITIES[(p + f + s) % IMPORT_PRIORITIES.length];
        const sa = buildCriteriaList(
          srng,
          complexity.criteria.storyAcceptanceCriteriaCount,
          complexity.criteria.criteriaItemMinLen,
          complexity.criteria.criteriaItemMaxLen,
          jitterPct,
          "CA historia"
        );
        const si = buildCriteriaList(
          srng,
          complexity.criteria.storyImplementationCriteriaCount,
          complexity.criteria.criteriaItemMinLen,
          complexity.criteria.criteriaItemMaxLen,
          jitterPct,
          "CI historia"
        );
        const storyObj = {
          title: stTitle,
          description: stDesc,
          status: stStatus,
          priority: stPriority,
          acceptance_criteria: sa.length ? sa : [],
          implementation_criteria: si.length ? si : [],
          assigned_to: relationships.assignStoryAssignees ? null : null,
          sprint_id: relationships.linkStoriesToSprints ? null : null,
        };
        stories.push(storyObj);
      }

      features.push({
        title: featTitle,
        description: featDesc,
        status: featStatus,
        priority: featPriority,
        acceptance_criteria: fa.length ? fa : [],
        implementation_criteria: fi.length ? fi : [],
        stories,
      });
    }

    projectsOut.push({
      project: {
        id: projectId,
        name: projectName,
        description: buildTextInRange(
          rng,
          complexity.text.descriptionMinLen,
          complexity.text.descriptionMaxLen,
          jitterPct,
          "Proyecto generado DEV"
        ),
        status: projectStatus,
        acceptance_criteria: prAccept.length ? prAccept : [],
        implementation_criteria: prImpl.length ? prImpl : [],
      },
      features,
    });
  }

  return {
    exported_at: String(exportedAtIso || ""),
    projects: projectsOut,
  };
}
