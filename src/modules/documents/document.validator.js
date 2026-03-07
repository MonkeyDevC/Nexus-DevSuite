/**
 * Módulo Documents - Validadores de entrada
 */

const { body, param, query } = require("express-validator");

const createDocumentValidator = [
  body("code").trim().notEmpty().withMessage("code es obligatorio").isLength({ max: 50 }),
  body("title").trim().notEmpty().withMessage("title es obligatorio").isLength({ max: 255 }),
  body("description").optional({ nullable: true }).trim(),
  body("project_id").optional({ nullable: true }).isUUID(),
  body("content").optional({ nullable: true })
];

const documentIdParamValidator = [param("documentId").isUUID().withMessage("documentId debe ser UUID")];
const idParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];
const versionIdParamValidator = [param("versionId").isUUID().withMessage("versionId debe ser UUID")];
const codeParamValidator = [param("code").trim().notEmpty().withMessage("code es obligatorio")];

const createVersionValidator = [
  body("change_reason").optional({ nullable: true }).trim(),
  body("content").optional({ nullable: true })
];

const patchVersionStatusValidator = [
  param("documentId").isUUID(),
  param("versionId").isUUID(),
  body("status").notEmpty().isIn(["DRAFT", "APPROVED", "ARCHIVED"]),
  body("change_reason").optional({ nullable: true }).trim()
];

const patchVersionValidator = [
  param("documentId").isUUID(),
  param("versionId").isUUID(),
  body("change_reason").optional({ nullable: true }).trim(),
  body("content").optional({ nullable: true })
];

const listDocumentsQueryValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("project_id").optional().isUUID()
];

const listVersionsQueryValidator = [
  query("status").optional().isIn(["DRAFT", "APPROVED", "ARCHIVED"])
];

module.exports = {
  createDocumentValidator,
  documentIdParamValidator,
  idParamValidator,
  versionIdParamValidator,
  codeParamValidator,
  createVersionValidator,
  patchVersionStatusValidator,
  patchVersionValidator,
  listDocumentsQueryValidator,
  listVersionsQueryValidator
};
