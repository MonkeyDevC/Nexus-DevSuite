/**

 * ----

 * Módulo: Atomic Commit Middleware

 * Descripción: Reserva y confirma commit_ledger por dedup_key, genera hash before/after y encola outbox.

 * Semántica: respuestas 2xx validan hash global y generan outbox; 4xx completan idempotencia (replay)

 * sin outbox ni validación de hash global; 5xx marcan idempotency FAILED (reintento permitido).

 * Autor: Agente NEXUS

 * Fecha: 2026-03-23

 * ----

 */



const crypto = require("crypto");

const { env } = require("../config/env");

const logger = require("../config/logger");

const orchestratorRepository = require("../modules/orchestrator/orchestrator.repository");

const { buildStateHash, stableStringify } = require("../modules/orchestrator/canonicalization.service");

const { validateGlobalStateHash } = require("../modules/orchestrator/globalConsistency.service");



function signCommit(payloadHash) {

  return crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(payloadHash, "utf8").digest("hex");

}



function isMutatingMethod(method) {

  return ["POST", "PUT", "PATCH", "DELETE"].includes(String(method || "").toUpperCase());

}



async function atomicCommitMiddleware(req, res, next) {

  try {

    if (!isMutatingMethod(req.method)) return next();

    const dedupKey = req.idempotencyContext?.dedup_key;

    if (!dedupKey) return next();



    const beforeHash = buildStateHash({

      method: req.method,

      path: req.originalUrl,

      params: req.params || {},

      query: req.query || {},

      body: req.body || {}

    });



    const existingLedger = await orchestratorRepository.findCommitLedgerByDedupKey(dedupKey);

    if (!existingLedger) {

      await orchestratorRepository.reserveCommitLedger({

        dedup_key: dedupKey,

        request_id: req.requestId || "no-request-id",

        before_hash: beforeHash,

        status: "PREPARED",

        metadata: { phase: "PREPARE" }

      });

    }



    let responseBody = null;

    const originalJson = res.json.bind(res);

    res.json = (body) => {

      responseBody = body;

      return originalJson(body);

    };



    res.on("finish", async () => {

      if (!req.idempotencyContext) return;

      if (req.idempotencyContext.completed) return;



      const afterHash = buildStateHash({

        status_code: res.statusCode,

        response: responseBody || {}

      });

      const signature = signCommit(afterHash);

      const finishSuccess = res.statusCode >= 200 && res.statusCode < 500;

      const businessSuccess = res.statusCode >= 200 && res.statusCode < 300;

      const expectedGlobalHashHeader = req.headers["x-expected-global-hash"];

      const expectedGlobalHash =

        typeof expectedGlobalHashHeader === "string" && expectedGlobalHashHeader.trim()

          ? expectedGlobalHashHeader.trim()

          : null;



      try {

        const committedRow = await orchestratorRepository.updateCommitLedger(dedupKey, {

          after_hash: afterHash,

          status: finishSuccess ? "COMMITTED" : "ABORTED",

          signature,

          metadata: {

            phase: finishSuccess ? "COMMIT" : "ABORT",

            status_code: res.statusCode,

            response_hash_source: stableStringify(responseBody || {})

          }

        });



        if (!finishSuccess) {

          await orchestratorRepository.updateIdempotency(dedupKey, {

            status: "FAILED"

          });

          req.idempotencyContext.completed = true;

          return;

        }



        if (businessSuccess) {

          const globalHashResult = await validateGlobalStateHash(expectedGlobalHash);

          const hasMismatch = Boolean(expectedGlobalHash && expectedGlobalHash !== globalHashResult.global_state_hash);

          const commitLedgerId = committedRow ? committedRow.id : null;



          if (hasMismatch) {

            await orchestratorRepository.updateCommitLedger(dedupKey, {

              status: "ABORTED",

              metadata: {

                phase: "CRITICAL_FAIL",

                expected_global_hash: expectedGlobalHash,

                actual_global_hash: globalHashResult.global_state_hash

              }

            });

            await orchestratorRepository.updateIdempotency(dedupKey, {

              status: "FAILED"

            });

            logger.fatal(

              {

                event: "CRITICAL_FAIL",

                dedup_key: dedupKey,

                request_id: req.requestId || "no-request-id",

                expected_global_hash: expectedGlobalHash,

                actual_global_hash: globalHashResult.global_state_hash

              },

              "Global hash mismatch detected after commit"

            );

            req.idempotencyContext.completed = true;

            return;

          }



          await orchestratorRepository.updateCommitLedger(dedupKey, {

            metadata: {

              phase: "COMMIT_VALIDATED",

              status_code: res.statusCode,

              response_hash_source: stableStringify(responseBody || {}),

              global_state_hash: globalHashResult.global_state_hash,

              tables_count: globalHashResult.tables_count

            }

          });

          await orchestratorRepository.updateIdempotency(dedupKey, {

            status: "COMPLETED",

            response_status: res.statusCode,

            response_body: responseBody || {},

            completed_at: new Date()

          });

          await orchestratorRepository.enqueueOutbox({

            dedup_key: dedupKey,

            commit_ledger_id: commitLedgerId,

            event_type: "HTTP_MUTATION_COMMITTED",

            payload: {

              request_id: req.requestId || "no-request-id",

              method: req.method,

              path: req.originalUrl,

              status_code: res.statusCode,

              before_hash: beforeHash,

              after_hash: afterHash

            },

            status: "PENDING"

          });

        } else {

          await orchestratorRepository.updateCommitLedger(dedupKey, {

            metadata: {

              phase: "COMMITTED_CLIENT_REJECTED",

              status_code: res.statusCode,

              response_hash_source: stableStringify(responseBody || {})

            }

          });

          await orchestratorRepository.updateIdempotency(dedupKey, {

            status: "COMPLETED",

            response_status: res.statusCode,

            response_body: responseBody || {},

            completed_at: new Date()

          });

        }

        req.idempotencyContext.completed = true;

      } catch (err) {

        logger.error(

          {

            event: "APEX_ATOMIC_COMMIT_FINISH_ERROR",

            dedup_key: dedupKey,

            request_id: req.requestId || "no-request-id",

            err: {

              name: err?.name,

              message: err?.message

            }

          },

          "Fallo al finalizar atomic commit tras enviar respuesta HTTP"

        );

      }

    });



    return next();

  } catch (error) {

    return next(error);

  }

}



module.exports = {

  atomicCommitMiddleware

};

