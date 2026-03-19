/**
 * Módulo Code Deliveries - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];
const taskIdParamValidator = [param("taskId").isUUID().withMessage("taskId debe ser UUID")];
const deliveryIdParamValidator = [param("deliveryId").isUUID().withMessage("deliveryId debe ser UUID")];

const createCodeDeliveryValidator = [
  param("projectId").isUUID(),
  body("task_id").isUUID().withMessage("task_id es obligatorio"),
  body("work_order_id").optional({ nullable: true }).isUUID(),
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("delivery_type").optional().isIn(["FEATURE", "BUGFIX", "REFACTOR", "HOTFIX"]),
  body("commit_hash").optional({ nullable: true }).trim().isLength({ max: 64 }),
  body("pull_request_url").optional({ nullable: true }).trim().isLength({ max: 500 })
];

const updateCodeDeliveryValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("title").optional().trim().isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("branch_name").optional({ nullable: true }).trim().isLength({ max: 255 }),
  body("commit_hash").optional({ nullable: true }).trim().isLength({ max: 64 }),
  body("pull_request_url").optional({ nullable: true }).trim().isLength({ max: 500 }),
  body("delivery_type").optional().isIn(["FEATURE", "BUGFIX", "REFACTOR", "HOTFIX"]),
  body("status").optional().isIn(["PREPARING", "DRAFT", "READY", "LOCKED", "COMMITTED", "PR_CREATED", "MERGED"])
];

const listCodeDeliveriesQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["PREPARING", "DRAFT", "READY", "LOCKED", "COMMITTED", "PR_CREATED", "MERGED"]),
  query("task_id").optional().isUUID(),
  query("user_story_id").optional().isUUID()
];

module.exports = {
  projectIdParamValidator,
  taskIdParamValidator,
  deliveryIdParamValidator,
  createCodeDeliveryValidator,
  updateCodeDeliveryValidator,
  listCodeDeliveriesQueryValidator
};
