const express = require("express");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { devResetDummyDataController } = require("./devTools.controller");

const router = express.Router();

// PELIGROSO: solo para development (gated en v1.routes + env flag).
router.post("/reset-dummy-data", authenticateMiddleware, authorizeMiddleware("MASTER"), devResetDummyDataController);

module.exports = router;

