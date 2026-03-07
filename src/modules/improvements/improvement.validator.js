/**
 * Módulo Improvements - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const createImprovementValidator = [
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 255 }),
  body("description").optional({ nullable: true }).trim(),
  body("project_id").optional({ nullable: true }).isUUID(),
  body("incident_id").optional({ nullable: true }).isUUID()
];

const improvementIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const patchImprovementStatusValidator = [
  param("id").isUUID(),
  body("status").notEmpty().isIn(["DRAFT", "PROPOSED", "APPROVED", "REJECTED", "IMPLEMENTED"])
];

const listImprovementsQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("project_id").optional().isUUID(),
  query("incident_id").optional().isUUID(),
  query("status").optional().isIn(["DRAFT", "PROPOSED", "APPROVED", "REJECTED", "IMPLEMENTED"])
];

module.exports = {
  createImprovementValidator,
  improvementIdParamValidator,
  patchImprovementStatusValidator,
  listImprovementsQueryValidator
};
