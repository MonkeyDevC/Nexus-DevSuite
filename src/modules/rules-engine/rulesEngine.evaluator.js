/**
 * ----
 * Módulo: Rules Engine Evaluator
 * Descripción: Evalúa condiciones lógicas declarativas (AND/OR/NOT) de forma determinística.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function getPathState(context, path) {
  const parts = String(path || "").split(".").filter(Boolean);
  let current = context;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) {
      return { found: false, value: undefined };
    }
    current = current[part];
  }
  return { found: true, value: current };
}

function evaluateLeaf(context, condition) {
  const state = getPathState(context, condition.field);
  if (!state.found) {
    throw new AppError("Campo inexistente en contexto para evaluación de regla", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: { field: condition.field }
    });
  }
  const left = state.value;
  switch (condition.operator) {
    case "EQUALS":
      return left === condition.value;
    case "NOT_EQUALS":
      return left !== condition.value;
    default:
      return false;
  }
}

function evaluateNode(context, node) {
  if (!node || typeof node !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(node, "AND")) {
    return node.AND.every((child) => evaluateNode(context, child));
  }
  if (Object.prototype.hasOwnProperty.call(node, "OR")) {
    return node.OR.some((child) => evaluateNode(context, child));
  }
  if (Object.prototype.hasOwnProperty.call(node, "NOT")) {
    return !evaluateNode(context, node.NOT);
  }
  return evaluateLeaf(context, node);
}

function extractFirstPath(node) {
  if (!node || typeof node !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(node, "AND")) {
    return extractFirstPath(node.AND[0]);
  }
  if (Object.prototype.hasOwnProperty.call(node, "OR")) {
    return extractFirstPath(node.OR[0]);
  }
  if (Object.prototype.hasOwnProperty.call(node, "NOT")) {
    return extractFirstPath(node.NOT);
  }
  return node.field || null;
}

function evaluateRuleset(context, normalizedRules) {
  const result = {
    allowed: true,
    errors: [],
    warnings: []
  };

  for (const rule of normalizedRules) {
    const matched = evaluateNode(context || {}, rule.conditions);
    if (!matched) continue;

    const entry = {
      rule_id: rule.id,
      code: rule.type === "block" ? "RULE_BLOCKED" : "RULE_WARNING",
      message: rule.message,
      path: extractFirstPath(rule.conditions)
    };

    if (rule.type === "block") {
      result.allowed = false;
      result.errors.push(entry);
      break;
    }
    result.warnings.push(entry);
  }

  if (!result.allowed && result.errors.length === 0) {
    result.errors.push({
      rule_id: "RULE_UNKNOWN",
      code: "RULE_BLOCKED",
      message: "Regla de bloqueo activada sin detalle",
      path: null
    });
  }

  return result;
}

module.exports = {
  evaluateRuleset
};
