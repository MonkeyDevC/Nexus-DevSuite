/**
 * ----
 * Módulo: Scope Lock Service
 * Descripción: Adquisición/liberación atómica de locks por scope con orden determinista.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { sequelize } = require("../../config/database");
const orchestratorRepository = require("./orchestrator.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const LOCK_TTL_MS = 20000;

function normalizeScope(scope) {
  return {
    table: String(scope.table || "").trim().toLowerCase(),
    row_id: scope.row_id == null || scope.row_id === "" ? null : String(scope.row_id),
    tenant_id: scope.tenant_id == null || scope.tenant_id === "" ? null : String(scope.tenant_id)
  };
}

function buildScopeKey(scope) {
  const row = scope.row_id || "*";
  const tenant = scope.tenant_id || "*";
  return `${scope.table}:${tenant}:${row}`;
}

function toDeterministicScopes(scopes) {
  const normalized = scopes
    .map(normalizeScope)
    .filter((scope) => scope.table);
  const unique = new Map();
  for (const scope of normalized) {
    const scopeKey = buildScopeKey(scope);
    unique.set(scopeKey, { ...scope, scope_key: scopeKey });
  }
  return [...unique.values()].sort((a, b) => a.scope_key.localeCompare(b.scope_key));
}

function isOwnedBy(lock, ownerRequestId, ownerDedupKey) {
  if (!lock) return false;
  if (lock.owner_request_id === ownerRequestId) return true;
  if (ownerDedupKey && lock.owner_dedup_key && lock.owner_dedup_key === ownerDedupKey) return true;
  return false;
}

function isExpired(lock) {
  if (!lock || !lock.expires_at) return true;
  return new Date(lock.expires_at).getTime() <= Date.now();
}

function isDeadlockError(error) {
  return (
    error?.name === "SequelizeDatabaseError" &&
    (error?.parent?.code === "ER_LOCK_DEADLOCK" || error?.original?.code === "ER_LOCK_DEADLOCK")
  );
}

async function acquireSingleScope(scope, ownerRequestId, ownerDedupKey) {
  return sequelize.transaction(async (transaction) => {
    const existing = await orchestratorRepository.findScopeLock(scope.scope_key, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const expiresAt = new Date(Date.now() + LOCK_TTL_MS);
    if (!existing) {
      try {
        await orchestratorRepository.createScopeLock(
          {
            scope_key: scope.scope_key,
            scope_table: scope.table,
            row_id: scope.row_id,
            tenant_id: scope.tenant_id,
            owner_request_id: ownerRequestId,
            owner_dedup_key: ownerDedupKey || null,
            expires_at: expiresAt
          },
          { transaction }
        );
        return;
      } catch (error) {
        if (error?.name !== "SequelizeUniqueConstraintError") {
          throw error;
        }
      }
    }

    const current = await orchestratorRepository.findScopeLock(scope.scope_key, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!current) {
      throw new AppError("No fue posible adquirir lock de scope", {
        statusCode: 409,
        code: ERROR_CODES.SCOPE_LOCK_CONFLICT
      });
    }

    const plain = current.toJSON ? current.toJSON() : current;
    if (isOwnedBy(plain, ownerRequestId, ownerDedupKey) || isExpired(plain)) {
      await orchestratorRepository.updateScopeLock(
        scope.scope_key,
        {
          owner_request_id: ownerRequestId,
          owner_dedup_key: ownerDedupKey || null,
          expires_at: expiresAt
        },
        { transaction }
      );
      return;
    }

    throw new AppError("Scope lock conflict", {
      statusCode: 409,
      code: ERROR_CODES.SCOPE_LOCK_CONFLICT,
      details: {
        scope_key: scope.scope_key,
        owner_request_id: plain.owner_request_id
      }
    });
  });
}

async function acquireScopes(scopes, ownerRequestId, ownerDedupKey) {
  const orderedScopes = toDeterministicScopes(scopes);
  for (const scope of orderedScopes) {
    let acquired = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await acquireSingleScope(scope, ownerRequestId, ownerDedupKey);
        acquired = true;
        break;
      } catch (error) {
        if (isDeadlockError(error)) {
          continue;
        }
        throw error;
      }
    }
    if (!acquired) {
      throw new AppError("Scope lock conflict after deadlock retries", {
        statusCode: 409,
        code: ERROR_CODES.SCOPE_LOCK_CONFLICT,
        details: { scope_key: scope.scope_key }
      });
    }
  }
  return orderedScopes;
}

async function releaseOwnerLocks(ownerRequestId) {
  if (!ownerRequestId) return;
  await orchestratorRepository.deleteScopeLocksByOwner(ownerRequestId);
}

module.exports = {
  acquireScopes,
  releaseOwnerLocks,
  toDeterministicScopes
};

