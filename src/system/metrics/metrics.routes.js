const express = require("express");
const { getMetricsController } = require("./metrics.controller");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get("/metrics", authenticateMiddleware, authorizeMiddleware("MASTER"), getMetricsController);

module.exports = router;
