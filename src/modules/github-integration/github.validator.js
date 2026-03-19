const { param, body, query } = require("express-validator");

const projectIdParamValidator = [param("projectId").isUUID().withMessage("projectId debe ser UUID")];

const avatarProxyValidator = [
  param("projectId").isUUID().withMessage("projectId debe ser UUID"),
  query("userId").notEmpty().withMessage("userId es requerido").isString().matches(/^\d+$/).withMessage("userId debe ser numérico (GitHub user id)")
];

const createBranchValidator = [
  param("projectId").isUUID(),
  body("delivery_id").optional().isUUID(),
  body("base_branch").optional().trim().isLength({ min: 1, max: 255 }),
  body("new_branch").optional().trim().isLength({ min: 1, max: 255 })
];

const createPRValidator = [
  param("projectId").isUUID(),
  body("delivery_id").optional().isUUID(),
  body("title").optional().trim().isLength({ max: 500 }),
  body("head_branch").optional().trim().isLength({ min: 1, max: 255 }),
  body("base_branch").optional().trim().isLength({ max: 255 }),
  body("body").optional().trim()
];

const syncValidator = [
  param("projectId").isUUID(),
  body("delivery_id").optional().isUUID()
];

module.exports = {
  projectIdParamValidator,
  avatarProxyValidator,
  createBranchValidator,
  createPRValidator,
  syncValidator
};
