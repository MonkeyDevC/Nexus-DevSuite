const express = require("express");
const { loginController, refreshController, logoutController } = require("./auth.controller");
const { meController, adminTestController } = require("./context.controller");
const { listRolesController } = require("./roles.controller");
const { loginValidator, refreshValidator, logoutValidator } = require("./auth.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post("/login", loginValidator, loginController);
router.post("/refresh", refreshValidator, refreshController);
router.post("/logout", logoutValidator, logoutController);
router.get("/me", authenticateMiddleware, meController);
router.get("/roles", authenticateMiddleware, authorizeMiddleware("MASTER"), listRolesController);
router.get("/admin/test", authenticateMiddleware, authorizeMiddleware("MASTER"), adminTestController);

module.exports = router;
