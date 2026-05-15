/**
 * Utilidades puras: clonado y comparación draft vs SSOT del proyecto.
 * Sin efectos; apto para tests.
 */

function shallowEqualStringArrays(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i] ?? "").trim() !== String(b[i] ?? "").trim()) return false;
  }
  return true;
}

/**
 * Copia editable para el workspace (campos que pueden ir en PATCH).
 * @param {object} projectRow — DTO normalizado `normalizeProjectDto`
 */
export function buildProjectDraftFromServer(projectRow) {
  if (!projectRow || typeof projectRow !== "object") return null;
  const st = String(projectRow.status || "ACTIVE").toUpperCase();
  const status = st === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  return {
    id: projectRow.id,
    name: String(projectRow.name || ""),
    description: String(projectRow.description || ""),
    status,
    acceptance_criteria: Array.isArray(projectRow.acceptance_criteria)
      ? [...projectRow.acceptance_criteria]
      : [],
    implementation_criteria: Array.isArray(projectRow.implementation_criteria)
      ? [...projectRow.implementation_criteria]
      : [],
  };
}

/**
 * @param {ReturnType<typeof buildProjectDraftFromServer>} draft
 * @param {ReturnType<typeof buildProjectDraftFromServer>} serverDraftShape — mismo shape que draft, valores desde projectData
 */
export function isProjectWorkspaceDirty(draft, serverDraftShape) {
  if (!draft || !serverDraftShape) return false;
  if (String(draft.status || "ACTIVE") !== String(serverDraftShape.status || "ACTIVE")) return true;
  if (String(draft.name || "").trim() !== String(serverDraftShape.name || "").trim()) return true;
  if (String(draft.description || "") !== String(serverDraftShape.description || "")) return true;
  if (!shallowEqualStringArrays(draft.acceptance_criteria, serverDraftShape.acceptance_criteria)) return true;
  if (!shallowEqualStringArrays(draft.implementation_criteria, serverDraftShape.implementation_criteria)) {
    return true;
  }
  return false;
}

/**
 * Payload para `updateProject`: siempre incluye expected_version y campos editables actuales.
 */
export function buildProjectUpdatePayload(draft, expectedVersion) {
  const status = String(draft.status || "ACTIVE").toUpperCase() === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
  return {
    name: String(draft.name || "").trim().replace(/\s+/g, " "),
    description: String(draft.description || ""),
    status,
    acceptance_criteria: Array.isArray(draft.acceptance_criteria) ? [...draft.acceptance_criteria] : [],
    implementation_criteria: Array.isArray(draft.implementation_criteria) ? [...draft.implementation_criteria] : [],
    expected_version: expectedVersion,
  };
}
