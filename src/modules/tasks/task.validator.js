/**
 * Módulo Tasks - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];
const taskIdParamValidator = [param("taskId").isUUID().withMessage("taskId debe ser UUID")];
const userStoryIdParamValidator = [param("userStoryId").isUUID().withMessage("userStoryId debe ser UUID")];

const createTaskValidator = [
  param("projectId").isUUID(),
  body("user_story_id").isUUID().withMessage("user_story_id es obligatorio"),
  body("work_order_id").optional({ nullable: true }).isUUID(),
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("assigned_to_user_id").optional({ nullable: true }).isUUID(),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH"]),
  body("estimated_hours").optional({ nullable: true }).isInt({ min: 0 })
];

const updateTaskValidator = [
  param("projectId").isUUID(),
  param("taskId").isUUID(),
  body("title").optional().trim().isLength({ max: 500 }),
  body("description").optional({ nullable: true }).trim(),
  body("status").optional().isIn(["PENDING", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"]),
  body("assigned_to_user_id").optional({ nullable: true }).isUUID(),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH"]),
  body("estimated_hours").optional({ nullable: true }).isInt({ min: 0 })
];

const listTasksQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(["PENDING", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"]),
  query("user_story_id").optional().isUUID(),
  query("work_order_id").optional().isUUID()
];

module.exports = {
  projectIdParamValidator,
  taskIdParamValidator,
  userStoryIdParamValidator,
  createTaskValidator,
  updateTaskValidator,
  listTasksQueryValidator
};
