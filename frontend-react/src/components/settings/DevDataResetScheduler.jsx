import { useEffect, useRef } from "react";
import {
  DEV_DATA_CONFIG_STORAGE_KEY,
  loadDevDataConfig,
} from "../../modules/settings/dev-data/devDataConfig.js";
import { runAutoResetFromScheduler } from "../../modules/settings/dev-data/devDataService.js";
import { MIN_AUTO_RESET_INTERVAL_MINUTES } from "../../modules/settings/dev-data/devDataLimits.js";

const SCHEDULER_LOCK_KEY = "nexus.dev.dataGeneration.schedulerLock";
const LOCK_TTL_MS = 120_000;
const MIN_TICK_MS = 30_000;

function readSchedulerLock() {
  try {
    const raw = window.localStorage.getItem(SCHEDULER_LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function tryAcquireSchedulerLock(ownerId) {
  const now = Date.now();
  const cur = readSchedulerLock();
  if (cur && typeof cur.until === "number" && cur.until > now && cur.owner !== ownerId) {
    return false;
  }
  try {
    window.localStorage.setItem(
      SCHEDULER_LOCK_KEY,
      JSON.stringify({ owner: ownerId, until: now + LOCK_TTL_MS })
    );
    return true;
  } catch {
    return false;
  }
}

function releaseSchedulerLock(ownerId) {
  const cur = readSchedulerLock();
  if (cur && cur.owner === ownerId) {
    try {
      window.localStorage.removeItem(SCHEDULER_LOCK_KEY);
    } catch {
      // ignore
    }
  }
}

export default function DevDataResetScheduler() {
  const ownerIdRef = useRef(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    if (!ownerIdRef.current) {
      ownerIdRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? `tab-${crypto.randomUUID()}`
          : `tab-${Date.now()}-${performance.now()}`;
    }
    const ownerId = ownerIdRef.current;

    let timer = null;
    let stopped = false;
    let running = false;

    function getIntervalMs() {
      const cfg = loadDevDataConfig();
      const ar = cfg.autoReset || {};
      if (!ar.enabled || !(ar.intervalMinutes > 0)) return 0;
      const minutes = Math.max(ar.intervalMinutes, MIN_AUTO_RESET_INTERVAL_MINUTES);
      return Math.max(MIN_TICK_MS, Math.round(minutes * 60_000));
    }

    async function tick() {
      const cfg = loadDevDataConfig();
      const ar = cfg.autoReset || {};
      if (!ar.enabled || !(ar.intervalMinutes > 0)) return;
      if (running) return;
      if (!tryAcquireSchedulerLock(ownerId)) return;
      running = true;
      try {
        const result = await runAutoResetFromScheduler();
        if (result && result.skipped && result.reason === "busy") {
          return;
        }
      } finally {
        running = false;
        releaseSchedulerLock(ownerId);
      }
    }

    function arm() {
      if (stopped) return;
      const ms = getIntervalMs();
      if (timer) window.clearInterval(timer);
      timer = null;
      if (!(ms > 0)) return;
      timer = window.setInterval(() => void tick(), ms);
    }

    function onStorage(e) {
      if (e && e.key === DEV_DATA_CONFIG_STORAGE_KEY) arm();
    }

    function onConfigChanged() {
      arm();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("nexus-dev-data-config-changed", onConfigChanged);
    arm();

    return () => {
      stopped = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nexus-dev-data-config-changed", onConfigChanged);
      if (timer) window.clearInterval(timer);
      releaseSchedulerLock(ownerId);
    };
  }, []);

  return null;
}

/** @deprecated Prefer loadDevDataConfig / dev-data module. Mantenido por compatibilidad si algún import legacy. */
export const DEV_DATA_RESET_STORAGE_KEYS = {
  STORAGE_KEY: "nexus.dev.dataReset",
  LAST_RUN_KEY: "nexus.dev.dataReset.lastRunAt",
  LAST_ERROR_KEY: "nexus.dev.dataReset.lastError",
};
