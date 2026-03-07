const { body } = require("express-validator");

const loginValidator = [
  body("email")
    .isString()
    .withMessage("El email es obligatorio")
    .bail()
    .isEmail()
    .withMessage("El email no tiene formato valido")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("La contrasena es obligatoria")
    .bail()
    .isLength({ min: 6 })
    .withMessage("La contrasena debe tener al menos 6 caracteres")
];

const refreshValidator = [
  body("refresh_token")
    .isString()
    .withMessage("El refresh_token es obligatorio")
    .bail()
    .isLength({ min: 32 })
    .withMessage("El refresh_token no es valido")
];

const logoutValidator = [
  body("refresh_token")
    .isString()
    .withMessage("El refresh_token es obligatorio")
    .bail()
    .isLength({ min: 32 })
    .withMessage("El refresh_token no es valido")
];

module.exports = {
  loginValidator,
  refreshValidator,
  logoutValidator
};
