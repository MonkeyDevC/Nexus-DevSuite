"use strict";

/**
 * URLs canónicas para E2E contra Express + build React (puerto 3000 por defecto).
 */
function getBaseUrl() {
  return process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://127.0.0.1:3000";
}

function getApiBaseUrl() {
  return (
    process.env.API_BASE_URL ||
    process.env.E2E_API_BASE_URL ||
    `${getBaseUrl()}/api/v1`
  );
}

/** Credenciales MASTER seed (alineadas a datos de test / CI). */
const DEFAULT_MASTER_LOGIN = Object.freeze({
  email: "admin_nexus@nexus.com",
  password: "Zaq1029*",
});

function getMasterLoginCredentials() {
  return {
    email: process.env.E2E_EMAIL || DEFAULT_MASTER_LOGIN.email,
    password: process.env.E2E_PASSWORD || DEFAULT_MASTER_LOGIN.password,
  };
}

module.exports = {
  getBaseUrl,
  getApiBaseUrl,
  DEFAULT_MASTER_LOGIN,
  getMasterLoginCredentials,
};
