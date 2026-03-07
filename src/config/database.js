const { Sequelize } = require("sequelize");
const { env } = require("./env");
const logger = require("./logger");

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: env.DB_LOGGING
    ? (sqlMessage) => logger.debug({ sql: sqlMessage }, "Consulta SQL")
    : false,
  timezone: "+00:00"
});

async function connectDatabase() {
  await sequelize.authenticate();
  logger.info("Conexion a MySQL establecida");
}

module.exports = {
  sequelize,
  connectDatabase
};
