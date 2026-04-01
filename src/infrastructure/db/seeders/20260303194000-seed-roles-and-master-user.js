"use strict";

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();

module.exports = {
  async up(queryInterface) {
    const roleMasterId = crypto.randomUUID();
    const roleEmployeeId = crypto.randomUUID();
    const masterUserId = crypto.randomUUID();
    const legacyAdminUserId = crypto.randomUUID();

    const masterEmail = process.env.MASTER_EMAIL || "master@nexus.local";
    const masterPassword = process.env.MASTER_PASSWORD || "Master123!";
    // Compatibilidad E2E: varias suites usan estas credenciales fijas.
    // Mantenerlas en seed evita que la validación dependa de data local manual.
    const legacyAdminEmail = process.env.E2E_ADMIN_EMAIL || "admin_nexus@nexus.com";
    const legacyAdminPassword = process.env.E2E_ADMIN_PASSWORD || "Zaq1029*";

    const [existingRoles] = await queryInterface.sequelize.query(
      "SELECT name FROM roles WHERE name IN ('MASTER', 'EMPLOYEE')"
    );

    const roleNames = new Set(existingRoles.map((row) => row.name));

    const rolesToInsert = [];
    if (!roleNames.has("MASTER")) {
      rolesToInsert.push({
        id: roleMasterId,
        name: "MASTER",
        description: "Rol maestro con acceso total"
      });
    }
    if (!roleNames.has("EMPLOYEE")) {
      rolesToInsert.push({
        id: roleEmployeeId,
        name: "EMPLOYEE",
        description: "Rol base de empleado"
      });
    }

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert("roles", rolesToInsert);
    }

    const [masterRoleRows] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'MASTER' LIMIT 1"
    );

    if (!masterRoleRows.length) {
      throw new Error("No se encontro el rol MASTER para crear usuario inicial");
    }

    const masterRoleId = masterRoleRows[0].id;
    const [existingMasterUsers] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      { replacements: [masterEmail] }
    );

    if (!existingMasterUsers.length) {
      const passwordHash = await bcrypt.hash(masterPassword, 10);
      await queryInterface.bulkInsert("users", [
        {
          id: masterUserId,
          email: masterEmail,
          password_hash: passwordHash,
          role_id: masterRoleId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    const [existingLegacyAdminUsers] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      { replacements: [legacyAdminEmail] }
    );
    if (!existingLegacyAdminUsers.length) {
      const passwordHash = await bcrypt.hash(legacyAdminPassword, 10);
      await queryInterface.bulkInsert("users", [
        {
          id: legacyAdminUserId,
          email: legacyAdminEmail,
          password_hash: passwordHash,
          role_id: masterRoleId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  },

  async down(queryInterface) {
    const masterEmail = process.env.MASTER_EMAIL || "master@nexus.local";
    const legacyAdminEmail = process.env.E2E_ADMIN_EMAIL || "admin_nexus@nexus.com";

    await queryInterface.bulkDelete("users", { email: masterEmail });
    await queryInterface.bulkDelete("users", { email: legacyAdminEmail });
    await queryInterface.bulkDelete("roles", { name: ["MASTER", "EMPLOYEE"] });
  }
};
