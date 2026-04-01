/**
 * ----
 * Módulo: Documentation Controller
 * Descripción: Adaptación HTTP sin lógica de negocio; observabilidad de mutaciones con request_id y dedup_key (sin PII).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const logger = require("../../config/logger");
const documentationService = require("./documentation.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

function resolveDedupForLog(req) {
  const fromCtx = req.idempotencyContext?.dedup_key;
  const h = req.headers["x-dedup-key"];
  if (typeof fromCtx === "string" && fromCtx.trim()) return fromCtx.trim();
  if (typeof h === "string" && h.trim()) return h.trim();
  return null;
}

function logMutationSuccess(operation, req, entityId) {
  logger.info(
    {
      event: "documentation_mutation_success",
      operation,
      request_id: req.requestId || "no-request-id",
      dedup_key: resolveDedupForLog(req),
      entity_id: entityId || null
    },
    "Mutación documentation_contents completada"
  );
}

async function createDocumentationController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentationService.createDocumentation(req.body, buildContext(req));
    logMutationSuccess("create", req, data?.id);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listDocumentationController(req, res, next) {
  try {
    assertRequestValid(req);
    const result = await documentationService.listDocumentation(req.query, req.organizationId);
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getDocumentationController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentationService.getById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchDocumentationController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentationService.updateDocumentation(req.params.id, req.body, buildContext(req));
    logMutationSuccess("patch", req, req.params.id);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function deleteDocumentationController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentationService.deleteDocumentation(req.params.id, buildContext(req));
    logMutationSuccess("delete", req, req.params.id);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createDocumentationController,
  listDocumentationController,
  getDocumentationController,
  patchDocumentationController,
  deleteDocumentationController
};
