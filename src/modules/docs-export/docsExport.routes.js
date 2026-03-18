const express = require("express");
const { body } = require("express-validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { exportDocsController } = require("./docsExport.controller");

const router = express.Router();

router.post(
  "/export",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  body("type").isIn(["functional", "technical", "all"]).withMessage("type debe ser functional|technical|all"),
  body("projectId").optional().isUUID().withMessage("projectId debe ser UUID"),
  body("deliveryId").optional().isUUID().withMessage("deliveryId debe ser UUID"),
  body("contentHtml").optional().isString().withMessage("contentHtml debe ser string"),
  body("contentHtmlFunctional").optional().isString(),
  body("contentHtmlTechnical").optional().isString(),
  exportDocsController
);

module.exports = router;

