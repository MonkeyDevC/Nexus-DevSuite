/**
 * ----
 * Módulo: Workflow Service
 * Descripción: Implementa lógica de negocio y validación de integridad ejecutable del workflow.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");

const WORKFLOW_LOCAL_ERROR_CODES = {
  EDGE_DUPLICATE: "WORKFLOW_EDGE_DUPLICATE",
  INVALID_GRAPH: "WORKFLOW_INVALID_GRAPH",
  INVALID_START_NODE: "WORKFLOW_INVALID_START_NODE",
  UNREACHABLE_NODES: "WORKFLOW_UNREACHABLE_NODES",
  ORPHAN_NODES: "WORKFLOW_ORPHAN_NODES",
  INCOMPLETE: "WORKFLOW_INCOMPLETE",
  DEAD_END: "WORKFLOW_DEAD_END",
  NOT_EDITABLE: "WORKFLOW_NOT_EDITABLE"
};

function toWorkflowPlain(row) {
  const p = row && typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: p.id,
    name: p.name,
    version: p.version,
    status: p.status,
    activated_at: p.activated_at,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

function toNodePlain(row) {
  const p = row && typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: p.id,
    workflow_id: p.workflow_id,
    type: p.type,
    name: p.name,
    is_start: Boolean(p.is_start),
    config: p.config || {},
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

function toEdgePlain(row) {
  const p = row && typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: p.id,
    from_node_id: p.from_node_id,
    to_node_id: p.to_node_id,
    condition: p.condition || null,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

function toRulePlain(row) {
  const p = row && typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: p.id,
    node_id: p.node_id,
    rule_type: p.rule_type,
    conditions: p.conditions || {},
    message: p.message,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

function assertWorkflowPayload(data) {
  if (!data || typeof data !== "object") {
    throw new AppError("Datos de workflow inválidos", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    throw new AppError("name es obligatorio", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!Number.isInteger(data.version) || data.version <= 0) {
    throw new AppError("version es obligatoria y debe ser entero mayor a 0", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const allowedStatus = ["draft", "active"];
  if (!data.status || !allowedStatus.includes(data.status)) {
    throw new AppError("status inválido. Valores permitidos: draft, active", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
}

async function ensureWorkflowExists(workflowId) {
  const { WorkflowDefinition } = getModels();
  const workflow = await WorkflowDefinition.findByPk(workflowId);
  if (!workflow) {
    throw new AppError("Workflow does not exist", {
      statusCode: 404,
      code: ERROR_CODES.WORKFLOW_NOT_FOUND
    });
  }
  return workflow;
}

function assertWorkflowEditable(workflow) {
  if (workflow.status !== "draft") {
    throw new AppError("Workflow no editable. Solo se permite editar en estado draft", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.NOT_EDITABLE,
      details: { workflow_id: workflow.id, status: workflow.status }
    });
  }
}

async function ensureNodeExists(nodeId) {
  const { WorkflowNode } = getModels();
  const node = await WorkflowNode.findByPk(nodeId);
  if (!node) {
    throw new AppError("Workflow node does not exist", {
      statusCode: 404,
      code: ERROR_CODES.WORKFLOW_NODE_NOT_FOUND
    });
  }
  return node;
}

async function getWorkflowGraph(workflowId) {
  const { WorkflowNode, WorkflowEdge } = getModels();
  const nodes = await WorkflowNode.findAll({
    where: { workflow_id: workflowId },
    order: [["created_at", "ASC"]]
  });
  const nodeIds = nodes.map((n) => n.id);
  const edges = nodeIds.length
    ? await WorkflowEdge.findAll({
        where: { from_node_id: nodeIds },
        order: [["created_at", "ASC"]]
      })
    : [];
  return { nodes, edges };
}

function buildAdjacency(nodes, edges) {
  const adjacency = new Map();
  const indegree = new Map();
  const outdegree = new Map();
  for (const n of nodes) {
    adjacency.set(n.id, []);
    indegree.set(n.id, 0);
    outdegree.set(n.id, 0);
  }
  for (const e of edges) {
    if (!adjacency.has(e.from_node_id) || !adjacency.has(e.to_node_id)) continue;
    adjacency.get(e.from_node_id).push(e.to_node_id);
    outdegree.set(e.from_node_id, outdegree.get(e.from_node_id) + 1);
    indegree.set(e.to_node_id, indegree.get(e.to_node_id) + 1);
  }
  return { adjacency, indegree, outdegree };
}

function assertNoCycles(nodes, edges) {
  const { adjacency } = buildAdjacency(nodes, edges);
  const visited = new Set();
  const inStack = new Set();

  function dfs(nodeId) {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    inStack.add(nodeId);
    const next = adjacency.get(nodeId) || [];
    for (const neighbor of next) {
      if (dfs(neighbor)) return true;
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (dfs(node.id)) {
      throw new AppError("El workflow contiene ciclos dirigidos no permitidos", {
        statusCode: 400,
        code: WORKFLOW_LOCAL_ERROR_CODES.INVALID_GRAPH
      });
    }
  }
}

function validateStartNode(nodes) {
  const startNodes = nodes.filter((n) => Boolean(n.is_start));
  if (startNodes.length !== 1) {
    throw new AppError("Debe existir exactamente un nodo start por workflow", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.INVALID_START_NODE,
      details: { start_nodes_count: startNodes.length }
    });
  }
  return startNodes[0];
}

function validateReachability(nodes, edges, startNodeId) {
  const { adjacency } = buildAdjacency(nodes, edges);
  const visited = new Set();
  const queue = [startNodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = adjacency.get(current) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  const unreachable = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
  if (unreachable.length > 0) {
    throw new AppError("Existen nodos no alcanzables desde el start", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.UNREACHABLE_NODES,
      details: { unreachable_node_ids: unreachable }
    });
  }
}

function validateOrphanNodes(nodes, edges) {
  const { indegree, outdegree } = buildAdjacency(nodes, edges);
  const orphans = nodes.filter((n) => (indegree.get(n.id) || 0) === 0 && (outdegree.get(n.id) || 0) === 0).map((n) => n.id);
  if (orphans.length > 0) {
    throw new AppError("Existen nodos huérfanos sin conexiones", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.ORPHAN_NODES,
      details: { orphan_node_ids: orphans }
    });
  }
}

function validateDeadEnds(nodes, edges, startNodeId) {
  const { indegree, outdegree } = buildAdjacency(nodes, edges);
  const sinks = nodes.filter((n) => (outdegree.get(n.id) || 0) === 0);
  if (sinks.length > 1) {
    throw new AppError("Existen múltiples nodos terminales (dead-end) no permitidos", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.DEAD_END,
      details: { dead_end_node_ids: sinks.map((n) => n.id) }
    });
  }
  if (sinks.length === 1) {
    const sink = sinks[0];
    if (sink.id === startNodeId && nodes.length > 1) {
      throw new AppError("El nodo start no puede ser terminal en workflows con múltiples nodos", {
        statusCode: 400,
        code: WORKFLOW_LOCAL_ERROR_CODES.DEAD_END,
        details: { dead_end_node_ids: [sink.id] }
      });
    }
    if ((indegree.get(sink.id) || 0) === 0 && nodes.length > 1) {
      throw new AppError("Nodo terminal inválido sin entrada", {
        statusCode: 400,
        code: WORKFLOW_LOCAL_ERROR_CODES.DEAD_END,
        details: { dead_end_node_ids: [sink.id] }
      });
    }
  }
}

async function validateWorkflowIntegrity(workflowId, options = {}) {
  const { requireComplete = true } = options;
  await ensureWorkflowExists(workflowId);
  const { nodes, edges } = await getWorkflowGraph(workflowId);

  if (!requireComplete) {
    if (edges.length > 0) {
      assertNoCycles(nodes, edges);
    }
    return;
  }

  if (nodes.length === 0 || edges.length === 0) {
    throw new AppError("Workflow incompleto: se requiere al menos un start node y un edge", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.INCOMPLETE
    });
  }

  if (nodes.length > 0) {
    const startNode = validateStartNode(nodes);
    if (edges.length > 0) {
      assertNoCycles(nodes, edges);
      validateOrphanNodes(nodes, edges);
      validateReachability(nodes, edges, startNode.id);
      if (requireComplete) {
        validateDeadEnds(nodes, edges, startNode.id);
      }
    }
  }
}

async function createWorkflow(data) {
  assertWorkflowPayload(data);
  const { WorkflowDefinition } = getModels();
  const workflow = await WorkflowDefinition.create({
    name: data.name.trim(),
    version: data.version,
    status: data.status
  });
  return toWorkflowPlain(workflow);
}

async function getWorkflows() {
  const { WorkflowDefinition } = getModels();
  const rows = await WorkflowDefinition.findAll({
    order: [["created_at", "DESC"]]
  });
  return {
    data: rows.map(toWorkflowPlain),
    total: rows.length
  };
}

async function getWorkflowById(id) {
  const { WorkflowDefinition, WorkflowRule } = getModels();
  const workflow = await WorkflowDefinition.findByPk(id);
  if (!workflow) {
    throw new AppError("Workflow does not exist", {
      statusCode: 404,
      code: ERROR_CODES.WORKFLOW_NOT_FOUND
    });
  }
  const { nodes, edges } = await getWorkflowGraph(id);
  const rules = nodes.length
    ? await WorkflowRule.findAll({
        where: { node_id: nodes.map((n) => n.id) },
        order: [["created_at", "ASC"]]
      })
    : [];

  return {
    ...toWorkflowPlain(workflow),
    nodes: nodes.map(toNodePlain),
    edges: edges.map(toEdgePlain),
    rules: rules.map(toRulePlain)
  };
}

async function addNode(workflowId, nodeData) {
  const workflow = await ensureWorkflowExists(workflowId);
  assertWorkflowEditable(workflow);
  if (!nodeData || typeof nodeData !== "object") {
    throw new AppError("Datos de nodo inválidos", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const allowedTypes = ["task", "validation", "condition"];
  if (!allowedTypes.includes(nodeData.type)) {
    throw new AppError("type inválido. Valores permitidos: task, validation, condition", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!nodeData.name || typeof nodeData.name !== "string" || !nodeData.name.trim()) {
    throw new AppError("name es obligatorio en nodo", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (nodeData.config === undefined || nodeData.config === null || typeof nodeData.config !== "object" || Array.isArray(nodeData.config)) {
    throw new AppError("config debe ser un JSON objeto válido", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const { WorkflowNode } = getModels();
  const isStart = Boolean(nodeData.is_start);
  if (isStart) {
    const existingStart = await WorkflowNode.findOne({ where: { workflow_id: workflowId, is_start: true } });
    if (existingStart) {
      throw new AppError("Ya existe un start node para este workflow", {
        statusCode: 400,
        code: WORKFLOW_LOCAL_ERROR_CODES.INVALID_START_NODE
      });
    }
  }

  const row = await WorkflowNode.create({
    workflow_id: workflowId,
    type: nodeData.type,
    name: nodeData.name.trim(),
    is_start: isStart,
    config: nodeData.config
  });
  return toNodePlain(row);
}

async function addEdge(workflowId, edgeData) {
  const workflow = await ensureWorkflowExists(workflowId);
  assertWorkflowEditable(workflow);
  if (!edgeData || typeof edgeData !== "object") {
    throw new AppError("Datos de edge inválidos", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const fromNode = await ensureNodeExists(edgeData.from_node_id);
  const toNode = await ensureNodeExists(edgeData.to_node_id);
  if (edgeData.from_node_id === edgeData.to_node_id) {
    throw new AppError("Self-loop no permitido en workflow", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.INVALID_GRAPH
    });
  }
  if (fromNode.workflow_id !== workflowId || toNode.workflow_id !== workflowId) {
    throw new AppError("Los nodos del edge deben pertenecer al workflow indicado", {
      statusCode: 400,
      code: ERROR_CODES.WORKFLOW_EDGE_INVALID
    });
  }
  const { WorkflowEdge } = getModels();
  const existingEdge = await WorkflowEdge.findOne({
    where: { from_node_id: edgeData.from_node_id, to_node_id: edgeData.to_node_id }
  });
  if (existingEdge) {
    throw new AppError("Edge duplicado: ya existe relación entre los nodos", {
      statusCode: 400,
      code: WORKFLOW_LOCAL_ERROR_CODES.EDGE_DUPLICATE
    });
  }

  const { nodes, edges } = await getWorkflowGraph(workflowId);
  assertNoCycles(nodes, [
    ...edges,
    {
      from_node_id: edgeData.from_node_id,
      to_node_id: edgeData.to_node_id
    }
  ]);

  const row = await WorkflowEdge.create({
    from_node_id: edgeData.from_node_id,
    to_node_id: edgeData.to_node_id,
    condition: edgeData.condition && typeof edgeData.condition === "object" ? edgeData.condition : null
  });

  return toEdgePlain(row);
}

async function addRule(nodeId, ruleData) {
  const node = await ensureNodeExists(nodeId);
  if (!ruleData || typeof ruleData !== "object") {
    throw new AppError("Datos de regla inválidos", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const allowedRuleTypes = ["block", "warn"];
  if (!allowedRuleTypes.includes(ruleData.rule_type)) {
    throw new AppError("rule_type inválido. Valores permitidos: block, warn", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  if (!ruleData.message || typeof ruleData.message !== "string" || !ruleData.message.trim()) {
    throw new AppError("message es obligatorio en regla", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const { WorkflowRule } = getModels();
  const row = await WorkflowRule.create({
    node_id: node.id,
    rule_type: ruleData.rule_type,
    conditions: ruleData.conditions && typeof ruleData.conditions === "object" ? ruleData.conditions : {},
    message: ruleData.message.trim()
  });
  return toRulePlain(row);
}

async function addRuleToWorkflow(workflowId, ruleData) {
  const workflow = await ensureWorkflowExists(workflowId);
  assertWorkflowEditable(workflow);
  if (!ruleData || !ruleData.node_id) {
    throw new AppError("node_id es obligatorio para crear regla", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const node = await ensureNodeExists(ruleData.node_id);
  if (node.workflow_id !== workflowId) {
    throw new AppError("El nodo no pertenece al workflow indicado", {
      statusCode: 400,
      code: ERROR_CODES.WORKFLOW_RULE_INVALID
    });
  }
  return addRule(ruleData.node_id, ruleData);
}

async function validateWorkflow(workflowId) {
  await validateWorkflowIntegrity(workflowId, { requireComplete: true });
  return true;
}

async function activateWorkflow(workflowId) {
  const workflow = await ensureWorkflowExists(workflowId);
  if (workflow.status === "active") {
    throw new AppError("Workflow ya se encuentra activo", {
      statusCode: 400,
      code: ERROR_CODES.WORKFLOW_ALREADY_ACTIVE
    });
  }

  await validateWorkflow(workflowId);
  workflow.status = "active";
  workflow.activated_at = new Date();
  await workflow.save();
  logger.info({
    event: "WORKFLOW_ACTIVATED",
    workflow_id: workflow.id,
    timestamp: workflow.activated_at
  });
  return toWorkflowPlain(workflow);
}

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  addNode,
  addEdge,
  addRule,
  addRuleToWorkflow,
  validateWorkflowIntegrity,
  validateWorkflow,
  activateWorkflow
};
