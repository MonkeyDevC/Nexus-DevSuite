/**
 * Rutas de apoyo a la barra de búsqueda global (SPA).
 */

const express = require("express");
const { getResolveHumanWorkItemCodeController } = require("./workspaceNav.controller");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get(
  "/resolve-item-code",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  getResolveHumanWorkItemCodeController
);

module.exports = router;
