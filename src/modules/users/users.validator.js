/**
 * Modulo Users - Capa Validator
 * Responsabilidad: validar y sanear entrada de endpoints de usuarios.
 */

const { body, param, query } = require("express-validator");

const userIdParamValidator = [
  param("id").isUUID().withMessage("El id debe ser UUID valido")
];

const createUserValidator = [
  body("email")
    .isString()
    .withMessage("El email es obligatorio")
    .bail()
    .isEmail()
    .withMessage("Formato de email invalido")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("La contrasena es obligatoria")
    .bail()
    .isLength({ min: 8 })
    .withMessage("La contrasena debe tener al menos 8 caracteres"),
  body("role_id")
    .isUUID()
    .withMessage("El role_id debe ser UUID valido"),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("name debe ser string máximo 255"),
  body("profile_photo_url")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 512 })
    .withMessage("profile_photo_url debe ser string máximo 512"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser booleano")
];

const updateUserValidator = [
  ...userIdParamValidator,
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("name debe ser string máximo 255"),
  body("profile_photo_url")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 512 })
    .withMessage("profile_photo_url debe ser string máximo 512"),
  body("email")
    .optional()
    .isString()
    .withMessage("El email debe ser string")
    .bail()
    .isEmail()
    .withMessage("Formato de email invalido")
    .normalizeEmail(),
  body("password")
    .optional()
    .isString()
    .withMessage("La contrasena debe ser string")
    .bail()
    .isLength({ min: 8 })
    .withMessage("La contrasena debe tener al menos 8 caracteres"),
  body("role_id")
    .optional()
    .isUUID()
    .withMessage("El role_id debe ser UUID valido"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser booleano")
];

const listUsersValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page debe ser entero mayor o igual a 1")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("limit debe ser entero mayor o igual a 1")
    .toInt(),
  query("email")
    .optional()
    .isString()
    .withMessage("email debe ser texto"),
  query("role_id")
    .optional()
    .isUUID()
    .withMessage("role_id debe ser UUID valido"),
  query("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser booleano")
    .toBoolean()
];

const deleteUserValidator = [...userIdParamValidator];
const changePasswordValidator = [
  ...userIdParamValidator,
  body("current_password")
    .optional()
    .isString()
    .withMessage("current_password debe ser string")
    .bail()
    .isLength({ min: 1 })
    .withMessage("current_password no puede estar vacio"),
  body("new_password")
    .isString()
    .withMessage("new_password es obligatorio")
    .bail()
    .isLength({ min: 8 })
    .withMessage("new_password debe tener al menos 8 caracteres")
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  listUsersValidator,
  deleteUserValidator,
  changePasswordValidator,
  userIdParamValidator
};
