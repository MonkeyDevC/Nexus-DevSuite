/**
 * Módulo Incidents - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const createIncidentValidator = [
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 255 }),
  body("description").optional({ nullable: true }).trim(),
  body("severity").notEmpty().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  body("priority").notEmpty().isIn(["LOW", "MEDIUM", "HIGH"]),
  body("story_id").optional({ values: "null" }).isUUID().withMessage("story_id debe ser UUID")
];

const createIncidentRootValidator = [
  body("project_id").isUUID().withMessage("project_id debe ser UUID"),
  ...createIncidentValidator
];

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];

const incidentIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const patchIncidentStatusValidator = [
  param("id").isUUID(),
  body("status").notEmpty().isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  body("root_cause_analysis").optional({ nullable: true }).trim()
];

const putIncidentValidator = [
  param("id").isUUID(),
  body("title").optional().trim().notEmpty().isLength({ max: 255 }),
  body("description").optional({ nullable: true }).trim(),
  body("severity").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH"]),
  body("story_id").optional({ values: "null" }).isUUID().withMessage("story_id debe ser UUID"),
  body("assigned_to").optional({ nullable: true }).isUUID(),
  body("root_cause_analysis").optional({ nullable: true }).trim()
];

const patchIncidentValidator = [...putIncidentValidator];

const listIncidentsQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
];

const listIncidentsRootQueryValidator = [
  query("project_id").notEmpty().isUUID().withMessage("project_id es obligatorio y debe ser UUID"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
];

const postIncidentCloseValidator = [
  param("id").isUUID(),
  body("root_cause_analysis").optional({ nullable: true }).trim()
];

module.exports = {
  createIncidentValidator,
  createIncidentRootValidator,
  projectIdParamValidator,
  incidentIdParamValidator,
  patchIncidentStatusValidator,
  patchIncidentValidator,
  putIncidentValidator,
  listIncidentsQueryValidator,
  listIncidentsRootQueryValidator,
  postIncidentCloseValidator
};
