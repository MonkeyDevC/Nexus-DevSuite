"use strict";

/**
 * Work Orders — State Machine centralizada.
 * Única fuente de verdad para transiciones de estado.
 */

const WORK_ORDER_STATUSES = ["PENDING", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const WORK_ORDER_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

// PENDING -> IN_PROGRESS -> IN_REVIEW -> DONE
const TRANSITIONS = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["DONE"],
  DONE: []
};

// Compatibilidad con schema anterior.
// Algunos clientes/DB envían "COMPLETED" o "PAUSED".
const LEGACY_STATUS_ALIASES = {
  COMPLETED: "DONE",
  PAUSED: "IN_REVIEW"
};

const ALL_ACCEPTED_STATUSES = [...WORK_ORDER_STATUSES, ...Object.keys(LEGACY_STATUS_ALIASES)];

function canTransition(from, to) {
  if (!from || !to) return false;
  const f = String(from).toUpperCase();
  const t = String(to).toUpperCase();
  return (TRANSITIONS[f] || []).includes(t);
}

function assertValidTransition(from, to) {
  const f = String(from).toUpperCase();
  const t = String(to).toUpperCase();

  if (!WORK_ORDER_STATUSES.includes(f)) {
    const err = new Error("Estado 'from' inválido");
    err.code = "WORK_ORDER_INVALID_STATUS";
    throw err;
  }
  if (!WORK_ORDER_STATUSES.includes(t)) {
    const err = new Error("Estado 'to' inválido");
    err.code = "WORK_ORDER_INVALID_STATUS";
    throw err;
  }
  if (!canTransition(f, t)) {
    const err = new Error(`Transición inválida: ${f} -> ${t}`);
    err.code = "WORK_ORDER_INVALID_TRANSITION";
    throw err;
  }
}

module.exports = {
  WORK_ORDER_STATUSES,
  WORK_ORDER_PRIORITIES,
  LEGACY_STATUS_ALIASES,
  ALL_ACCEPTED_STATUSES,
  TRANSITIONS,
  canTransition,
  assertValidTransition
};

