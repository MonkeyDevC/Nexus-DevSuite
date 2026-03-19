const { body, param, query } = require("express-validator");

const projectIdParamValidator = [param("projectId").isUUID()];
const taskIdParamValidator = [param("taskId").isUUID()];
const workOrderIdParamValidator = [param("workOrderId").isUUID()];
const stepIdParamValidator = [param("stepId").isUUID()];

const createStepValidator = [
  param("projectId").isUUID(),
  param("taskId").isUUID(),
  param("workOrderId").isUUID(),
  body("title").optional().trim().isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("cursor_execution_id").optional({ nullable: true }).trim().isLength({ max: 255 })
];

const updateStepValidator = [
  param("projectId").isUUID(),
  param("stepId").isUUID(),
  body("title").optional().trim().isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("status").optional().isIn(["PENDING", "RUNNING", "COMPLETED", "FAILED"]),
  body("cursor_execution_id").optional({ nullable: true }).trim(),
  body("retry_count").optional().isInt({ min: 0 })
];

const listStepsQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt()
];

module.exports = {
  projectIdParamValidator,
  taskIdParamValidator,
  workOrderIdParamValidator,
  stepIdParamValidator,
  createStepValidator,
  updateStepValidator,
  listStepsQueryValidator
};
