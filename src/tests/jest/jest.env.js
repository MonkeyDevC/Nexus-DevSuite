/**
 * ----
 * Módulo: jest.env
 * Descripción: Fija defaults de entorno para ejecución de Jest sin depender de .env.
 *              Objetivo: suites reproducibles y aisladas del entorno local del desarrollador.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-12
 * ----
 */

const fs = require("node:fs");
const path = require("node:path");

// Si existe .env local, se carga para permitir conexión a MySQL en tests.
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  // eslint-disable-next-line global-require
  require("dotenv").config({ path: envPath });
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

// Por defecto, evita usar la BD de development durante tests.
if (!process.env.DB_NAME) {
  process.env.DB_NAME = "nexus_devsuite_test";
}

