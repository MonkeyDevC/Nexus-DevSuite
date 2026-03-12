/**
 * ----
 * Módulo: jest.globalSetup
 * Descripción: Prepara base de datos para tests de integración.
 *              Crea la BD de test si no existe, ejecuta migraciones y seed.
 *              Esto garantiza que las suites no dependan de pasos manuales.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-12
 * ----
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

function execSequelizeCli(args, env) {
  execFileSync("npx", ["sequelize-cli", ...args], {
    env,
    stdio: "inherit",
    shell: true
  });
}

async function ensureDatabaseExists({ host, port, user, password, database }) {
  const connection = await mysql.createConnection({ host, port, user, password });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${String(database).replaceAll("`", "``")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function globalSetup() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    // En globalSetup todavía no aplica setupFiles, así que cargamos .env acá.
    // eslint-disable-next-line global-require
    require("dotenv").config({ path: envPath });
  }

  const env = {
    ...process.env,
    NODE_ENV: "test",
    DB_NAME: process.env.DB_NAME || "nexus_devsuite_test"
  };

  const host = env.DB_HOST || "localhost";
  const port = Number(env.DB_PORT) || 3306;
  const user = env.DB_USER || "root";
  const password = env.DB_PASSWORD || "";
  const database = env.DB_NAME;

  await ensureDatabaseExists({ host, port, user, password, database });

  execSequelizeCli(["db:migrate", "--env", "test"], env);
  execSequelizeCli(["db:seed:all", "--env", "test"], env);
}

module.exports = globalSetup;

