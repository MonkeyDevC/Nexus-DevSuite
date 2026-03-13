/**
 * ----
 * Módulo: jest.globalTeardown
 * Descripción: Teardown de Jest para NEXUS DevSuite.
 *              No elimina la base de datos por defecto para evitar pérdida accidental
 *              si el entorno está mal configurado. El aislamiento se garantiza por
 *              nombre de BD (nexus_devsuite_test) y por datos generados con marcas de tiempo.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-12
 * ----
 */

async function globalTeardown() {
  let sequelize;
  try {
    // eslint-disable-next-line global-require
    ({ sequelize } = require("../../config/database"));
  } catch (err) {
    return;
  }

  if (sequelize && typeof sequelize.close === "function") {
    await sequelize.close();
  }
}

module.exports = globalTeardown;

