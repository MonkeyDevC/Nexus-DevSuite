const express = require("express");
const v1Routes = require("./v1.routes");
const { tenantResolutionMiddleware } = require("../middlewares/tenantResolution.middleware");
const docsExportRoutes = require("../modules/docs-export/docsExport.routes");

const router = express.Router();

router.use("/api/v1", v1Routes);

// Alias legacy/UX: permite POST /api/docs/export (sin versión en path).
// Mantiene misma lógica y middlewares que /api/v1/docs/export.
router.use("/api/docs", tenantResolutionMiddleware, docsExportRoutes);

module.exports = router;
