const pino = require("pino");
const { env } = require("./env");

const logLevel = process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "info");
const logger = pino({
  level: logLevel,
  redact: {
    paths: ["req.headers.authorization", "password", "token"],
    censor: "[REDACTED]"
  },
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
