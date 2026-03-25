/**
 * ----
 * Módulo: Rules Execution Repository
 * Descripción: Acceso a datos para historial de evaluaciones de reglas.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getRuleExecutionModel() {
  const { RuleExecution } = getModels();
  return RuleExecution;
}

async function createExecution(payload) {
  const RuleExecution = getRuleExecutionModel();
  return RuleExecution.create(payload);
}

async function listExecutions(filters = {}) {
  const RuleExecution = getRuleExecutionModel();
  const where = {};
  if (filters.entity_type) where.entity_type = filters.entity_type;
  if (filters.entity_id) where.entity_id = filters.entity_id;
  const limit = Math.min(200, Math.max(1, parseInt(filters.limit, 10) || 20));
  const offset = Math.max(0, parseInt(filters.offset, 10) || 0);
  const order = String(filters.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  return RuleExecution.findAll({
    where,
    order: [["created_at", order]],
    limit,
    offset
  });
}

module.exports = {
  createExecution,
  listExecutions
};
