/**
 * ----
 * Modulo: domainWorkCache
 * Descripcion: Cache en memoria (lectura, sin invalidacion en esta fase) y utilidades de validacion para Work Management.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Depuracion controlada: sin salida en produccion; sin console.log.
 */
export function logDev(message, context) {
  if (!import.meta.env.DEV) return;
  if (context !== undefined) {
    console.warn(`[NEXUS] ${message}`, context);
  } else {
    console.warn(`[NEXUS] ${message}`);
  }
}

export function isValidNexusUuid(value) {
  if (value == null || value === "") return false;
  const s = String(value).trim();
  return s.length > 0 && UUID_RE.test(s);
}

const featureProjectCache = Object.create(null);

export function getCachedFeatureProjectId(featureId) {
  if (featureId == null) return null;
  const k = String(featureId).trim();
  if (!k || !UUID_RE.test(k)) return null;
  const v = featureProjectCache[k];
  return typeof v === "string" && v.trim() !== "" && UUID_RE.test(v.trim()) ? v.trim() : null;
}

/**
 * No sobrescribe entrada existente; valida tipos UUID.
 */
export function setCachedFeatureProjectId(featureId, projectId) {
  if (featureId == null || projectId == null) return;
  const fk = String(featureId).trim();
  const pk = String(projectId).trim();
  if (!UUID_RE.test(fk) || !UUID_RE.test(pk)) {
    logDev("featureProjectCache: ids rechazados", { featureId: fk, projectId: pk });
    return;
  }
  if (featureProjectCache[fk] !== undefined) return;
  featureProjectCache[fk] = pk;
}

const projectCache = Object.create(null);

export function getCachedProjectMeta(projectId) {
  if (projectId == null) return null;
  const k = String(projectId).trim();
  if (!UUID_RE.test(k)) return null;
  const v = projectCache[k];
  if (!v || typeof v !== "object") return null;
  const name = typeof v.name === "string" ? v.name.trim() : "";
  if (!name) return null;
  return { name };
}

/**
 * Primera lectura cacheada gana (no sobrescribir).
 */
export function setCachedProjectMeta(projectId, name) {
  if (projectId == null || name == null) return;
  const k = String(projectId).trim();
  const n = String(name).trim();
  if (!UUID_RE.test(k) || !n) return;
  if (projectCache[k] !== undefined) return;
  projectCache[k] = { name: n };
}
