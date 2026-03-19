/**
 * Delivery Workspace — Validadores
 */

const { param, body, query } = require("express-validator");

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];
const deliveryIdParamValidator = [param("deliveryId").isUUID().withMessage("deliveryId debe ser UUID")];
const fileIdParamValidator = [param("fileId").isUUID().withMessage("fileId debe ser UUID")];

const addFileValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("file_path").trim().notEmpty().withMessage("file_path es obligatorio").isLength({ max: 1024 }),
  body("content").optional({ nullable: true }),
  body("content_base64").optional({ nullable: true }),
  body("status").optional().isIn(["ADDED", "MODIFIED", "DELETED", "RENAMED", "COPIED"])
];

const updateFileValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  param("fileId").isUUID(),
  body("file_path").optional().trim().isLength({ max: 1024 }),
  body("content").optional({ nullable: true }),
  body("content_base64").optional({ nullable: true }),
  body("status").optional().isIn(["ADDED", "MODIFIED", "DELETED", "RENAMED", "COPIED"])
];

const commitDeliveryValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("commit_message").optional().trim().isLength({ max: 2000 }),
  body("selected_file_paths").optional().isArray().withMessage("selected_file_paths debe ser un array"),
  body("selected_file_paths.*").optional().trim().isLength({ max: 1024 }),
  body("create_pr").optional().isBoolean()
];

const syncFromGitValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("stagedOnly").optional({ values: "falsy" }).isBoolean()
];

const releaseNotesValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  query("otherDeliveryId").isUUID().withMessage("otherDeliveryId (base delivery) es obligatorio para comparar")
];

const commitPreviewValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("selected_file_paths").optional().isArray(),
  body("selected_file_paths.*").optional().trim().isLength({ max: 1024 })
];

const addReviewCommentValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("file_path").trim().notEmpty().withMessage("file_path es obligatorio").isLength({ max: 1024 }),
  body("body").trim().notEmpty().withMessage("body es obligatorio").isLength({ max: 10000 }),
  body("line_number").optional().isInt({ min: 0 }).toInt(),
  body("parent_id").optional().isUUID()
];

const submitReviewValidator = [
  param("projectId").isUUID(),
  param("deliveryId").isUUID(),
  body("status").isIn(["APPROVED", "CHANGES_REQUESTED"]).withMessage("status debe ser APPROVED o CHANGES_REQUESTED")
];

module.exports = {
  commitPreviewValidator,
  releaseNotesValidator,
  addReviewCommentValidator,
  submitReviewValidator,
  projectIdParamValidator,
  deliveryIdParamValidator,
  fileIdParamValidator,
  addFileValidator,
  updateFileValidator,
  commitDeliveryValidator,
  syncFromGitValidator
};
