/**
 * ----
 * Módulo: State Transition Logger
 * Descripción: Registra transiciones con versionado secuencial por entidad (CAS lógico).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const orchestratorRepository = require("./orchestrator.repository");

async function logStateTransition({ entity, entityId, fromState, toState, requestId, dedupKey, metadata }) {
  const currentVersion = await orchestratorRepository.getLastTransitionVersion(entity, entityId);
  const transitionVersion = currentVersion + 1;
  return orchestratorRepository.createStateTransition({
    entity,
    entity_id: String(entityId),
    transition_version: transitionVersion,
    from_state: fromState || null,
    to_state: toState,
    request_id: requestId || "no-request-id",
    dedup_key: dedupKey || null,
    metadata: metadata || {}
  });
}

module.exports = {
  logStateTransition
};

