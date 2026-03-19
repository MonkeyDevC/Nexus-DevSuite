"use strict";

const { body } = require("express-validator");

const parseRuleValidator = [
  body("text")
    .exists()
    .withMessage("text es requerido")
    .isString()
    .withMessage("text debe ser un string")
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage("text debe estar entre 5 y 2000 caracteres")
];

module.exports = {
  parseRuleValidator
};

