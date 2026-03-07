const express = require("express");
const { getCurrentController, getByIdController, patchController } = require("./organization.controller");
const { organizationIdParamValidator, patchOrganizationValidator } = require("./organization.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.get("/current", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), getCurrentController);
router.get("/:id", authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE"), organizationIdParamValidator, getByIdController);
router.patch("/:id", authenticateMiddleware, authorizeMiddleware("MASTER"), patchOrganizationValidator, patchController);

module.exports = router;
