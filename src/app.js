const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { requestContextMiddleware } = require("./middlewares/requestContext.middleware");
const { responseVersionMiddleware } = require("./middlewares/responseVersion.middleware");
const { shutdownGuardMiddleware } = require("./middlewares/shutdownGuard.middleware");
const { metricsMiddleware } = require("./middlewares/metrics.middleware");
const { auditLoggerMiddleware } = require("./middlewares/auditLogger.middleware");
const { idempotencyMiddleware } = require("./middlewares/idempotency.middleware");
const { atomicCommitMiddleware } = require("./middlewares/atomicCommit.middleware");
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

  // En development y test permitimos wildcard explícito para evitar que
  // entornos automatizados (E2E/CI) fallen por políticas CORS al servir el SPA.
  if ((env.NODE_ENV === "development" || env.NODE_ENV === "test") && corsAllowedOrigins.includes("*")) {
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

/** En development/test no aplicar limite global (evita 429 en login/HMR/E2E). Produccion y staging si. */
const rateLimitInDev =
  String(process.env.RATE_LIMIT_IN_DEV || "")
    .trim()
    .toLowerCase() === "true";
const applyGlobalRateLimit =
  rateLimitInDev ||
  (env.NODE_ENV !== "development" && env.NODE_ENV !== "test");

app.disable("x-powered-by");
// Helmet: resto de cabeceras de seguridad (sin CSP por defecto).
app.use(helmet({ contentSecurityPolicy: false }));
// CSP explícita: compatible con Bootstrap CDN. style-src incluye 'unsafe-inline' porque la app usa estilos en línea (nav, vistas, progress bars).
const defaultContentSecurityPolicy = helmet.contentSecurityPolicy({
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
});

/** CSP relajada solo para Swagger UI (bundles inline / eval). Resto de la app mantiene defaultContentSecurityPolicy. */
const swaggerDocsContentSecurityPolicy = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
    imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"]
  }
});

app.use((req, res, next) => {
  const p = req.path || "";
  if (p === "/api-docs" || p === "/api-docs.json" || p.startsWith("/api-docs/")) {
    return swaggerDocsContentSecurityPolicy(req, res, next);
  }
  return defaultContentSecurityPolicy(req, res, next);
});
app.use(
  cors({
    origin: corsOriginPolicy,
    credentials: env.CORS_ALLOW_CREDENTIALS
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(requestContextMiddleware);
app.use(responseVersionMiddleware);
app.use(shutdownGuardMiddleware);
app.use(metricsMiddleware);
app.use(auditLoggerMiddleware);
app.use(idempotencyMiddleware);
app.use(atomicCommitMiddleware);
if (applyGlobalRateLimit) {
  app.use(globalRateLimitMiddleware);
}

/**
 * Estáticos: `public/` incluye el shell SPA (`index.html`) y el build React (`react-app/*`).
 * Orden: estáticos antes de rutas API para que assets no pasen por routers JSON.
 */
app.use(express.static(path.resolve(__dirname, "../public")));
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use("/.well-known", (req, res) => res.status(204).end());

/** API REST (contrato /api/v1). No montar estáticos encima de estos paths. */
app.use(routes);

/**
 * SPA (React BrowserRouter): refresco en rutas internas (/dashboard, /projects, …).
 * Excluye /api/* para no enmascarar 404 de API con HTML.
 */
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  if (req.path.startsWith("/api-docs")) return next();
  if (req.method !== "GET") return next();
  const acceptsHtml =
    typeof req.headers.accept === "string" &&
    req.headers.accept.includes("text/html");
  if (!acceptsHtml) return next();
  return res.sendFile(path.resolve(__dirname, "../public/index.html"));
});
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = {
  app,
  env
};
