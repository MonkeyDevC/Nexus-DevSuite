const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const { name, version } = require("../../package.json");
const { env } = require("./env");
const { components } = require("./swagger.components");

const servers = [{ url: "/api/v1", description: "API v1 (relative)" }];
const base = String(env.PUBLIC_API_BASE_URL || "").trim();
if (base) {
  servers.push({
    url: base.replace(/\/$/, ""),
    description: "API v1 (absolute, PUBLIC_API_BASE_URL)"
  });
}

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: `${name} — API v1`,
      version: version || "0.1.0",
      description:
        "Radiografía y contrato REST bajo `/api/v1`. Documentación orientada a auditoría: duplicados y rutas alternativas se indican en las descripciones. Validar siempre contra controladores y Response Layer v1."
    },
    servers,
    components,
    tags: [
      { name: "Auth", description: "Autenticación JWT" },
      { name: "Users", description: "Usuarios" },
      { name: "Projects", description: "Proyectos y rutas anidadas bajo proyecto" },
      { name: "Features", description: "Features (global y anidadas)" },
      { name: "Stories", description: "Historias de usuario" },
      { name: "Incidents", description: "Incidentes" },
      { name: "Releases", description: "Releases" },
      { name: "Sprints", description: "Sprints" },
      { name: "Dashboard", description: "Dashboard" },
      { name: "Documentation", description: "Documentación de plataforma" },
      { name: "Documents", description: "Documentos ISO" },
      { name: "Reports", description: "Informes" },
      { name: "System", description: "Sistema y métricas" }
    ]
  },
  apis: [
    path.join(__dirname, "swagger.openapi.wave1.js"),
    path.join(__dirname, "../modules/**/*.routes.js"),
    path.join(__dirname, "../routes/**/*.js")
  ]
};

let cachedSpec = null;

/**
 * Genera el documento OpenAPI (swagger-jsdoc).
 * En producción se cachea salvo SWAGGER_RELOAD=true.
 */
function ensureResponseDescriptions(spec) {
  if (!spec.paths || typeof spec.paths !== "object") {
    return spec;
  }
  for (const pathItem of Object.values(spec.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const key of Object.keys(pathItem)) {
      if (key === "parameters" || key === "servers" || key === "summary" || key === "description") continue;
      const op = pathItem[key];
      if (!op || typeof op !== "object" || !op.responses) continue;
      for (const [code, resp] of Object.entries(op.responses)) {
        if (resp && typeof resp === "object" && !resp.description) {
          resp.description = `HTTP ${code}`;
        }
      }
    }
  }
  return spec;
}

function buildSwaggerSpec() {
  if (cachedSpec && !env.SWAGGER_RELOAD) {
    return cachedSpec;
  }
  const spec = ensureResponseDescriptions(swaggerJsdoc(options));
  if (!env.SWAGGER_RELOAD) {
    cachedSpec = spec;
  }
  return spec;
}

function invalidateSwaggerCache() {
  cachedSpec = null;
}

module.exports = {
  buildSwaggerSpec,
  invalidateSwaggerCache
};
