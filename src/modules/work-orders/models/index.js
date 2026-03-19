const defineWorkOrderModel = require("./workOrder.model");

function defineWorkOrderModels(sequelize) {
  const WorkOrder = defineWorkOrderModel(sequelize);
  return { WorkOrder };
}

module.exports = defineWorkOrderModels;
