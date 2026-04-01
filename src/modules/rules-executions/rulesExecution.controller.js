/**
 * ----
 * Módulo: Rules Execution Controller
 * Descripción: Controlador de consulta para historial de ejecuciones del rules engine.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const rulesExecutionService = require("./rulesExecution.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");

async function listRulesExecutionsController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await rulesExecutionService.listExecutions({
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      limit: req.query.limit,
      offset: req.query.offset,
      order: req.query.order
    });
    res.status(200).json(buildSuccess({ items: data }, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRulesExecutionsController
};
