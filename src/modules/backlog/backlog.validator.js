/**
 * Módulo Backlog - Validadores de entrada para projects, features, stories.
 */

const { body, param, query } = require("express-validator");

const createProjectValidator = [
  body("name").trim().notEmpty().withMessage("name es obligatorio").isLength({ max: 255 }),
  body("description").trim().notEmpty().withMessage("description es obligatorio")
];

const updateProjectValidator = [
  body("name").optional().trim().notEmpty().withMessage("name no puede estar vacío").isLength({ max: 255 }),
  body("description").optional().trim().notEmpty().withMessage("description no puede estar vacío")
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

const patchFeatureValidator = [
  param("id").isUUID(),
  body("title").optional().trim().notEmpty().withMessage("title no puede estar vacío").isLength({ max: 500 }),
  body("description").optional().trim().notEmpty().withMessage("description no puede estar vacío"),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  body("backlog_position").optional({ nullable: true }).isInt({ min: 0 }).withMessage("backlog_position debe ser entero >= 0")
];

const STORY_POINTS_VALID = [1, 2, 3, 5, 8, 13, 21];

const createStoryValidator = [
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 500 }),
  body("description").trim().notEmpty().withMessage("description es obligatorio"),
  body("acceptance_criteria").optional().isObject(),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  body("assigned_to").optional({ nullable: true }).isUUID().withMessage("assigned_to debe ser UUID o null"),
  body("story_points").optional({ nullable: true }).isInt({ min: 1, max: 100 }).custom((v) => v == null || STORY_POINTS_VALID.includes(Number(v))).withMessage("story_points debe ser uno de: 1, 2, 3, 5, 8, 13, 21"),
  body("labels").optional({ nullable: true }).isArray().withMessage("labels debe ser un array de strings"),
  body("labels.*").optional().isString().trim().isLength({ max: 50 })
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

const patchStorySprintValidator = [
  param("id").isUUID(),
  body("sprint_id").optional({ nullable: true }).isUUID().withMessage("sprint_id debe ser UUID o null")
];

const patchStoryValidator = [
  param("id").isUUID(),
  body("title").optional().trim().notEmpty().withMessage("title no puede estar vacío").isLength({ max: 500 }),
  body("description").optional().trim().notEmpty().withMessage("description no puede estar vacío"),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  body("assigned_to").optional({ nullable: true }).isUUID().withMessage("assigned_to debe ser UUID o null"),
  body("story_points").optional({ nullable: true }).isInt({ min: 1, max: 100 }).custom((v) => v == null || v === "" || STORY_POINTS_VALID.includes(Number(v))).withMessage("story_points debe ser uno de: 1, 2, 3, 5, 8, 13, 21"),
  body("labels").optional({ nullable: true }).isArray().withMessage("labels debe ser un array de strings"),
  body("labels.*").optional().isString().trim().isLength({ max: 50 }),
  body("backlog_position").optional({ nullable: true }).isInt({ min: 0 }).withMessage("backlog_position debe ser entero >= 0"),
  body("acceptance_criteria")
    .optional({ nullable: true })
    .custom(function (val) { return val === null || val === undefined || typeof val === "object"; })
    .withMessage("acceptance_criteria debe ser un objeto o array JSON"),
  body("implementation_criteria")
    .optional({ nullable: true })
    .custom(function (val) { return val === null || val === undefined || typeof val === "object"; })
    .withMessage("implementation_criteria debe ser un objeto o array JSON")
];

const listQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().trim()
];

const bulkDeleteProjectsValidator = [
  body("ids")
    .isArray({ min: 1, max: 100 })
    .withMessage("ids debe ser un array con entre 1 y 100 UUIDs"),
  body("ids.*").isUUID().withMessage("Cada id debe ser un UUID válido")
];

const reorderBacklogValidator = [
  body("feature_ids").optional().isArray().withMessage("feature_ids debe ser un array"),
  body("feature_ids.*").optional().isUUID().withMessage("Cada feature_id debe ser UUID"),
  body("story_ids").optional().isArray().withMessage("story_ids debe ser un array"),
  body("story_ids.*").optional().isUUID().withMessage("Cada story_id debe ser UUID")
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator,
  projectIdAsParamValidator,
  bulkDeleteProjectsValidator,
  createFeatureValidator,
  featureIdParamValidator,
  featureIdAsParamValidator,
  patchFeatureValidator,
  patchFeatureStatusValidator,
  createStoryValidator,
  storyIdParamValidator,
  patchStoryStatusValidator,
  patchStoryAssignValidator,
  patchStorySprintValidator,
  patchStoryValidator,
  listQueryValidator,
  bulkDeleteProjectsValidator,
  reorderBacklogValidator
};
