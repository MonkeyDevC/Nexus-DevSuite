/**
 * ----
 * Módulo: Rules Engine Service
 * Descripción: Orquesta parser y evaluator para ejecutar reglas declarativas agnósticas.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { parseRules } = require("./rulesEngine.parser");
const { evaluateRuleset } = require("./rulesEngine.evaluator");
const logger = require("../../config/logger");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { randomUUID } = require("crypto");

const parsedRulesCache = new Map();
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const KNOWN_STATUS_VALUES = new Set([
  "DRAFT", "APPROVED", "ARCHIVED", "PLANNED", "IN_PROGRESS", "QA", "RELEASED", "ACTIVE", "CLOSED",
  "TODO", "READY", "BLOCKED", "DONE", "MERGED", "PR_CREATED", "PREPARING", "LOCKED", "COMMITTED"
]);

function validateContext(context, rules = []) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    throw new AppError("context debe ser un objeto", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (rules.length > 0 && Object.keys(context).length === 0) {
    throw new AppError("context requiere estructura mínima cuando se envían reglas", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
}

function buildContextSnapshot(context) {
  const out = {};
  for (const [key, value] of Object.entries(context || {})) {
    if (value == null) out[key] = value;
    else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
    else out[key] = "[object]";
  }
  return out;
}

function cleanupExpiredCache(now) {
  for (const [key, entry] of parsedRulesCache.entries()) {
    if (entry.expires_at <= now) {
      parsedRulesCache.delete(key);
    }
  }
}

function getCachedParsedRules(rules, ttlMs = DEFAULT_CACHE_TTL_MS) {
  const cacheKey = JSON.stringify(rules || []);
  const now = Date.now();
  cleanupExpiredCache(now);
  const cached = parsedRulesCache.get(cacheKey);
  if (cached && cached.expires_at > now) {
    return cached.value;
  }
  const parsed = parseRules(rules);
  parsedRulesCache.set(cacheKey, {
    value: parsed,
    expires_at: now + Math.max(1000, ttlMs)
  });
  return parsed;
}

function warnUnknownStatusValues(context) {
  if (!context || typeof context !== "object") return;
  const stack = [context];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, value] of Object.entries(current)) {
      if (value && typeof value === "object") {
        stack.push(value);
        continue;
      }
      if (key === "status" && typeof value === "string" && !KNOWN_STATUS_VALUES.has(value)) {
        logger.warn(
          { event: "RULE_CONTEXT_STATUS_UNKNOWN", status_value: value },
          "Contexto contiene status fuera del catálogo conocido. Se permite por compatibilidad."
        );
      }
    }
  }
}

async function evaluateRules(context, rules, options = {}) {
  const safeRules = Array.isArray(rules) ? rules : [];
  if (rules != null && !Array.isArray(rules)) {
    throw new AppError("rules debe ser un arreglo", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  validateContext(context, safeRules);
  warnUnknownStatusValues(context);

  const normalizedRules = getCachedParsedRules(safeRules, options.cache_ttl_ms)
    .map((rule, idx) => ({ ...rule, __order: idx }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.__order - b.__order;
    })
    .map(({ __order, ...rest }) => rest);

  const rulesVersion = Number.isInteger(options.rules_version) && options.rules_version > 0 ? options.rules_version : 1;
  const correlationId = options.correlation_id || randomUUID();
  const result = evaluateRuleset(context || {}, normalizedRules);
  const response = {
    allowed: result.allowed,
    errors: result.errors || [],
    warnings: result.warnings || [],
    metadata: {
      version: rulesVersion,
      correlation_id: correlationId
    }
  };
  logger.info({
    event: "RULE_EVALUATED",
    correlation_id: correlationId,
    rules_version: rulesVersion,
    rules_count: normalizedRules.length,
    context_snapshot: buildContextSnapshot(context),
    result: {
      allowed: response.allowed,
      errors_count: response.errors.length,
      warnings_count: response.warnings.length
    },
    timestamp: new Date().toISOString()
  });
  return response;
}

async function getHealth() {
  return {
    status: "ok",
    engine: "rules-engine",
    deterministic: true
  };
}

module.exports = {
  evaluateRules,
  getHealth,
  validateContext
};
