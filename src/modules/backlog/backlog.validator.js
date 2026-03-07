/**
 * Módulo Backlog - Validadores de entrada para projects, features, stories.
 */

const { body, param, query } = require("express-validator");

const createProjectValidator = [
  body("name").trim().notEmpty().withMessage("name es obligatorio").isLength({ max: 255 }),
  body("description").trim().notEmpty().withMessage("description es obligatorio")
];

const projectIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];
const projectIdAsParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];

const createFeatureValidator = [
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 500 }),
  body("description").trim().notEmpty().withMessage("description es obligatorio"),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
];

const featureIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];
const featureIdAsParamValidator = [param("featureId").isUUID().withMessage("featureId debe ser UUID")];

const patchFeatureStatusValidator = [
  param("id").isUUID(),
  body("status").notEmpty().isIn(["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"]),
  body("change_request_id").optional().isUUID()
];

const createStoryValidator = [
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 500 }),
  body("description").trim().notEmpty().withMessage("description es obligatorio"),
  body("acceptance_criteria").optional().isObject(),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
];

const storyIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const patchStoryStatusValidator = [
  param("id").isUUID(),
  body("status").notEmpty().isIn(["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"])
];

const patchStoryAssignValidator = [
  param("id").isUUID(),
  body("assigned_to").optional({ nullable: true }).isUUID().withMessage("assigned_to debe ser UUID o null")
];

const listQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().trim()
];

module.exports = {
  createProjectValidator,
  projectIdParamValidator,
  projectIdAsParamValidator,
  createFeatureValidator,
  featureIdParamValidator,
  featureIdAsParamValidator,
  patchFeatureStatusValidator,
  createStoryValidator,
  storyIdParamValidator,
  patchStoryStatusValidator,
  patchStoryAssignValidator,
  listQueryValidator
};
