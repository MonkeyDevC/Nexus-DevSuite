/**
 * Módulo Incidents - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const createIncidentValidator = [
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 255 }),
  body("description").optional({ nullable: true }).trim(),
  body("severity").optional().isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
];

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];

const incidentIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const patchIncidentStatusValidator = [
  param("id").isUUID(),
  body("status").notEmpty().isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  body("root_cause_analysis").optional({ nullable: true }).trim()
];

const patchIncidentValidator = [
  param("id").isUUID(),
  body("assigned_to").optional({ nullable: true }).isUUID(),
  body("root_cause_analysis").optional({ nullable: true }).trim()
];

const listIncidentsQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
];

module.exports = {
  createIncidentValidator,
  projectIdParamValidator,
  incidentIdParamValidator,
  patchIncidentStatusValidator,
  patchIncidentValidator,
  listIncidentsQueryValidator
};
