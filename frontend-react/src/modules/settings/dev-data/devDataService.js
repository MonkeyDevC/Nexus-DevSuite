import { resetDummyData } from "../../../services/devToolsApiClient.js";
import { importProjects } from "../../../services/projectApiClient.js";
import { validateAndNormalizeConfig } from "./devDataConfig.js";
import { saveDevDataFeedback } from "./devDataConfig.js";
import { buildImportPayload } from "./buildImportPayload.js";

let executionBusy = false;
let runIdFallbackCounter = 0;

function generateRunId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  runIdFallbackCounter += 1;
  return `run-${Date.now()}-${runIdFallbackCounter}`;
}

function snapshotPreviewForFeedback(preview) {
  if (!preview || typeof preview !== "object") return null;
  return {
    totals: { ...preview.totals },
    estimatedLoad: preview.estimatedLoad,
    blocked: Boolean(preview.blocked),
  };
}

function isBusyError() {
  const err = new Error("Ya hay una ejecución en curso. Espere a que termine.");
  err.code = "DEV_DATA_BUSY";
  return err;
}

/**
 * @param {{ previewSnapshot?: object, feedbackAction?: "reset"|"autoReset" } | undefined} opts
 */
export async function runReset(opts) {
  if (executionBusy) throw isBusyError();
  executionBusy = true;
  const runId = generateRunId();
  const previewSnapshot = opts && opts.previewSnapshot ? snapshotPreviewForFeedback(opts.previewSnapshot) : null;
  const feedbackAction = opts && opts.feedbackAction === "autoReset" ? "autoReset" : "reset";
  try {
    await resetDummyData();
    const at = new Date().toISOString();
    saveDevDataFeedback({
      lastRunId: runId,
      lastRunAt: at,
      lastRunStatus: "success",
      lastAction: feedbackAction,
      lastError: null,
      lastSummary: null,
      lastPreview: previewSnapshot,
      phasesCompleted: null,
    });
    return { ok: true, runId };
  } catch (e) {
    const msg = e && e.message ? String(e.message) : "Error en reset";
    saveDevDataFeedback({
      lastRunId: runId,
      lastRunAt: new Date().toISOString(),
      lastRunStatus: "error",
      lastAction: feedbackAction,
      lastError: msg,
      lastSummary: null,
      lastPreview: previewSnapshot,
      phasesCompleted: null,
    });
    throw e;
  } finally {
    executionBusy = false;
  }
}

/**
 * Reset automático desde scheduler (mismo busy global; no lanza si hay ejecución usuario en curso).
 * @returns {Promise<{ ok?: boolean, skipped?: boolean, reason?: string }>}
 */
export async function runAutoResetFromScheduler() {
  if (executionBusy) {
    return { skipped: true, reason: "busy" };
  }
  try {
    await runReset({ feedbackAction: "autoReset" });
    return { ok: true };
  } catch {
    return { skipped: true, reason: "error" };
  }
}

/**
 * @param {{ config: object, previewSnapshot?: object }} opts
 */
export async function runGenerate(opts) {
  if (executionBusy) throw isBusyError();
  executionBusy = true;
  const runId = generateRunId();
  const normalized = validateAndNormalizeConfig(opts.config);
  const previewSnapshot = opts.previewSnapshot ? snapshotPreviewForFeedback(opts.previewSnapshot) : null;
  const exportedAt = new Date().toISOString();
  try {
    const payload = buildImportPayload(normalized, exportedAt);
    const summary = await importProjects(payload);
    saveDevDataFeedback({
      lastRunId: runId,
      lastRunAt: new Date().toISOString(),
      lastRunStatus: "success",
      lastAction: "generate",
      lastError: null,
      lastSummary: {
        projects_created: summary.projects_created,
        features_created: summary.features_created,
        stories_created: summary.stories_created,
        sprints_created: 0,
        incidents_created: 0,
      },
      lastPreview: previewSnapshot,
      phasesCompleted: null,
    });
    return { ok: true, runId, summary };
  } catch (e) {
    const msg = e && e.message ? String(e.message) : "Error en import";
    saveDevDataFeedback({
      lastRunId: runId,
      lastRunAt: new Date().toISOString(),
      lastRunStatus: "error",
      lastAction: "generate",
      lastError: msg,
      lastSummary: null,
      lastPreview: previewSnapshot,
      phasesCompleted: null,
    });
    throw e;
  } finally {
    executionBusy = false;
  }
}

/**
 * @param {{ config: object, previewSnapshot?: object }} opts
 */
export async function runResetThenGenerate(opts) {
  if (executionBusy) throw isBusyError();
  executionBusy = true;
  const runId = generateRunId();
  const normalized = validateAndNormalizeConfig(opts.config);
  const previewSnapshot = opts.previewSnapshot ? snapshotPreviewForFeedback(opts.previewSnapshot) : null;

  try {
    try {
      await resetDummyData();
    } catch (e) {
      const msg = e && e.message ? String(e.message) : "Error en reset";
      saveDevDataFeedback({
        lastRunId: runId,
        lastRunAt: new Date().toISOString(),
        lastRunStatus: "error",
        lastAction: "resetThenGenerate",
        lastError: `Fase reset fallida: ${msg}`,
        lastSummary: null,
        lastPreview: previewSnapshot,
        phasesCompleted: ["reset"],
      });
      throw e;
    }

    try {
      const exportedAt = new Date().toISOString();
      const payload = buildImportPayload(normalized, exportedAt);
      const summary = await importProjects(payload);
      saveDevDataFeedback({
        lastRunId: runId,
        lastRunAt: new Date().toISOString(),
        lastRunStatus: "success",
        lastAction: "resetThenGenerate",
        lastError: null,
        lastSummary: {
          projects_created: summary.projects_created,
          features_created: summary.features_created,
          stories_created: summary.stories_created,
          sprints_created: 0,
          incidents_created: 0,
        },
        lastPreview: previewSnapshot,
        phasesCompleted: ["reset", "generate"],
      });
      return { ok: true, runId, summary };
    } catch (e) {
      const msg = e && e.message ? String(e.message) : "Error en import";
      saveDevDataFeedback({
        lastRunId: runId,
        lastRunAt: new Date().toISOString(),
        lastRunStatus: "error",
        lastAction: "resetThenGenerate",
        lastError: `Reset OK, import fallido: ${msg}`,
        lastSummary: null,
        lastPreview: previewSnapshot,
        phasesCompleted: ["reset"],
      });
      throw e;
    }
  } finally {
    executionBusy = false;
  }
}

export function getExecutionBusy() {
  return executionBusy;
}
