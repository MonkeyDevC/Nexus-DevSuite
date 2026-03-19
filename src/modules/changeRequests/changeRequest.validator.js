/**
 * Módulo ChangeRequest - Validadores de entrada.
 */

const { body, param, query } = require("express-validator");

const CR_TYPES = ["FEATURE", "BUGFIX", "HOTFIX", "IMPROVEMENT", "STRUCTURAL"];
const CR_IMPACT_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CR_ENTITY_TYPES = ["FEATURE", "RELEASE"];

const createChangeRequestValidator = [
  body("title").optional().trim().isLength({ max: 255 }),
  body("description").optional().trim(),
  body("type").optional().isIn(CR_TYPES),
  body("impact_level").optional().isIn(CR_IMPACT_LEVELS),
  body("entity_type").notEmpty().withMessage("entity_type es obligatorio").isIn(CR_ENTITY_TYPES),
  body("entity_id").notEmpty().withMessage("entity_id es obligatorio").isUUID()
];

const updateDraftChangeRequestValidator = [
  body("title").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("description").optional({ nullable: true }).isString(),
  body("type").optional({ nullable: true }).isIn(CR_TYPES),
  body("impact_level").optional({ nullable: true }).isIn(CR_IMPACT_LEVELS),
  body("entity_type").optional({ nullable: true }).isIn(CR_ENTITY_TYPES),
  body("entity_id").optional({ nullable: true }).isUUID()
];

const crIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];
const listChangeRequestsByProjectValidator = [
  query("project_id").notEmpty().withMessage("project_id es obligatorio").isUUID(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IMPLEMENTED"]),
  query("entity_type").optional().isIn(CR_ENTITY_TYPES)
];

module.exports = {
  createChangeRequestValidator,
  updateDraftChangeRequestValidator,
  crIdParamValidator,
  listChangeRequestsByProjectValidator
};
