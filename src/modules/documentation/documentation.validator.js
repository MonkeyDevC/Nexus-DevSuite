/**
 * ----
 * Módulo: Documentation Validator
 * Descripción: Validación express-validator para API documentation_contents.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const { body, param, query } = require("express-validator");

const documentationIdParamValidator = [param("id").isUUID().withMessage("id debe ser UUID")];

const createDocumentationValidator = [
  body("type").isIn(["functional", "technical"]).withMessage("type debe ser functional|technical"),
  body("format").optional().isIn(["html", "markdown"]).withMessage("format debe ser html|markdown"),
  body("content").isString().notEmpty().withMessage("content es obligatorio"),
  body("title").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("project_id").optional({ nullable: true }).isUUID().withMessage("project_id debe ser UUID")
];

const listDocumentationQueryValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("project_id").optional().isUUID(),
  query("type").optional().isIn(["functional", "technical"]),
  query("status").optional().isIn(["ACTIVE", "ARCHIVED"]),
  query("include_archived").optional().isBoolean().toBoolean()
];

const patchDocumentationValidator = [
  body("content").optional().isString().notEmpty(),
  body("title").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("format").optional().isIn(["html", "markdown"]),
  body("type").optional().isIn(["functional", "technical"]),
  body("project_id").optional({ nullable: true }).isUUID(),
  body("status").optional().isIn(["ACTIVE", "ARCHIVED"])
];

module.exports = {
  documentationIdParamValidator,
  createDocumentationValidator,
  listDocumentationQueryValidator,
  patchDocumentationValidator
};
