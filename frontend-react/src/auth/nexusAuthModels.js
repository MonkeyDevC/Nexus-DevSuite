/**
 * Modelo de usuario autenticado expuesto por GET /auth/me (éxito → data).
 * Fuente backend: src/modules/auth/context.controller.js + authenticate.middleware (role = nombre de rol).
 *
 * No existe hoy array `permissions` en la API; si el backend lo agrega, hasPermission() lo respetará primero.
 *
 * @typedef {Object} NexusAuthUser
 * @property {number|string} id
 * @property {string} email
 * @property {string|null} role Nombre del rol (p. ej. "MASTER", "EMPLOYEE").
 * @property {string|null} [name]
 * @property {string|null} [profile_photo_url]
 * @property {string[]} [permissions] Opcional futuro: claves de permiso explícitas.
 */

export {};
