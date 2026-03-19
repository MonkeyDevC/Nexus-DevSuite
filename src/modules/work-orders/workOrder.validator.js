const { body, param, query } = require("express-validator");
const { WORK_ORDER_STATUSES, WORK_ORDER_PRIORITIES, ALL_ACCEPTED_STATUSES } = require("./workOrder.stateMachine");

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];
const workOrderIdParamValidator = [param("workOrderId").isUUID().withMessage("workOrderId debe ser UUID")];

const createWorkOrderValidator = [
  param("projectId").isUUID(),
  body("user_story_id").isUUID().withMessage("user_story_id es obligatorio"),
  body("title").optional().trim().isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("priority").optional().isIn(WORK_ORDER_PRIORITIES),
  body("assigned_to_user_id").optional({ nullable: true }).isUUID(),
  body("delivery_id").optional({ nullable: true }).isUUID()
];

const updateWorkOrderValidator = [
  param("projectId").isUUID(),
  param("workOrderId").isUUID(),
  body("title").optional().trim().isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("priority").optional().isIn(WORK_ORDER_PRIORITIES),
  body("assigned_to_user_id").optional({ nullable: true }).isUUID(),
  body("delivery_id").optional({ nullable: true }).isUUID(),
  body("status").optional().isIn(ALL_ACCEPTED_STATUSES),
  body("version").optional().isInt({ min: 0 }).toInt()
];

const listWorkOrdersQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(ALL_ACCEPTED_STATUSES),
  query("user_story_id").optional().isUUID()
];

module.exports = {
  projectIdParamValidator,
  workOrderIdParamValidator,
  createWorkOrderValidator,
  updateWorkOrderValidator,
  listWorkOrdersQueryValidator
};
