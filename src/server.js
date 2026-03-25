const http = require("http");
const { app, env } = require("./app");
const { connectDatabase, sequelize } = require("./config/database");
const logger = require("./config/logger");
const { loadModels } = require("./infrastructure/db/loadModels");
const { startOutboxDispatcher, stopOutboxDispatcher } = require("./modules/orchestrator/outboxDispatcher.service");
const { getIsShuttingDown, setIsShuttingDown } = require("./shared/shutdownState");

let serverInstance = null;
let isServerListening = false;

async function closeHttpServer() {
  if (!serverInstance || !isServerListening || !serverInstance.listening) {
    return;
  }

  logger.info({ event: "shutdown_http_start" }, "Iniciando cierre del servidor HTTP");

  await new Promise((resolve) => {
    serverInstance.close((error) => {
      if (error) {
        logger.error({ err: error }, "Error al cerrar servidor HTTP");
      } else {
        logger.info({ event: "shutdown_http_done" }, "Servidor HTTP cerrado correctamente");
      }
      isServerListening = false;
      resolve();
    });
  });
}

async function closeDatabase() {
  try {
    await sequelize.close();
    logger.info({ event: "shutdown_db_done" }, "Conexion Sequelize cerrada correctamente");
  } catch (error) {
    logger.error({ err: error }, "Error al cerrar conexion Sequelize");
  }
}

async function shutdown(signal, exitCode) {
  if (getIsShuttingDown()) {
    logger.warn({ signal }, "Shutdown ya en curso, ignorando señal duplicada");
    return;
  }

  setIsShuttingDown(true);
  logger.info({ signal, event: "shutdown_start" }, "Iniciando cierre ordenado de la aplicacion");

  const timeoutMs = env.SHUTDOWN_TIMEOUT_MS || 10000;
  const forceExitTimer = setTimeout(() => {
    logger.fatal({ signal, timeout_ms: timeoutMs }, "Timeout de cierre excedido, forzando salida");
    process.exit(exitCode || 1);
  }, timeoutMs);

  await closeHttpServer();
  stopOutboxDispatcher();
  await closeDatabase();

  clearTimeout(forceExitTimer);
  logger.info({ signal, exitCode, event: "shutdown_end" }, "Aplicacion detenida");
  process.exit(exitCode);
}

async function handleStartupFailure(error, contextMessage) {
  logger.error(
    {
      port: env.PORT,
      code: error && error.code ? error.code : "SERVER_STARTUP_ERROR",
      err: error
    },
    contextMessage
  );
  await closeDatabase();
  process.exit(1);
}

function registerProcessHandlers() {
  process.on("SIGTERM", () => {
    shutdown("SIGTERM", 0);
  });

  process.on("SIGINT", () => {
    shutdown("SIGINT", 0);
  });
}

async function bootstrap() {
  try {
    loadModels(sequelize);
    await connectDatabase();
    serverInstance = http.createServer(app);

    serverInstance.on("listening", () => {
      isServerListening = true;
      if (env.NODE_ENV !== "test") {
        startOutboxDispatcher();
      }
      logger.info({ port: env.PORT }, "Servidor iniciado correctamente");
    });

    serverInstance.on("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        handleStartupFailure(error, "Puerto en uso. Cierre otras instancias o cambie PORT.");
        return;
      }
      handleStartupFailure(error, "Error no controlado al iniciar el servidor HTTP");
    });

    serverInstance.listen(env.PORT);
  } catch (error) {
    await handleStartupFailure(error, "No fue posible iniciar el servidor");
  }
}

registerProcessHandlers();
bootstrap();
