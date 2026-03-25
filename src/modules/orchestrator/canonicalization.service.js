/**
 * ----
 * Módulo: Canonicalization Service
 * Descripción: Canonicaliza payloads y genera hash determinista SHA-256.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const crypto = require("crypto");

function normalizeNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  return Number(value).toFixed(10);
}

function canonicalize(value) {
  if (value === null) return "__NULL__";
  if (value === undefined) return "__UNDEFINED__";
  if (typeof value === "number") return normalizeNumber(value);
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    const out = {};
    for (const key of sortedKeys) {
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  return String(value);
}

function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function buildStateHash(value) {
  return crypto.createHash("sha256").update(Buffer.from(stableStringify(value), "utf8")).digest("hex");
}

module.exports = {
  canonicalize,
  stableStringify,
  buildStateHash
};

