const express = require("express");
const {
  createWorkOrderController,
  getWorkOrderController,
  listWorkOrdersController,
  updateWorkOrderController,
  deleteWorkOrderController
} = require("./workOrder.controller");
const {
  projectIdParamValidator,
  workOrderIdParamValidator,
  createWorkOrderValidator,
  updateWorkOrderValidator,
  listWorkOrdersQueryValidator
} = require("./workOrder.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  listWorkOrdersQueryValidator,
  listWorkOrdersController
);

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  createWorkOrderValidator,
  createWorkOrderController
);

router.get(
  "/:workOrderId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  workOrderIdParamValidator,
  getWorkOrderController
);

router.patch(
  "/:workOrderId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  workOrderIdParamValidator,
  updateWorkOrderValidator,
  updateWorkOrderController
);

router.delete(
  "/:workOrderId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  workOrderIdParamValidator,
  deleteWorkOrderController
);

module.exports = router;
