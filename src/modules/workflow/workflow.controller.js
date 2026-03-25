/**
 * ----
 * Módulo: Workflow Controller
 * Descripción: Expone endpoints HTTP para foundation del workflow engine.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const workflowService = require("./workflow.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");

async function createWorkflowController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.createWorkflow(req.body);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function listWorkflowsController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.getWorkflows();
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function getWorkflowByIdController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.getWorkflowById(req.params.id);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function addNodeController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.addNode(req.params.id, req.body);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function addEdgeController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.addEdge(req.params.id, req.body);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function addRuleController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.addRuleToWorkflow(req.params.id, req.body);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function validateWorkflowController(req, res, next) {
  try {
    assertRequestValid(req);
    await workflowService.validateWorkflow(req.params.id);
    res.status(200).json(buildSuccess({}, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

async function activateWorkflowController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await workflowService.activateWorkflow(req.params.id);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createWorkflowController,
  listWorkflowsController,
  getWorkflowByIdController,
  addNodeController,
  addEdgeController,
  addRuleController,
  validateWorkflowController,
  activateWorkflowController
};
