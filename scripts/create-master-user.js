/**
 * Script de una sola ejecución: crea o actualiza el usuario MASTER con las credenciales
 * indicadas en docs/PROMPT_MASTER_DEVELOPER_CREAR_USUARIO_MAESTRO.md
 *
 * Uso: node scripts/create-master-user.js
 * Requisitos: .env con DB_*; migraciones y seed de roles ejecutados (npm run db:migrate, npm run db:seed).
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const MASTER_EMAIL = "admin_nexus@nexus.com";
const MASTER_PASSWORD = "Zaq1029*";

async function main() {
  const { sequelize } = require("../src/config/database");

  try {
    await sequelize.authenticate();
  } catch (err) {
    console.error("Error conectando a la base de datos:", err.message);
    process.exit(1);
  }

  const [roles] = await sequelize.query(
    "SELECT id FROM roles WHERE name = 'MASTER' LIMIT 1"
  );
  if (!roles.length) {
    console.error("No existe el rol MASTER. Ejecuta antes: npm run db:seed");
    process.exit(1);
  }
  const masterRoleId = roles[0].id;

  let organizationId = null;
  try {
    const [orgs] = await sequelize.query(
      "SELECT id FROM organizations WHERE slug = 'default' LIMIT 1"
    );
    if (orgs.length) organizationId = orgs[0].id;
  } catch (_) {
    // Tabla organizations puede no existir (pre Etapa 10)
  }

  const [existing] = await sequelize.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    { replacements: [MASTER_EMAIL] }
  );

  const passwordHash = await bcrypt.hash(MASTER_PASSWORD, 10);
  const now = new Date();

  if (existing.length) {
    const updateFields = [
      "password_hash = ?",
      "role_id = ?",
      "is_active = 1",
      "updated_at = ?"
    ];
    const replacements = [passwordHash, masterRoleId, now];
    if (organizationId !== null) {
      updateFields.push("organization_id = ?");
      replacements.push(organizationId);
    }
    replacements.push(MASTER_EMAIL);
    await sequelize.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE email = ?`,
      { replacements }
    );
    console.log("Usuario MASTER actualizado:", MASTER_EMAIL);
  } else {
    const userId = crypto.randomUUID();
    const insertRow = {
      id: userId,
      email: MASTER_EMAIL,
      password_hash: passwordHash,
      role_id: masterRoleId,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    if (organizationId !== null) insertRow.organization_id = organizationId;

    const cols = Object.keys(insertRow).join(", ");
    const placeholders = Object.keys(insertRow).map(() => "?").join(", ");
    await sequelize.query(
      `INSERT INTO users (${cols}) VALUES (${placeholders})`,
      { replacements: Object.values(insertRow) }
    );
    console.log("Usuario MASTER creado:", MASTER_EMAIL);
  }

  await sequelize.close();
  console.log("Listo. Puedes iniciar sesión con:", MASTER_EMAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
