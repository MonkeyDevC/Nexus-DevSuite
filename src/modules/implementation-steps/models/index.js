const defineImplementationStepModel = require("./implementationStep.model");

function defineImplementationStepModels(sequelize) {
  const ImplementationStep = defineImplementationStepModel(sequelize);
  return { ImplementationStep };
}

module.exports = defineImplementationStepModels;
