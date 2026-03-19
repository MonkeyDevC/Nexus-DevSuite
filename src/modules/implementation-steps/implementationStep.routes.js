const express = require("express");
const {
  createStepController,
  getStepController,
  listByTaskController,
  listByWorkOrderController,
  startStepController,
  completeStepController,
  failStepController,
  updateStepController
} = require("./implementationStep.controller");
const {
  projectIdParamValidator,
  taskIdParamValidator,
  workOrderIdParamValidator,
  stepIdParamValidator,
  createStepValidator,
  updateStepValidator,
  listStepsQueryValidator
} = require("./implementationStep.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  workOrderIdParamValidator,
  listStepsQueryValidator,
  listByWorkOrderController
);

router.post(
  "/tasks/:taskId/steps",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  taskIdParamValidator,
  workOrderIdParamValidator,
  createStepValidator,
  createStepController
);

router.get(
  "/tasks/:taskId/steps",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  taskIdParamValidator,
  listStepsQueryValidator,
  listByTaskController
);

router.get(
  "/steps/:stepId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  stepIdParamValidator,
  getStepController
);

router.patch(
  "/steps/:stepId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  stepIdParamValidator,
  updateStepValidator,
  updateStepController
);

router.post(
  "/steps/:stepId/start",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  stepIdParamValidator,
  startStepController
);

router.post(
  "/steps/:stepId/complete",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  stepIdParamValidator,
  completeStepController
);

router.post(
  "/steps/:stepId/fail",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  stepIdParamValidator,
  failStepController
);

module.exports = router;
