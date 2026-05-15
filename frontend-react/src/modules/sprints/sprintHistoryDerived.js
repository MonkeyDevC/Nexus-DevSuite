/**
 * Derivación pura: historial de sprints (view models, validación, métricas UI).
 * @see plan vista_historial_sprints — no mezclar campos backend crudos en JSX.
 */

import { logDev } from "../../shared/cache/domainWorkCache.js";

const IS_DEV = Boolean(import.meta.env?.DEV);
import {
  compareIsoDates,
  formatSprintPeriodShort,
  inclusiveDayCountIso,
  parseIsoDateToUTCStart,
  formatDateAsIsoLocal,
} from "./sprintDateUtils.js";

/** @typedef {"MISSING_START"|"MISSING_END"|"RANGE_INVERTED"|"COMPLETED_WITH_FUTURE_WINDOW"|"INVALID_SHAPE"} SprintDateValidationCode */

/**
 * @typedef {object} SprintDateValidation
 * @property {boolean} ok
 * @property {SprintDateValidationCode} [code]
 */

/**
 * @typedef {object} SprintMetricsUI
 * @property {number} storiesTotal
 * @property {number} storiesDone
 * @property {number} pointsTotal
 * @property {number} pointsDone
 * @property {number} progressPercent 0-100 por conteo de historias
 */

/**
 * @typedef {"idle"|"loading"|"success"|"error"} MetricsEntryStatus
 */

/**
 * @typedef {object} SprintMetricsEntry
 * @property {MetricsEntryStatus} status
 * @property {SprintMetricsUI} [data]
 * @property {string} [errorMessage]
 */

/**
 * @typedef {Record<string, SprintMetricsEntry>} SprintMetricsState
 */

/**
 * @typedef {object} SprintRowViewModel
 * @property {string} id
 * @property {string} name
 * @property {"PLANNED"|"IN_PROGRESS"|"CLOSED"} statusApi
 * @property {"PLANNED"|"IN_PROGRESS"|"COMPLETED"} statusBadgeLabel
 * @property {SprintDateValidation} dateValidation
 * @property {string|null} periodLabel
 * @property {number|null} durationDays
 * @property {string|null} startIso — YYYY-MM-DD o null si fechas inválidas
 * @property {string|null} endIso
 * @property {SprintMetricsUI|null} metrics
 * @property {MetricsEntryStatus} metricsStatus
 * @property {string} [metricsErrorMessage]
 * @property {boolean} suppressProgress
 */

/**
 * @param {object} sprint — dto lista (start_date, end_date, status, id)
 * @param {{ now: Date }} ctx
 * @returns {SprintDateValidation}
 */
export function validateSprintDates(sprint, { now }) {
  if (!sprint || typeof sprint !== "object") {
    return { ok: false, code: "INVALID_SHAPE" };
  }
  const startRaw = sprint.start_date != null ? String(sprint.start_date).trim().slice(0, 10) : "";
  const endRaw = sprint.end_date != null ? String(sprint.end_date).trim().slice(0, 10) : "";
  if (!startRaw) {
    if (IS_DEV && sprint.id) {
      logDev("[Sprints] validateSprintDates", { id: sprint.id, code: "MISSING_START" });
    }
    return { ok: false, code: "MISSING_START" };
  }
  if (!endRaw) {
    if (IS_DEV && sprint.id) {
      logDev("[Sprints] validateSprintDates", { id: sprint.id, code: "MISSING_END" });
    }
    return { ok: false, code: "MISSING_END" };
  }
  const startParsed = parseIsoDateToUTCStart(startRaw);
  const endParsed = parseIsoDateToUTCStart(endRaw);
  if (!startParsed || !endParsed) {
    if (IS_DEV && sprint.id) {
      logDev("[Sprints] validateSprintDates", { id: sprint.id, code: "INVALID_SHAPE" });
    }
    return { ok: false, code: "INVALID_SHAPE" };
  }
  if (compareIsoDates(endRaw, startRaw) < 0) {
    if (IS_DEV && sprint.id) {
      logDev("[Sprints] validateSprintDates", { id: sprint.id, code: "RANGE_INVERTED" });
    }
    return { ok: false, code: "RANGE_INVERTED" };
  }
  const status = sprint.status != null ? String(sprint.status).trim() : "";
  const todayIso = formatDateAsIsoLocal(now instanceof Date ? now : new Date());
  if (status === "CLOSED" && todayIso && compareIsoDates(endRaw, todayIso) > 0) {
    if (IS_DEV && sprint.id) {
      logDev("[Sprints] validateSprintDates", { id: sprint.id, code: "COMPLETED_WITH_FUTURE_WINDOW" });
    }
    return { ok: false, code: "COMPLETED_WITH_FUTURE_WINDOW" };
  }
  return { ok: true };
}

/**
 * @param {object} summary — respuesta unwrap getSprintSummary
 * @returns {SprintMetricsUI|null}
 */
export function mapSprintSummaryToMetrics(summary) {
  if (!summary || typeof summary !== "object") return null;
  const storiesTotal = Math.max(0, Number(summary.stories_count) || 0);
  const storiesDone = Math.max(0, Number(summary.stories_done_count) || 0);
  const pointsTotal = Math.max(0, Number(summary.total_story_points) || 0);
  const pointsDone = Math.max(0, Number(summary.completed_story_points) || 0);
  const progressPercent =
    storiesTotal > 0 ? Math.min(100, Math.round((storiesDone / storiesTotal) * 100)) : 0;
  return {
    storiesTotal,
    storiesDone,
    pointsTotal,
    pointsDone,
    progressPercent,
  };
}

/**
 * @param {string|undefined|null} apiStatus
 * @returns {"PLANNED"|"IN_PROGRESS"|"CLOSED"}
 */
export function normalizeSprintStatusApi(apiStatus) {
  const s = apiStatus != null ? String(apiStatus).trim() : "";
  if (s === "IN_PROGRESS" || s === "PLANNED" || s === "CLOSED") return s;
  if (IS_DEV && apiStatus != null && String(apiStatus).trim() !== "") {
    logDev("[Sprints] normalizeSprintStatusApi → PLANNED (valor API no reconocido)", { raw: apiStatus });
  }
  return "PLANNED";
}

/**
 * @param {"PLANNED"|"IN_PROGRESS"|"CLOSED"} statusApi
 * @returns {number}
 */
export function sprintStatusSortRank(statusApi) {
  if (statusApi === "IN_PROGRESS") return 0;
  if (statusApi === "PLANNED") return 1;
  return 2;
}

/**
 * @param {object[]} baseSprints — dto lista
 * @param {SprintMetricsState} sprintMetricsState
 * @param {{ now: Date }} ctx
 * @returns {SprintRowViewModel[]}
 */
export function buildSprintRowViewModels(baseSprints, sprintMetricsState, { now }) {
  const list = Array.isArray(baseSprints) ? baseSprints : [];
  return list.map((sp) => {
    const id = sp.id != null ? String(sp.id).trim() : "";
    const name = sp.name != null ? String(sp.name).trim() : "—";
    const statusApi = normalizeSprintStatusApi(sp.status);
    const statusBadgeLabel =
      statusApi === "CLOSED" ? "COMPLETED" : statusApi === "IN_PROGRESS" ? "IN_PROGRESS" : "PLANNED";
    const dateValidation = validateSprintDates(sp, { now });
    const startRaw = sp.start_date != null ? String(sp.start_date).trim().slice(0, 10) : "";
    const endRaw = sp.end_date != null ? String(sp.end_date).trim().slice(0, 10) : "";
    const periodLabel = dateValidation.ok ? formatSprintPeriodShort(startRaw, endRaw) : null;
    const durationDays = dateValidation.ok ? inclusiveDayCountIso(startRaw, endRaw) : null;
    const startIso = dateValidation.ok ? startRaw : null;
    const endIso = dateValidation.ok ? endRaw : null;
    const entry = id ? sprintMetricsState[id] : undefined;
    const metricsStatus = entry?.status ?? "idle";
    const metrics = entry?.status === "success" && entry.data ? entry.data : null;
    const metricsErrorMessage = entry?.status === "error" ? entry.errorMessage : undefined;
    const suppressProgress =
      !dateValidation.ok ||
      metricsStatus === "loading" ||
      metricsStatus === "idle" ||
      metricsStatus === "error" ||
      metrics === null;

    return {
      id,
      name,
      statusApi,
      statusBadgeLabel,
      dateValidation,
      periodLabel,
      durationDays,
      startIso,
      endIso,
      metrics,
      metricsStatus,
      metricsErrorMessage,
      suppressProgress,
    };
  });
}

/**
 * @typedef {object} SprintHistoryFilters
 * @property {string} search
 * @property {""|"PLANNED"|"IN_PROGRESS"|"CLOSED"} status
 * @property {"all"|"intersects_today"} datePreset
 */

/**
 * @param {SprintRowViewModel[]} viewModels
 * @param {SprintHistoryFilters} filters
 * @param {{ todayIso: string }} ctx
 * @returns {SprintRowViewModel[]}
 */
export function filterAndSortSprintRows(viewModels, filters, { todayIso }) {
  const q = filters.search != null ? String(filters.search).trim().toLowerCase() : "";
  const st = filters.status != null ? String(filters.status).trim() : "";
  const datePreset = filters.datePreset === "intersects_today" ? "intersects_today" : "all";

  let rows = Array.isArray(viewModels) ? [...viewModels] : [];

  if (q) {
    rows = rows.filter((r) => r.name.toLowerCase().includes(q));
  }
  if (st === "PLANNED" || st === "IN_PROGRESS" || st === "CLOSED") {
    rows = rows.filter((r) => r.statusApi === st);
  }

  if (datePreset === "intersects_today" && todayIso) {
    rows = rows.filter((row) => {
      if (!row.dateValidation.ok || !row.startIso || !row.endIso) return false;
      return (
        compareIsoDates(row.startIso, todayIso) <= 0 && compareIsoDates(todayIso, row.endIso) <= 0
      );
    });
  }

  rows.sort((a, b) => {
    const ra = sprintStatusSortRank(a.statusApi);
    const rb = sprintStatusSortRank(b.statusApi);
    if (ra !== rb) return ra - rb;
    const isoA = a.startIso;
    const isoB = b.startIso;
    if (!isoA && !isoB) return compareIdsStable(a.id, b.id);
    if (!isoA) return 1;
    if (!isoB) return -1;
    const cmp = compareIsoDates(isoB, isoA);
    if (cmp !== 0) return cmp;
    return compareIdsStable(a.id, b.id);
  });

  return rows;
}

/** @param {string} a @param {string} b */
function compareIdsStable(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
