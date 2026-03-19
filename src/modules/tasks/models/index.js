const defineTaskModel = require("./task.model");

function defineTaskModels(sequelize) {
  const Task = defineTaskModel(sequelize);
  return { Task };
}

module.exports = defineTaskModels;
