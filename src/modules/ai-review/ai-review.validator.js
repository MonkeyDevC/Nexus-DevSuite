const { param, query } = require("express-validator");

const deliveryIdParamValidator = [param("deliveryId").isUUID().withMessage("deliveryId debe ser UUID")];
const projectIdQueryValidator = [query("project_id").isUUID().withMessage("project_id (query) es requerido para la revisión")];

module.exports = {
  deliveryIdParamValidator,
  projectIdQueryValidator
};
