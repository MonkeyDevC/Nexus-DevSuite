"use strict";

const OPERATORS = {
  equals: (a, b) => String(a) === String(b),
  not_equals: (a, b) => String(a) !== String(b),
  contains: (a, b) => {
    if (a == null) return false;
    if (Array.isArray(a)) return a.map(String).includes(String(b));
    return String(a).includes(String(b));
  },
  greater_than: (a, b) => {
    const an = typeof a === "number" ? a : parseFloat(String(a));
    const bn = typeof b === "number" ? b : parseFloat(String(b));
    if (Number.isNaN(an) || Number.isNaN(bn)) return String(a) > String(b);
    return an > bn;
  },
  less_than: (a, b) => {
    const an = typeof a === "number" ? a : parseFloat(String(a));
    const bn = typeof b === "number" ? b : parseFloat(String(b));
    if (Number.isNaN(an) || Number.isNaN(bn)) return String(a) < String(b);
    return an < bn;
  }
};

function evaluateCondition(condition, eventPayload) {
  if (!condition || !condition.field || !condition.operator) return false;
  const operator = OPERATORS[condition.operator];
  if (!operator) return false;

  const fieldValue = eventPayload ? eventPayload[condition.field] : undefined;
  return operator(fieldValue, condition.value);
}

function evaluateConditions(conditions, eventPayload) {
  if (!conditions || conditions.length === 0) return true;
  // Primera iteración: AND estricto entre todas las condiciones.
  return conditions.every((c) => evaluateCondition(c, eventPayload));
}

module.exports = {
  evaluateConditions,
  OPERATORS
};

