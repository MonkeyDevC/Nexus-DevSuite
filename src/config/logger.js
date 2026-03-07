const pino = require("pino");
const { env } = require("./env");

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: ["req.headers.authorization", "password", "token"],
    censor: "[REDACTED]"
  },
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
