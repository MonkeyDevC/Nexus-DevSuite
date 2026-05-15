#!/usr/bin/env node
/**
 * Genera el spec OpenAPI y valida con @apidevtools/swagger-parser (evita problemas de rutas con espacios en Windows).
 * Opcional: `npx swagger-cli validate openapi.generated.json` desde el directorio del proyecto.
 */
const fs = require("fs");
const path = require("path");
const SwaggerParser = require("@apidevtools/swagger-parser");

process.chdir(path.join(__dirname, ".."));

require("dotenv").config();
const swaggerModulePath = require.resolve("../src/config/swagger.js");
delete require.cache[swaggerModulePath];
const envModulePath = require.resolve("../src/config/env.js");
delete require.cache[envModulePath];

const { buildSwaggerSpec, invalidateSwaggerCache } = require("../src/config/swagger");
invalidateSwaggerCache();
const spec = buildSwaggerSpec();

const outPath = path.join(__dirname, "..", "openapi.generated.json");
fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), "utf8");

SwaggerParser.validate(spec)
  .then(() => {
    console.log("OpenAPI 3.0.3 válido:", outPath);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Validación OpenAPI fallida:", err.message || err);
    process.exit(1);
  });
