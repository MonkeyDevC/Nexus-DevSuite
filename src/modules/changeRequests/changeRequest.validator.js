/**
 * Módulo ChangeRequest - Validadores de entrada.
 */

const { body, param } = require("express-validator");

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

const crIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

module.exports = {
  createChangeRequestValidator,
  crIdParamValidator
};
