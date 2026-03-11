/**
 * Módulo Releases - Validadores de entrada.
 */

const { body, param, query } = require("express-validator");

const createReleaseValidator = [
  body("version").trim().notEmpty().withMessage("version es obligatorio").isLength({ max: 50 }),
  body("description").optional().trim()
];

const releaseIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const patchReleaseStatusValidator = [
  param("id").isUUID(),
  body("status")
    .notEmpty()
    .isIn(["PLANNED", "IN_PROGRESS", "QA", "RELEASED", "ROLLED_BACK", "ARCHIVED"]),
  body("change_request_id").optional().isUUID()
];

const assignFeatureValidator = [
  param("id").isUUID().withMessage("release id debe ser UUID"),
  param("featureId").isUUID().withMessage("featureId debe ser UUID"),
  body("change_request_id").optional().isUUID()
];

const patchReleaseValidator = [
  param("id").isUUID(),
  body("description").optional().trim(),
  body("change_request_id").optional().isUUID()
];

const listReleasesQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().trim()
];

const hotfixValidator = [
  param("id").isUUID(),
  body("change_request_id").optional().isUUID()
];

const bulkDeleteReleasesValidator = [
  body("ids")
    .isArray({ min: 1, max: 100 })
    .withMessage("ids debe ser un array con entre 1 y 100 UUIDs"),
  body("ids.*").isUUID().withMessage("Cada id debe ser un UUID válido")
];

module.exports = {
  createReleaseValidator,
  releaseIdParamValidator,
  patchReleaseStatusValidator,
  assignFeatureValidator,
  patchReleaseValidator,
  listReleasesQueryValidator,
  hotfixValidator,
  bulkDeleteReleasesValidator
};
