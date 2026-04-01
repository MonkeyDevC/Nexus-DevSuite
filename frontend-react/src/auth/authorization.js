/**
 * Autorización frontend alineada con authorizeMiddleware y reglas de servicio en backend.
 * Referencias: projects.routes.js, stories.routes.js, feature.routes.js, sprint.routes.js,
 * incident.routes.js, incident.service.js (cierre), release.routes.js.
 */

/** @typedef {import("./nexusAuthModels.js").NexusAuthUser} NexusAuthUser */

export const ROLE_MASTER = "MASTER";
export const ROLE_EMPLOYEE = "EMPLOYEE";

/**
 * @param {NexusAuthUser | null | undefined} user
 * @returns {string | null}
 */
export function normalizeRole(user) {
  const r = user?.role;
  if (r == null) return null;
  const s = String(r).trim();
  return s || null;
}

/**
 * @param {NexusAuthUser | null | undefined} user
 * @param {...string} allowedRoles
 */
export function hasRole(user, ...allowedRoles) {
  const role = normalizeRole(user);
  if (!role || allowedRoles.length === 0) return false;
  return allowedRoles.includes(role);
}

/**
 * Mapa permiso → roles permitidos. Ampliar cuando el backend exponga permisos granulares.
 * @type {Record<string, readonly string[]>}
 */
const PERMISSION_ROLES = Object.freeze({
  "admin:access": [ROLE_MASTER],

  "project:create": [ROLE_MASTER],
  "project:read": [ROLE_MASTER, ROLE_EMPLOYEE],
  "project:update": [ROLE_MASTER],
  "project:archive": [ROLE_MASTER],
  "project:delete": [ROLE_MASTER],

  /** POST /projects/:projectId/sprints y POST /sprints (raíz). */
  "sprint:create": [ROLE_MASTER],
  /** PUT/PATCH/start/close/delete sprint (rutas bajo /sprints). */
  "sprint:manage": [ROLE_MASTER, ROLE_EMPLOYEE],

  "backlog:reorder": [ROLE_MASTER, ROLE_EMPLOYEE],

  "incident:create": [ROLE_MASTER, ROLE_EMPLOYEE],
  "incident:edit": [ROLE_MASTER, ROLE_EMPLOYEE],
  "incident:transition": [ROLE_MASTER, ROLE_EMPLOYEE],
  "incident:delete": [ROLE_MASTER, ROLE_EMPLOYEE],
  /** Regla de dominio: incident.service.js (cierre solo MASTER). */
  "incident:close": [ROLE_MASTER],

  "feature:write": [ROLE_MASTER, ROLE_EMPLOYEE],
  "story:write": [ROLE_MASTER, ROLE_EMPLOYEE],
  /** POST assign-release / remove-release (stories.routes.js). */
  "story:release_link": [ROLE_MASTER],

  /** Módulo releases (release.routes.js): solo MASTER en todas las rutas. */
  "release:access": [ROLE_MASTER],
});

/**
 * @param {NexusAuthUser | null | undefined} user
 * @param {string} permissionKey
 */
export function hasPermission(user, permissionKey) {
  if (!user || !permissionKey) return false;
  const explicit = user.permissions;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit.includes(permissionKey);
  }
  const roles = PERMISSION_ROLES[permissionKey];
  if (!roles) return false;
  return hasRole(user, ...roles);
}

/**
 * Alias semántico para acciones de UI (misma resolución que hasPermission).
 * @param {NexusAuthUser | null | undefined} user
 * @param {string} actionKey
 */
export function canPerform(user, actionKey) {
  return hasPermission(user, actionKey);
}

/**
 * Requisitos por clave de ruta de producto (no path literal).
 * Rutas no listadas: solo requieren autenticación.
 * @type {Record<string, string>}
 */
const ROUTE_PERMISSION = Object.freeze({
  admin: "admin:access",
  /** Misma política que legacy settings.js (solo MASTER). */
  settings: "admin:access",
  releases: "release:access",
});

/**
 * @param {NexusAuthUser | null | undefined} user
 * @param {string} routeKey
 */
export function canAccessRoute(user, routeKey) {
  if (!routeKey) return true;
  const perm = ROUTE_PERMISSION[routeKey];
  if (!perm) return true;
  return hasPermission(user, perm);
}
