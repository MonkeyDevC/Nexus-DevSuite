/**
 * Reglas de dominio: refinement_status (preparación) vs status (ejecución).
 * Sin efectos secundarios salvo throw AppError.
 */

const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const REFINEMENT_RANK = Object.freeze({
  IDEA: 0,
  DRAFT: 1,
  REFINED: 2,
  READY: 3
});

const EXECUTION_ADVANCED_STATUSES = new Set(["IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"]);

function refinementRank(value) {
  if (value == null) return -1;
  const key = String(value).trim();
  return Object.prototype.hasOwnProperty.call(REFINEMENT_RANK, key) ? REFINEMENT_RANK[key] : -1;
}

function hasSprintAssigned(sprint_id) {
  return sprint_id != null && String(sprint_id).trim() !== "";
}

/**
 * Invariantes de coherencia entre status (ejecución), refinement_status y sprint_id.
 * @param {{ status: string, refinement_status: string, sprint_id?: string|null }} row
 */
function assertRefinementStatusCoherence(row) {
  const status = row.status != null ? String(row.status).trim() : "";
  const refinement_status =
    row.refinement_status != null ? String(row.refinement_status).trim() : "";
  if (EXECUTION_ADVANCED_STATUSES.has(status) && refinementRank(refinement_status) < refinementRank("REFINED")) {
    throw new AppError(
      "Estado de ejecución avanzado exige refinamiento REFINED o READY",
      {
        statusCode: 400,
        code: ERROR_CODES.STORY_STATUS_REFINEMENT_INCOHERENT,
        details: { status, refinement_status }
      }
    );
  }
  if (hasSprintAssigned(row.sprint_id) && refinement_status !== "READY") {
    throw new AppError(
      "Historia asignada a sprint debe tener refinement_status READY",
      {
        statusCode: 400,
        code: ERROR_CODES.STORY_STATUS_REFINEMENT_INCOHERENT,
        details: { refinement_status, sprint_id: row.sprint_id }
      }
    );
  }
}

/**
 * Transición de refinamiento: solo avance de rank (o igual), salvo override MASTER.
 * @param {string} from
 * @param {string} to
 * @param {boolean} isMasterOverride
 */
function assertRefinementTransitionAllowed(from, to, isMasterOverride) {
  if (isMasterOverride) return;
  const rFrom = refinementRank(from);
  const rTo = refinementRank(to);
  if (rFrom < 0 || rTo < 0) {
    throw new AppError("refinement_status inválido", {
      statusCode: 400,
      code: ERROR_CODES.STORY_REFINEMENT_INVALID_TRANSITION,
      details: { from, to }
    });
  }
  if (rTo < rFrom) {
    throw new AppError("No se permite retroceder refinement_status", {
      statusCode: 400,
      code: ERROR_CODES.STORY_REFINEMENT_INVALID_TRANSITION,
      details: { from, to }
    });
  }
}

/**
 * @param {object} story — fila actual (Sequelize o plain)
 * @param {object} patch — campos a aplicar (solo definidos)
 */
function assertCoherenceAfterPatch(story, patch) {
  const status = patch.status !== undefined ? patch.status : story.status;
  const refinement_status =
    patch.refinement_status !== undefined ? patch.refinement_status : story.refinement_status;
  const sprint_id = patch.sprint_id !== undefined ? patch.sprint_id : story.sprint_id;
  assertRefinementStatusCoherence({
    status,
    refinement_status,
    sprint_id
  });
}

module.exports = {
  REFINEMENT_RANK,
  EXECUTION_ADVANCED_STATUSES,
  refinementRank,
  assertRefinementStatusCoherence,
  assertRefinementTransitionAllowed,
  assertCoherenceAfterPatch
};
