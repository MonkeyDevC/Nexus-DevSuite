/**
 * ----
 * Módulo: Idempotency Middleware
 * Descripción: Reserva dedup_key y hace replay de respuestas completadas.
 * Contrato de replay (APEX):
 * - Misma dedup_key + mismo request_hash (method + path + body + query canonicalizados) →
 *   si estado COMPLETED, se devuelve la misma respuesta HTTP y cuerpo almacenados (cabecera X-Idempotent-Replay).
 * - Respuestas 4xx con dedup completan fila como COMPLETED (replay idempotente del error de negocio/validación).
 * - Respuestas 5xx o fallo de infraestructura dejan FAILED: el cliente puede reintentar con la misma clave.
 * - PROCESSING concurrente u otra reserva → 409 IDEMPOTENCY_IN_PROGRESS.
 * - dedup_key distinta petición pero mismo cuerpo distinto → 409 IDEMPOTENCY_KEY_REUSED.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { AppError } = require("../shared/errors/AppError");
const { ERROR_CODES } = require("../shared/errors/errorCodes");
const orchestratorRepository = require("../modules/orchestrator/orchestrator.repository");
const { buildStateHash } = require("../modules/orchestrator/canonicalization.service");
const logger = require("../config/logger");

function resolveDedupKey(req) {
  const headerKey = req.headers["x-dedup-key"];
  if (typeof headerKey === "string" && headerKey.trim()) return headerKey.trim();
  if (req.body && typeof req.body.dedup_key === "string" && req.body.dedup_key.trim()) return req.body.dedup_key.trim();
  return null;
}

function isMutatingMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(String(method || "").toUpperCase());
}

async function idempotencyMiddleware(req, res, next) {
  try {
    if (!isMutatingMethod(req.method)) return next();
    const dedupKey = resolveDedupKey(req);
    if (!dedupKey) return next();

    const requestHash = buildStateHash({
      method: req.method,
      path: req.originalUrl,
      body: req.body || {},
      query: req.query || {}
    });

    const existing = await orchestratorRepository.findIdempotencyByDedupKey(dedupKey);
    if (existing) {
      const row = existing.toJSON ? existing.toJSON() : existing;
      if (row.request_hash !== requestHash) {
        throw new AppError("dedup_key reutilizado con payload diferente", {
          statusCode: 409,
          code: ERROR_CODES.IDEMPOTENCY_KEY_REUSED
        });
      }
      if (row.status === "COMPLETED") {
        res.set("X-Idempotent-Replay", "true");
        return res.status(row.response_status || 200).json(row.response_body || {});
      }
      if (row.status === "PROCESSING") {
        throw new AppError("Solicitud en procesamiento para esta dedup_key", {
          statusCode: 409,
          code: ERROR_CODES.IDEMPOTENCY_IN_PROGRESS
        });
      }
      await orchestratorRepository.updateIdempotency(dedupKey, {
        status: "PROCESSING",
        completed_at: null
      });
    } else {
      try {
        await orchestratorRepository.reserveIdempotency({
          dedup_key: dedupKey,
          method: req.method,
          path: req.originalUrl,
          request_hash: requestHash,
          status: "PROCESSING"
        });
      } catch (error) {
        if (error?.name !== "SequelizeUniqueConstraintError") {
          throw error;
        }
        throw new AppError("Solicitud en procesamiento para esta dedup_key", {
          statusCode: 409,
          code: ERROR_CODES.IDEMPOTENCY_IN_PROGRESS
        });
      }
    }

    req.idempotencyContext = {
      dedup_key: dedupKey,
      request_hash: requestHash,
      completed: false
    };

    res.on("finish", () => {
      if (!req.idempotencyContext || req.idempotencyContext.completed) return;
      if (res.statusCode >= 500) {
        orchestratorRepository
          .updateIdempotency(req.idempotencyContext.dedup_key, {
            status: "FAILED"
          })
          .catch((err) => {
            logger.error(
              {
                event: "APEX_IDEMPOTENCY_FINISH_ERROR",
                dedup_key: req.idempotencyContext.dedup_key,
                request_id: req.requestId || "no-request-id",
                err: {
                  name: err?.name,
                  message: err?.message
                }
              },
              "Fallo al marcar idempotency como FAILED tras respuesta 5xx"
            );
          });
      }
    });

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  idempotencyMiddleware
};

