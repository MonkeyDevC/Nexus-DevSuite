/**
 * ----
 * Módulo: Rules Engine Parser
 * Descripción: Valida y normaliza reglas declarativas JSON para evaluación determinística.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");

const LOGICAL_OPERATORS = new Set(["AND", "OR", "NOT"]);
const COMPARISON_OPERATORS = new Set(["EQUALS", "NOT_EQUALS"]);
const ACTIONS = new Set(["block", "warn"]);

function buildValidationError(message, details) {
  return new AppError(message, {
    statusCode: 400,
    code: ERROR_CODES.VALIDATION_ERROR,
    details: details || null
  });
}

function normalizeLeafCondition(condition) {
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
    throw buildValidationError("Condición inválida: se esperaba objeto", { condition });
  }

  const { field, operator, value } = condition;
  if (!field || typeof field !== "string") {
    throw buildValidationError("Condición inválida: field es obligatorio", { condition });
  }
  if (!operator || typeof operator !== "string" || !COMPARISON_OPERATORS.has(operator)) {
    throw buildValidationError("Condición inválida: operator no soportado", { condition });
  }

  return {
    field: field.trim(),
    operator,
    value
  };
}

function normalizeConditions(rawConditions) {
  if (!rawConditions || typeof rawConditions !== "object" || Array.isArray(rawConditions)) {
    throw buildValidationError("conditions inválido: se esperaba objeto", { conditions: rawConditions });
  }

  const keys = Object.keys(rawConditions);
  if (keys.length !== 1) {
    throw buildValidationError("conditions debe contener exactamente un operador lógico", { conditions: rawConditions });
  }

  const op = keys[0];
  if (!LOGICAL_OPERATORS.has(op)) {
    throw buildValidationError("Operador lógico no soportado", { operator: op });
  }

  if (op === "NOT") {
    return {
      NOT: normalizeNode(rawConditions.NOT)
    };
  }

  const list = rawConditions[op];
  if (!Array.isArray(list) || list.length === 0) {
    throw buildValidationError(op + " requiere lista no vacía", { conditions: rawConditions });
  }

  return {
    [op]: list.map(normalizeNode)
  };
}

function normalizeNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    throw buildValidationError("Nodo de condición inválido", { node });
  }

  const keys = Object.keys(node);
  const hasLogical = keys.some((k) => LOGICAL_OPERATORS.has(k));
  if (hasLogical) {
    return normalizeConditions(node);
  }

  return normalizeLeafCondition(node);
}

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw buildValidationError("Regla inválida: se esperaba objeto", { rule });
  }

  if (!rule.conditions || typeof rule.conditions !== "object") {
    throw buildValidationError("Regla inválida: conditions es obligatorio", { rule });
  }
  const typeCandidate = typeof rule.type === "string" ? rule.type : rule.action;
  if (!typeCandidate || typeof typeCandidate !== "string" || !ACTIONS.has(typeCandidate)) {
    throw buildValidationError("Regla inválida: type/action debe ser block o warn", { rule });
  }
  if (!rule.message || typeof rule.message !== "string" || !rule.message.trim()) {
    throw buildValidationError("Regla inválida: message es obligatorio", { rule });
  }

  let priority = 1000;
  if (Object.prototype.hasOwnProperty.call(rule, "priority")) {
    if (!Number.isInteger(rule.priority) || rule.priority < 0) {
      throw buildValidationError("Regla inválida: priority debe ser entero >= 0", { rule });
    }
    priority = rule.priority;
  }

  return {
    id: typeof rule.id === "string" && rule.id.trim() ? rule.id.trim() : null,
    conditions: normalizeNode(rule.conditions),
    type: typeCandidate,
    message: rule.message.trim(),
    priority
  };
}

function parseRules(rules) {
  if (rules == null) {
    return [];
  }
  if (!Array.isArray(rules)) {
    throw buildValidationError("rules debe ser un arreglo", { rules });
  }
  const seen = new Set();
  let autoCounter = 1;
  return rules.map((rule) => {
    const normalized = normalizeRule(rule);
    if (!normalized.id) {
      normalized.id = "RULE_AUTO_" + autoCounter++;
      logger.warn(
        {
          event: "RULE_AUTO_ID_ASSIGNED",
          assigned_rule_id: normalized.id
        },
        "Regla sin id explícito. Se asigna id automático para compatibilidad."
      );
    }
    if (seen.has(normalized.id)) {
      throw buildValidationError("Regla inválida: id duplicado", { rule_id: normalized.id });
    }
    seen.add(normalized.id);
    return normalized;
  });
}

module.exports = {
  parseRules
};
