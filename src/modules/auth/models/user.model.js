const { DataTypes } = require("sequelize");
const { defineUserModel: defineUsersModuleUserModel } = require("../../users/models");

function defineUserModel(sequelize) {
  // Decision de arquitectura: auth reutiliza el User oficial del modulo users.
  return defineUsersModuleUserModel(sequelize, DataTypes);
}

module.exports = defineUserModel;
