const { param, body } = require("express-validator");

const organizationIdParamValidator = [
  param("id").isUUID().withMessage("El id debe ser UUID válido")
];

const patchOrganizationValidator = [
  ...organizationIdParamValidator,
  body("name").optional().isString().trim().isLength({ max: 255 }).withMessage("name debe ser string máximo 255"),
  body("settings").optional().isObject().withMessage("settings debe ser objeto"),
  body("plan").optional().isString().trim().isLength({ max: 50 }).withMessage("plan máximo 50"),
  body("billing_email").optional().isEmail().withMessage("billing_email debe ser email válido"),
  body("next_billing_date").optional().isString().withMessage("next_billing_date debe ser string (YYYY-MM-DD)")
];

module.exports = {
  organizationIdParamValidator,
  patchOrganizationValidator
};
