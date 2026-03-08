/**
 * -------------------------------------------------------------
 * Script: setup-database.js
 * Descripción: Crea la base de datos MySQL del proyecto si no existe.
 *              Útil para onboarding: primer paso antes de db:migrate.
 * Uso: node scripts/setup-database.js
 * Requisitos: MySQL en ejecución; .env con DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
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

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME.replace(/`/g, "``")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Base de datos "${DB_NAME}" lista (existe o fue creada).`);
  } catch (err) {
    console.error("Error al conectar o crear la base de datos:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("Comprueba que MySQL esté en ejecución en %s:%s", DB_HOST, DB_PORT);
    }
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Comprueba DB_USER y DB_PASSWORD en .env");
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

main();
