"use strict";

/**
 * Event Bus interno (singleton).
 * - No bloquea requests: handlers + automation se ejecutan async fire-and-forget.
 * - Está diseñado para ser backward compatible: solo lo usan módulos que lo importan.
 */

const logger = require("../config/logger");

const handlers = new Map(); // event_type -> Set<handler>
let automationEngine = null;

function on(eventType, handler) {
  if (!eventType || typeof handler !== "function") return;
  if (!handlers.has(eventType)) handlers.set(eventType, new Set());
  handlers.get(eventType).add(handler);
}

function off(eventType, handler) {
  if (!handlers.has(eventType)) return;
  if (!handler) {
    handlers.delete(eventType);
    return;
  }
  handlers.get(eventType).delete(handler);
}

function safeNextTick(fn) {
  try {
    setImmediate(fn);
  } catch (_) {
    // fallback
    Promise.resolve().then(fn);
  }
}

function emit(eventType, payload = {}, meta = {}) {
  const event = {
    event_type: eventType,
    payload: payload || {},
    meta: meta || {}
  };

  // 1) handlers propios
  const hs = handlers.get(eventType);
  if (hs && hs.size) {
    hs.forEach((h) => {
      safeNextTick(() => {
        Promise.resolve()
          .then(() => h(event))
          .catch((err) => logger.warn({ err: err && err.message ? err.message : String(err), event_type: eventType }, "Event handler failed"));
      });
    });
  }

  // 2) automation engine (fire-and-forget)
  safeNextTick(async () => {
    try {
      if (!automationEngine) {
        automationEngine = require("../modules/automation/automation.engine");
      }
      if (automationEngine && typeof automationEngine.processEvent === "function") {
        await automationEngine.processEvent(event);
      }
    } catch (err) {
      logger.warn({ err: err && err.message ? err.message : String(err), event_type: eventType }, "Automation engine failed");
    }
  });
}

module.exports = {
  on,
  off,
  emit
};

