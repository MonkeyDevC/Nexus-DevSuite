const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { requestContextMiddleware } = require("./middlewares/requestContext.middleware");
const { responseVersionMiddleware } = require("./middlewares/responseVersion.middleware");
const { shutdownGuardMiddleware } = require("./middlewares/shutdownGuard.middleware");
const { metricsMiddleware } = require("./middlewares/metrics.middleware");
const { auditLoggerMiddleware } = require("./middlewares/auditLogger.middleware");
const { notFoundMiddleware } = require("./middlewares/notFound.middleware");
const { errorHandlerMiddleware } = require("./middlewares/errorHandler.middleware");
const { env } = require("./config/env");
const logger = require("./config/logger");
const { buildError } = require("./shared/responses/responseLayer");
const { ERROR_CODES } = require("./shared/errors/errorCodes");

const app = express();
const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOriginPolicy(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  if (env.NODE_ENV === "development" && corsAllowedOrigins.includes("*")) {
    return callback(null, true);
  }

  if (corsAllowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  const error = new Error("Origen no permitido por politica CORS");
  error.statusCode = 403;
  return callback(error);
}

const globalRateLimitMiddleware = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId = req.requestId || "no-request-id";
    logger.warn(
      { request_id: requestId, path: req.originalUrl, ip: req.ip },
      "Rate limit excedido"
    );
    const { body } = buildError({
      code: ERROR_CODES.AUTH_RATE_LIMIT_EXCEEDED,
      message: "Demasiadas solicitudes, intente nuevamente mas tarde.",
      statusCode: 429,
      requestId
    });
    res.status(429).json(body);
  }
});

app.disable("x-powered-by");
// Helmet: resto de cabeceras de seguridad (sin CSP por defecto).
app.use(helmet({ contentSecurityPolicy: false }));
// CSP explícita: compatible con Bootstrap CDN. style-src incluye 'unsafe-inline' porque la app usa estilos en línea (nav, vistas, progress bars).
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  })
);
app.use(
  cors({
    origin: corsOriginPolicy,
    credentials: env.CORS_ALLOW_CREDENTIALS
  })
);
app.use(express.json());
app.use(requestContextMiddleware);
app.use(responseVersionMiddleware);
app.use(shutdownGuardMiddleware);
app.use(metricsMiddleware);
app.use(auditLoggerMiddleware);
app.use(globalRateLimitMiddleware);
app.use(express.static("public"));
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use("/.well-known", (req, res) => res.status(204).end());
app.use(routes);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = {
  app,
  env
};
