const defineRuleExecutionModel = require("./ruleExecution.model");

module.exports = function defineRuleExecutionModels(sequelize) {
  const RuleExecution = defineRuleExecutionModel(sequelize);
  return { RuleExecution };
};
