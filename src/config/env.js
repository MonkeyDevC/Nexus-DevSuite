const dotenv = require("dotenv");

dotenv.config();

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function asBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
}

const NODE_ENV = process.env.NODE_ENV || "development";
const isDevelopment = NODE_ENV === "development";
const isTest = NODE_ENV === "test";
const isNonProduction = isDevelopment || isTest;

function getEnvValue(name) {
  const value = process.env[name];
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function isWeakSecret(value) {
  if (!value) return true;
  return (
    value === "dev_access_secret_change_me" ||
    value === "dev_refresh_secret_change_me" ||
    value.startsWith("replace_with_")
  );
}

function getCriticalSecret(name, developmentFallback) {
  const value = getEnvValue(name);

  if (value) {
    if (!isNonProduction && isWeakSecret(value)) {
      throw new Error(
        `[ENV] La variable ${name} usa un valor inseguro para ${NODE_ENV}. Defina un secreto robusto antes de iniciar.`
      );
    }
    return value;
  }

  if (isNonProduction) {
    // En development y test se permite fallback para facilitar bootstrap local y ejecución de suites.
    return developmentFallback;
  }

  throw new Error(`[ENV] La variable requerida ${name} no esta definida para ${NODE_ENV}.`);
}

function getRequiredNoDevelopment(name, developmentFallback = "") {
  const value = getEnvValue(name);
  if (value) {
    return value;
  }

  if (isNonProduction) {
    return developmentFallback;
  }

  throw new Error(`[ENV] La variable requerida ${name} no esta definida para ${NODE_ENV}.`);
}

const env = {
  NODE_ENV,
  PORT: asNumber(process.env.PORT, 3000),
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: asNumber(process.env.DB_PORT, 3306),
  DB_NAME: process.env.DB_NAME || "nexus_devsuite",
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_LOGGING: process.env.DB_LOGGING === "true",
  DB_SKIP_AUTH_ON_STARTUP: asBoolean(process.env.DB_SKIP_AUTH_ON_STARTUP, false),
  JWT_ACCESS_SECRET: getCriticalSecret("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  JWT_REFRESH_SECRET: getCriticalSecret("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  MASTER_EMAIL: process.env.MASTER_EMAIL || "master@nexus.local",
  MASTER_PASSWORD: getRequiredNoDevelopment("MASTER_PASSWORD", "Master123!"),
  CORS_ALLOWED_ORIGINS: getRequiredNoDevelopment("CORS_ALLOWED_ORIGINS", "*"),
  CORS_ALLOW_CREDENTIALS: asBoolean(process.env.CORS_ALLOW_CREDENTIALS, false),
  RATE_LIMIT_WINDOW_MS: asNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX: (() => {
    const raw = asNumber(process.env.RATE_LIMIT_MAX, isDevelopment ? 10000 : 200);
    // En desarrollo: mínimo 1000 para evitar bloqueos durante pruebas locales
    return isDevelopment && raw < 1000 ? 1000 : raw;
  })(),
  /**
   * Herramientas peligrosas de desarrollo (hard gate).
   * - Solo se montan rutas si NODE_ENV=development
   * - Además requiere esta flag explícita para evitar borrados accidentales
   */
  DEV_DATA_RESET_ENABLED: asBoolean(process.env.DEV_DATA_RESET_ENABLED, false),
  SHUTDOWN_TIMEOUT_MS: asNumber(process.env.SHUTDOWN_TIMEOUT_MS, 10000),
  SUBDOMAIN_BASE: getEnvValue("SUBDOMAIN_BASE") || ""
};

module.exports = {
  env
};
