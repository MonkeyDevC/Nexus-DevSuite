/**
 * Módulo Reports - Validadores de query params y params
 */

const { param, query } = require("express-validator");

const projectIdParam = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];
const sprintIdParam = [param("sprintId").isUUID().withMessage("sprintId debe ser UUID")];
const userIdParam = [param("userId").isUUID().withMessage("userId debe ser UUID")];

const auditQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("entity").optional().trim().isLength({ max: 100 }),
  query("entity_id").optional().trim().isLength({ max: 100 }),
  query("user_id").optional().isUUID(),
  query("action").optional().trim().isLength({ max: 100 })
];

const activityQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("action").optional().trim().isLength({ max: 100 })
];

module.exports = {
  projectIdParam,
  sprintIdParam,
  userIdParam,
  auditQueryValidator,
  activityQueryValidator
};
