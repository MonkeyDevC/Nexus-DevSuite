const { sequelize } = require("../../config/database");
const { env } = require("../../config/env");
const { buildSuccess, buildError } = require("../../shared/responses/responseLayer");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const CONFIRM_HEADER = "x-confirm-reset";
const CONFIRM_VALUE = "RESET";

// Orden: tablas hijas primero para no violar FKs (alineado a scripts/clean-dummy-data.js)
const TABLES_TO_CLEAR = [
  "document_versions",
  "documents",
  "improvements",
  "change_requests",
  "user_stories",
  "features",
  "sprints",
  "incidents",
  "releases",
  "projects",
  "audit_logs",
  "refresh_tokens",
];

async function devResetDummyDataController(req, res) {
  const requestId = req.requestId || "no-request-id";

  if (env.NODE_ENV !== "development" || env.DEV_DATA_RESET_ENABLED !== true) {
    const { body } = buildError({
      code: ERROR_CODES.FEATURE_DISABLED || "FEATURE_DISABLED",
      message: "Operación deshabilitada.",
      statusCode: 403,
      requestId,
    });
    return res.status(403).json(body);
  }

  const confirm = req.headers[CONFIRM_HEADER];
  if (String(confirm || "") !== CONFIRM_VALUE) {
    const { body } = buildError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: `Confirmación requerida. Enviar header ${CONFIRM_HEADER}: ${CONFIRM_VALUE}`,
      statusCode: 400,
      requestId,
      details: { header: CONFIRM_HEADER },
    });
    return res.status(400).json(body);
  }

  const result = await sequelize.transaction(async (t) => {
    // MySQL: permitir deletes sin pelear con FKs (solo en dev)
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction: t });

    const perTable = {};
    for (const table of TABLES_TO_CLEAR) {
      try {
        const [meta] = await sequelize.query(`DELETE FROM \`${table}\``, { transaction: t });
        // mysql2 devuelve OkPacket con affectedRows; sequelize lo expone en meta
        const affected = meta && typeof meta.affectedRows === "number" ? meta.affectedRows : null;
        perTable[table] = affected;
      } catch (e) {
        // si la tabla no existe en una variante del esquema, omitir en dev
        const code = e && e.original && e.original.code ? e.original.code : e.code;
        if (code === "ER_NO_SUCH_TABLE") {
          perTable[table] = "SKIPPED_NO_TABLE";
          continue;
        }
        throw e;
      }
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction: t });
    return perTable;
  });

  const { body } = buildSuccess({
    data: { cleared: result },
    requestId,
  });
  return res.status(200).json(body);
}

module.exports = {
  devResetDummyDataController,
};

