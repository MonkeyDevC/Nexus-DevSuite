/**
 * Módulo Sprints - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const createSprintValidator = [
  body("name").trim().notEmpty().withMessage("name es obligatorio").isLength({ max: 255 }),
  body("goal").optional({ nullable: true }).trim(),
  body("start_date").notEmpty().withMessage("start_date es obligatoria").isISO8601({ strict: false }),
  body("end_date").notEmpty().withMessage("end_date es obligatoria").isISO8601({ strict: false })
];

const createSprintRootValidator = [
  body("project_id").isUUID().withMessage("project_id debe ser UUID"),
  body("name").trim().notEmpty().withMessage("name es obligatorio").isLength({ max: 255 }),
  body("goal").optional({ nullable: true }).trim(),
  body("start_date").notEmpty().withMessage("start_date es obligatoria").isISO8601({ strict: false }),
  body("end_date").notEmpty().withMessage("end_date es obligatoria").isISO8601({ strict: false })
];

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];

const sprintIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const patchSprintStatusValidator = [
  param("id").isUUID(),
  body("status").notEmpty().isIn(["PLANNED", "IN_PROGRESS", "CLOSED"])
];

const patchSprintValidator = [
  param("id").isUUID(),
  body("name").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
  body("goal").optional({ nullable: true }).trim(),
  body("start_date").optional({ nullable: true }).isISO8601({ strict: false }),
  body("end_date").optional({ nullable: true }).isISO8601({ strict: false })
];

const putSprintValidator = patchSprintValidator;

const storyIdParamValidator = [param("storyId").isUUID().withMessage("storyId debe ser UUID")];

const listSprintsQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(["PLANNED", "IN_PROGRESS", "CLOSED"])
];

const listSprintsRootQueryValidator = [
  query("project_id").notEmpty().isUUID().withMessage("project_id query obligatorio y UUID"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(["PLANNED", "IN_PROGRESS", "CLOSED"])
];

module.exports = {
  createSprintValidator,
  createSprintRootValidator,
  projectIdParamValidator,
  sprintIdParamValidator,
  patchSprintStatusValidator,
  patchSprintValidator,
  putSprintValidator,
  storyIdParamValidator,
  listSprintsQueryValidator,
  listSprintsRootQueryValidator
};
