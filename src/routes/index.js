const express = require("express");
const swaggerUi = require("swagger-ui-express");
const v1Routes = require("./v1.routes");
const { buildSwaggerSpec } = require("../config/swagger");
const { env } = require("../config/env");

const router = express.Router();

if (env.SWAGGER_ENABLED) {
  const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: "Nexus DevSuite API",
    persistAuthorization: true
  };

  router.get("/api-docs.json", (req, res) => {
    res.json(buildSwaggerSpec());
  });

  router.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(buildSwaggerSpec(), swaggerUiOptions)
  );
}

router.use("/api/v1", v1Routes);

module.exports = router;
