/**
 * ----
 * Módulo: Rules Execution Service
 * Descripción: Reglas de negocio para registrar y consultar ejecuciones del rules engine.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const rulesExecutionRepository = require("./rulesExecution.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const ALLOWED_ENTITY_TYPES = new Set(["story", "work_order", "delivery"]);

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toPlain(row) {
  if (!row) return null;
  const r = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: r.id,
    execution_id: r.execution_id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    tenant_id: r.tenant_id || null,
    rule_name: r.rule_name,
    allowed: Boolean(r.allowed),
    errors: normalizeArray(r.errors),
    warnings: normalizeArray(r.warnings),
    created_at: r.created_at
  };
}

function assertPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new AppError("Payload de ejecución de reglas inválido", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!ALLOWED_ENTITY_TYPES.has(payload.entity_type)) {
    throw new AppError("entity_type inválido para rules execution", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!payload.entity_id || typeof payload.entity_id !== "string") {
    throw new AppError("entity_id es obligatorio para rules execution", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!payload.rule_name || typeof payload.rule_name !== "string") {
    throw new AppError("rule_name es obligatorio para rules execution", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!payload.execution_id || typeof payload.execution_id !== "string") {
    throw new AppError("execution_id es obligatorio para rules execution", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
}

async function createExecutionLog(payload) {
  assertPayload(payload);
  const created = await rulesExecutionRepository.createExecution({
    execution_id: payload.execution_id,
    action: payload.action || payload.rule_name,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id,
    tenant_id: payload.tenant_id || "00000000-0000-0000-0000-000000000001",
    target_entity: payload.target_entity || payload.entity_type,
    trigger_event: payload.trigger_event || payload.rule_name,
    dry_run: Boolean(payload.dry_run),
    blocked: !Boolean(payload.allowed),
    request_id: payload.request_id || null,
    actor_user_id: payload.actor_user_id || null,
    evaluation_json: {
      allowed: Boolean(payload.allowed),
      errors: normalizeArray(payload.errors),
      warnings: normalizeArray(payload.warnings)
    },
    rule_name: payload.rule_name,
    allowed: Boolean(payload.allowed),
    errors: normalizeArray(payload.errors),
    warnings: normalizeArray(payload.warnings)
  });
  return toPlain(created);
}

async function listExecutions(query = {}) {
  const rows = await rulesExecutionRepository.listExecutions({
    entity_type: query.entityType || query.entity_type || undefined,
    entity_id: query.entityId || query.entity_id || undefined,
    limit: query.limit,
    offset: query.offset,
    order: query.order
  });
  return rows.map(toPlain);
}

module.exports = {
  createExecutionLog,
  listExecutions
};
