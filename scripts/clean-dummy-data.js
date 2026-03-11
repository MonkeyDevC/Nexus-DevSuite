/**
 * -------------------------------------------------------------
 * Script: clean-dummy-data.js
 * Descripción: Elimina los datos de prueba/dummy de la base de datos para
 *              dejar tablas operativas vacías y poder crear datos nuevos
 *              y consistentes. Mantiene roles, usuarios y organizaciones
 *              para que el equipo pueda seguir iniciando sesión.
 * Uso: node scripts/clean-dummy-data.js
 * Requisitos: MySQL en ejecución; .env con DB_*; migraciones ya aplicadas.
 * -------------------------------------------------------------
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mysql = require("mysql2/promise");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "nexus_devsuite";

// Orden: tablas hijas primero para no violar FKs
const TABLES_TO_CLEAR = [
  "document_versions",  // FK -> documents
  "documents",          // FK -> projects, users
  "improvements",       // FK -> projects, incidents, users
  "change_requests",    // FK -> users
  "user_stories",       // FK -> features, sprints, users
  "features",           // FK -> projects, releases, users
  "sprints",            // FK -> projects
  "incidents",          // FK -> projects
  "releases",           // FK -> organizations
  "projects",           // FK -> organizations, users
  "audit_logs",         // FK -> users (log vacío)
  "refresh_tokens"      // FK -> users (obligar nuevo login)
];

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log("Conectado a la base de datos:", DB_NAME);
    console.log("Eliminando datos dummy (se mantienen roles, users, organizations)...\n");

    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of TABLES_TO_CLEAR) {
      try {
        const [result] = await connection.query(`DELETE FROM \`${table}\``);
        const affected = result.affectedRows || 0;
        console.log(`  ${table}: ${affected} fila(s) eliminada(s)`);
      } catch (err) {
        if (err.code === "ER_NO_SUCH_TABLE") {
          console.log(`  ${table}: (tabla no existe, omitiendo)`);
        } else {
          throw err;
        }
      }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\nLimpieza completada. Puedes crear datos nuevos desde la app.");
  } catch (err) {
    console.error("Error:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("Comprueba que MySQL esté en ejecución en %s:%s", DB_HOST, DB_PORT);
    }
    if (err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ER_BAD_DB_ERROR") {
      console.error("Comprueba DB_USER, DB_PASSWORD y DB_NAME en .env");
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
