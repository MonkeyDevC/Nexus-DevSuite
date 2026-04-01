/**
 * ----
 * Módulo: Scope Lock Middleware
 * Descripción: Aplica control de concurrencia por scope con granularidad row/table y tenant.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const scopeLockService = require("../modules/orchestrator/scopeLock.service");
const logger = require("../config/logger");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildScopeLockMiddleware(scopeResolver) {
  return async function scopeLockMiddleware(req, res, next) {
    try {
      const ownerRequestId = req.requestId || `no-request-id:${Date.now()}`;
      const ownerDedupKey = req.idempotencyContext?.dedup_key || null;
      const scopes = scopeResolver(req) || [];
      if (!scopes.length) return next();

      const t0 = Date.now();
      await scopeLockService.acquireScopes(scopes, ownerRequestId, ownerDedupKey);
      const durationMs = Date.now() - t0;
      if (durationMs >= 50) {
        logger.info(
          {
            event: "scope_lock_acquire_slow",
            request_id: ownerRequestId,
            dedup_key: ownerDedupKey,
            duration_ms: durationMs,
            scopes: scopes.map((s) => ({
              table: s.table,
              tenant_id: s.tenant_id,
              row_id: s.row_id
            }))
          },
          "Adquisición de scope lock por encima del umbral"
        );
      }
      req.scopeLockOwner = ownerRequestId;

      const release = () => scopeLockService.releaseOwnerLocks(ownerRequestId).catch(() => {});
      res.on("finish", release);
      res.on("close", release);

      // Solo para validar concurrencia en entorno de dev/test.
      if (process.env.NODE_ENV !== "production") {
        const holdMs = Number(req.headers["x-scope-lock-hold-ms"] || 0);
        if (Number.isFinite(holdMs) && holdMs > 0 && holdMs <= 5000) {
          await sleep(holdMs);
        }
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function resolveReleasesScopes(req) {
  const tenantId = req.organizationId != null ? String(req.organizationId) : null;
  const releaseId = req.params?.id ? String(req.params.id) : null;
  if (releaseId) {
    return [{ table: "releases", row_id: releaseId, tenant_id: tenantId }];
  }
  return [{ table: "releases", tenant_id: tenantId }];
}

function resolveSprintsScopes(req) {
  const tenantId = req.organizationId != null ? String(req.organizationId) : null;
  const sprintId = req.params?.id ? String(req.params.id) : null;
  if (sprintId) {
    return [{ table: "sprints", row_id: sprintId, tenant_id: tenantId }];
  }
  return [{ table: "sprints", tenant_id: tenantId }];
}

function resolveImprovementsScopes(req) {
  const tenantId = req.organizationId != null ? String(req.organizationId) : null;
  const improvementId = req.params?.id ? String(req.params.id) : null;
  if (improvementId) {
    return [{ table: "improvements", row_id: improvementId, tenant_id: tenantId }];
  }
  return [{ table: "improvements", tenant_id: tenantId }];
}

function resolveDocumentationContentsScopes(req) {
  const tenantId = req.organizationId != null ? String(req.organizationId) : null;
  const docId = req.params?.id ? String(req.params.id) : null;
  if (docId) {
    return [{ table: "documentation_contents", row_id: docId, tenant_id: tenantId }];
  }
  const method = String(req.method || "").toUpperCase();
  if (method === "POST") {
    const typeRaw = typeof req.body?.type === "string" ? req.body.type : "_";
    const typePart = typeRaw.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "_";
    const pid =
      typeof req.body?.project_id === "string" && req.body.project_id.trim()
        ? String(req.body.project_id).trim().slice(0, 36)
        : "null";
    const rowKey = `new:${typePart}:${pid}`.slice(0, 80);
    return [{ table: "documentation_contents", row_id: rowKey, tenant_id: tenantId }];
  }
  return [{ table: "documentation_contents", tenant_id: tenantId }];
}

const releasesScopeLockMiddleware = buildScopeLockMiddleware(resolveReleasesScopes);
const sprintsScopeLockMiddleware = buildScopeLockMiddleware(resolveSprintsScopes);
const improvementsScopeLockMiddleware = buildScopeLockMiddleware(resolveImprovementsScopes);
const documentationContentsScopeLockMiddleware = buildScopeLockMiddleware(resolveDocumentationContentsScopes);

module.exports = {
  buildScopeLockMiddleware,
  releasesScopeLockMiddleware,
  sprintsScopeLockMiddleware,
  improvementsScopeLockMiddleware,
  documentationContentsScopeLockMiddleware
};

